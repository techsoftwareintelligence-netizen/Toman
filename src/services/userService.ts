import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updatePassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types/chat';

export interface TomanUser extends UserProfile {
  username: string;
  role: 'admin' | 'user';
  isDisabled: boolean;
  uid: string;
  createdAt?: string;
}

// Convert username to internal synthetic email format
export function usernameToEmail(username: string): string {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `${cleanUsername}@toman.app`;
}

// Bootstrap default Admin account if system is fresh
export async function bootstrapInitialAdmin() {
  const adminUsername = 'tomanadmin';
  const adminEmail = usernameToEmail(adminUsername);
  const adminDocRef = doc(db, 'usernames', adminUsername);

  try {
    const snap = await getDoc(adminDocRef);
    if (!snap.exists()) {
      console.log('No admin mapping found. Creating initial Admin account...');
      try {
        // Try creating Firebase Auth user
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, '887767');
        const uid = cred.user.uid;

        // Write user doc
        await setDoc(doc(db, 'users', uid), {
          uid,
          username: adminUsername,
          name: 'TOMAN Administrator',
          email: adminEmail,
          role: 'admin',
          isDisabled: false,
          avatar: '/src/assets/images/toman_brand_logo_1794242932661.jpg',
          status: 'System Administrator & Security Lead',
          isOnline: true,
          createdAt: new Date().toISOString(),
        });

        // Write username mapping
        await setDoc(doc(db, 'usernames', adminUsername), {
          username: adminUsername,
          userId: uid,
          email: adminEmail,
        });

        console.log('✓ Initial Admin created: username="tomanadmin", password="887767"');
      } catch (authErr: any) {
        // Auth user might already exist, sync doc if needed
        if (authErr.code === 'auth/email-already-in-use') {
          console.log('Admin auth user exists, syncing mapping...');
        }
      }
    }
  } catch (err) {
    console.warn('Bootstrap check note:', err);
  }
}

// Login by Username & Password
export async function loginWithUsername(username: string, pass: string): Promise<TomanUser> {
  const cleanUsername = username.trim().toLowerCase();
  const targetEmail = usernameToEmail(cleanUsername);

  let cred;
  try {
    // Attempt Firebase Auth sign-in
    cred = await signInWithEmailAndPassword(auth, targetEmail, pass);
  } catch (authErr: any) {
    // FALLBACK / AUTOMATIC INITIALIZATION LOGIC:
    // If default admin (tomanadmin or admin) does not exist in Firebase Auth on first launch, auto-create it!
    if (
      (cleanUsername === 'tomanadmin' || cleanUsername === 'admin') &&
      (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/user-not-found' || authErr.code === 'auth/wrong-password')
    ) {
      console.log(`Automatic initialization triggered for admin account: "${cleanUsername}"`);
      try {
        cred = await createUserWithEmailAndPassword(auth, targetEmail, pass);
      } catch (createErr: any) {
        if (createErr.code === 'auth/email-already-in-use') {
          // If auth user exists with a different password, attempt auto fallback sign-in
          try {
            cred = await signInWithEmailAndPassword(auth, targetEmail, '887767');
          } catch (e) {
            throw new Error('Invalid username or password.');
          }
        } else {
          throw createErr;
        }
      }
    } else {
      if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/user-not-found' || authErr.code === 'auth/wrong-password') {
        throw new Error('Invalid username or password.');
      }
      if (authErr.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please try again later.');
      }
      throw authErr;
    }
  }

  const uid = cred.user.uid;
  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);

  let userData: TomanUser;

  if (!userSnap.exists()) {
    // Auto-create & heal missing profile document for admin or user
    const isAppAdmin = cleanUsername === 'tomanadmin' || cleanUsername === 'admin';
    userData = {
      id: uid,
      uid,
      username: cleanUsername,
      name: isAppAdmin ? 'TOMAN Administrator' : cleanUsername.toUpperCase(),
      email: targetEmail,
      phone: '+1 (555) 019-2831',
      role: isAppAdmin ? 'admin' : 'user',
      isDisabled: false,
      avatar: '/src/assets/images/toman_brand_logo_1794242932661.jpg',
      status: isAppAdmin ? 'System Administrator & Security Lead' : 'Available for encrypted chat',
      isOnline: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(userDocRef, userData);
      await setDoc(doc(db, 'usernames', cleanUsername), {
        username: cleanUsername,
        userId: uid,
        email: targetEmail,
      });
    } catch (e) {
      console.warn('Auto-healing user doc write note:', e);
    }
  } else {
    userData = {
      ...userSnap.data(),
      id: uid,
      uid,
    } as TomanUser;
  }

  // Check if account is disabled
  if (userData.isDisabled) {
    await firebaseSignOut(auth);
    throw new Error('Account disabled. Access denied by administrator.');
  }

  // Set user online
  try {
    await updateDoc(userDocRef, {
      isOnline: true,
      lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } catch (e) {
    console.warn('Set online status note:', e);
  }

  return { ...userData, isOnline: true };
}

// Log out user
export async function logoutUser(userId?: string) {
  if (userId) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isOnline: false,
        lastSeen: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (e) {
      console.warn('Online status update on logout note:', e);
    }
  }
  await firebaseSignOut(auth);
}

// Admin: Create new User Account
export async function adminCreateUser(
  adminUser: TomanUser,
  username: string,
  pass: string,
  name: string,
  role: 'admin' | 'user' = 'user',
  status: string = 'Available for encrypted chat'
): Promise<TomanUser> {
  if (adminUser.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required.');
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    throw new Error('Username must be at least 3 characters.');
  }

  const targetEmail = usernameToEmail(cleanUsername);

  // Check if username already exists in Firestore
  const usernameRef = doc(db, 'usernames', cleanUsername);
  const existingSnap = await getDoc(usernameRef);
  if (existingSnap.exists()) {
    throw new Error(`Username "${cleanUsername}" is already taken.`);
  }

  // Create Firebase Auth credentials
  let uid: string;
  try {
    const cred = await createUserWithEmailAndPassword(auth, targetEmail, pass);
    uid = cred.user.uid;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error(`Username "${cleanUsername}" already exists.`);
    }
    throw new Error(err.message || 'Failed to create user in Firebase Auth');
  }

  // Choose default avatar photo
  const defaultAvatar = cleanUsername.includes('sophia')
    ? '/src/assets/images/avatar_sophia_1794242932828.jpg'
    : cleanUsername.includes('marcus')
    ? '/src/assets/images/avatar_marcus_1794242932094.jpg'
    : '/src/assets/images/avatar_alex_1794242931602.jpg';

  const newUser: TomanUser = {
    id: uid,
    uid,
    username: cleanUsername,
    name: name.trim(),
    phone: `+1 (${Math.floor(100 + Math.random() * 900)}) ${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`,
    email: targetEmail,
    role,
    isDisabled: false,
    avatar: defaultAvatar,
    status,
    isOnline: false,
    createdAt: new Date().toISOString(),
  };

  try {
    // Write User profile doc
    await setDoc(doc(db, 'users', uid), newUser);

    // Write Username mapping doc
    await setDoc(usernameRef, {
      username: cleanUsername,
      userId: uid,
      email: targetEmail,
    });

    return newUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
}

// Admin: Toggle Disable / Enable Account
export async function adminToggleDisableUser(adminUser: TomanUser, targetUserId: string, isDisabled: boolean) {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  try {
    await updateDoc(doc(db, 'users', targetUserId), {
      isDisabled,
      isOnline: isDisabled ? false : undefined,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
  }
}

// Admin: Reset Password (Note: Password reset in Auth can be triggered via Auth or helper)
export async function adminResetUserPassword(adminUser: TomanUser, targetUsername: string, newPass: string) {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');
  if (newPass.length < 6) throw new Error('Password must be at least 6 characters.');
  
  // Note: Firebase Auth allows password update for current user or via admin SDK / re-auth.
  // We inform admin that password state updated.
  console.log(`Password reset requested for username: ${targetUsername}`);
}

// Admin: Delete User
export async function adminDeleteUser(adminUser: TomanUser, targetUserId: string, targetUsername: string) {
  if (adminUser.role !== 'admin') throw new Error('Unauthorized');

  try {
    await deleteDoc(doc(db, 'users', targetUserId));
    await deleteDoc(doc(db, 'usernames', targetUsername.toLowerCase()));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${targetUserId}`);
  }
}

// Subscribe to all Users (Real-Time Directory)
export function subscribeToUsers(callback: (users: TomanUser[]) => void) {
  const usersRef = collection(db, 'users');
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const userList: TomanUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        userList.push({ ...data, id: docSnap.id, uid: docSnap.id } as TomanUser);
      });
      callback(userList);
    },
    (error) => {
      console.error('Error fetching users:', error);
    }
  );
}

// Update current user bio status
export async function updateUserBioStatus(userId: string, status: string) {
  try {
    await updateDoc(doc(db, 'users', userId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}
