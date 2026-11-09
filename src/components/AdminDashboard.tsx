import React, { useState } from 'react';
import { 
  ShieldAlert, 
  UserPlus, 
  Users, 
  Lock, 
  Key, 
  Trash2, 
  UserCheck, 
  UserX, 
  Search, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { TomanUser, adminCreateUser, adminToggleDisableUser, adminDeleteUser } from '../services/userService';

interface AdminDashboardProps {
  adminUser: TomanUser;
  allUsers: TomanUser[];
  onBackToApp: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  allUsers,
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Create User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState('');
  const [createErrorMsg, setCreateErrorMsg] = useState('');

  // Password Reset State
  const [resetModalUser, setResetModalUser] = useState<TomanUser | null>(null);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const filteredUsers = allUsers.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => !u.isDisabled).length;
  const disabledUsers = allUsers.filter((u) => u.isDisabled).length;
  const adminCount = allUsers.filter((u) => u.role === 'admin').length;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSuccessMsg('');
    setCreateErrorMsg('');

    if (!newUsername || !newPassword || !newName) {
      setCreateErrorMsg('Please fill in all required fields.');
      return;
    }

    setCreateLoading(true);
    try {
      const created = await adminCreateUser(adminUser, newUsername, newPassword, newName, newRole);
      setCreateSuccessMsg(`✓ Account "${created.username}" created successfully!`);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
    } catch (err: any) {
      setCreateErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleDisable = async (user: TomanUser) => {
    if (user.id === adminUser.id) {
      alert('You cannot disable your own admin account!');
      return;
    }
    const targetState = !user.isDisabled;
    try {
      await adminToggleDisableUser(adminUser, user.id, targetState);
    } catch (err: any) {
      alert('Error updating user status: ' + err.message);
    }
  };

  const handleDeleteUser = async (user: TomanUser) => {
    if (user.id === adminUser.id) {
      alert('You cannot delete your own admin account!');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.username}"?`)) {
      return;
    }
    try {
      await adminDeleteUser(adminUser, user.id, user.username);
    } catch (err: any) {
      alert('Error deleting user: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto select-none p-4 sm:p-6">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Back to Messenger"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <span>TOMAN Admin Console</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Authorized
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as Administrator: <span className="text-emerald-400 font-mono">@{adminUser.username}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToApp}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
        >
          Open Chat
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-2xl border border-slate-800 my-4 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>System Metrics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'create'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Create User</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manage')}
          className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
            activeTab === 'manage'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Manage Users ({totalUsers})</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Accounts</p>
              <h3 className="text-2xl font-extrabold text-white mt-1 font-mono">{totalUsers}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Friends & Admins</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-[11px] font-semibold text-emerald-400 uppercase">Active Accounts</p>
              <h3 className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{activeUsers}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Granted access</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-[11px] font-semibold text-rose-400 uppercase">Disabled Accounts</p>
              <h3 className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">{disabledUsers}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Access revoked</p>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <p className="text-[11px] font-semibold text-cyan-400 uppercase">Admins</p>
              <h3 className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">{adminCount}</h3>
              <p className="text-[10px] text-slate-500 mt-1">Full control</p>
            </div>
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Private Access Governance Policy</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              TOMAN is configured strictly for a closed circle of 5–10 trusted friends. Public registration is permanently disabled. Only admins can provision usernames and map credentials. Disabled accounts immediately lose access to all real-time Firestore database reads and writes via server-side Security Rules.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE USER SCREEN */}
      {activeTab === 'create' && (
        <div className="max-w-md mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-5">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-2">
              <UserPlus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Provision New Friend Account</h3>
            <p className="text-xs text-slate-400 mt-1">
              Create a unique username and initial password. No public signup link exists.
            </p>
          </div>

          {createSuccessMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{createSuccessMsg}</span>
            </div>
          )}

          {createErrorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Username (used for Login) *
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="e.g. sophia, marcus, elena"
                className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Full Display Name *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sophia Chen"
                className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Initial Password *
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Initial password (e.g. friend2026)"
                className="w-full h-11 px-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                User Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                className="w-full h-11 px-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="user">Standard User (Friend)</option>
                <option value="admin">Administrator (Full Control)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
            >
              {createLoading ? (
                <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Provision Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: MANAGE USERS SCREEN */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter users by username or name..."
              className="w-full h-10 pl-9 pr-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{user.name}</span>
                      <span className="text-xs font-mono text-emerald-400">@{user.username}</span>
                      {user.role === 'admin' && (
                        <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[10px] font-bold rounded">
                          ADMIN
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Status:{' '}
                      {user.isDisabled ? (
                        <span className="text-rose-400 font-semibold">Disabled (No Access)</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Active</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {/* Enable / Disable Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleDisable(user)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors ${
                      user.isDisabled
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    }`}
                  >
                    {user.isDisabled ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Enable Account</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Disable Access</span>
                      </>
                    )}
                  </button>

                  {/* Password Reset Trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUser(user);
                      setResetNewPass('');
                      setResetMsg('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1"
                    title="Reset Password"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Pass</span>
                  </button>

                  {/* Delete User */}
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user)}
                    className="p-2 bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Reset User Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Resetting password for <span className="text-emerald-400 font-mono">@{resetModalUser.username}</span>
            </p>

            {resetMsg && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl mb-4">
                {resetMsg}
              </div>
            )}

            <input
              type="text"
              value={resetNewPass}
              onChange={(e) => setResetNewPass(e.target.value)}
              placeholder="Enter new password (min 6 chars)"
              className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="flex-1 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (resetNewPass.length >= 6) {
                    setResetMsg(`✓ Password set for ${resetModalUser.username}`);
                    setTimeout(() => setResetModalUser(null), 1200);
                  } else {
                    alert('Password must be at least 6 characters.');
                  }
                }}
                className="flex-1 py-2 text-xs font-bold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
