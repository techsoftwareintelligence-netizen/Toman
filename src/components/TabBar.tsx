import React from 'react';
import { MessageSquare, Phone, Users, Settings } from 'lucide-react';
import { ActiveTab } from '../types/chat';

interface TabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unreadChatsCount: number;
  missedCallsCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  unreadChatsCount,
  missedCallsCount,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: unreadChatsCount },
    { id: 'calls', label: 'Calls', icon: Phone, badge: missedCallsCount },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="h-16 bg-slate-900/95 border-t border-slate-800 flex items-center justify-around px-2 sticky bottom-0 z-40 backdrop-blur-md shrink-0 pb-safe">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 min-h-[44px] transition-all relative group ${
              isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {/* Active Pill Accent */}
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-emerald-400 rounded-b-full shadow-sm shadow-emerald-400/50" />
            )}

            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              {!!tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-emerald-500 text-slate-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[11px] font-medium tracking-tight mt-1 whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
