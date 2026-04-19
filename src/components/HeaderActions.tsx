import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Bell, Settings, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export function HeaderActions() {
  const { currentUser, tasks, logs, families, setIsNotificationsModalOpen, logout } = useStore();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const activeTasksCount = tasks?.filter(t => !t.completed && (!t.assignedTo || t.assignedTo.length === 0 || t.assignedTo.includes(currentUser?.id || '')))?.length || 0;
  const unreadLogsCount = logs?.filter(l => l.userId !== currentUser?.id && (!currentUser?.dismissedLogs?.includes(l.id)))?.length || 0;
  const notificationsCount = activeTasksCount + unreadLogsCount;

  return (
    <>
      <button 
        onClick={() => setIsNotificationsModalOpen(true)}
        className="hidden md:flex relative bg-white rounded-2xl p-3 shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors"
      >
        <Bell className="w-6 h-6 text-stone-600" />
        {notificationsCount > 0 && (
          <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {notificationsCount}
          </span>
        )}
      </button>

      {/* Profile Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white shadow-sm hover:ring-2 hover:ring-[#5A8F5A] transition-all bg-[#E8F0E8]"
        >
          {currentUser?.avatar ? (
            <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-[#5A8F5A] font-bold text-lg">
              {currentUser?.name?.charAt(0) || '?'}
            </span>
          )}
        </button>

        {isProfileDropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-stone-100 mb-2">
                <p className="text-sm font-bold text-[#1A2E1A] truncate">{currentUser?.name}</p>
                <p className="text-xs text-stone-500 truncate">{families.find(f => f.id === currentUser?.familyId)?.name || 'Geen groep'}</p>
              </div>
              
              <Link 
                to="/profile"
                onClick={() => setIsProfileDropdownOpen(false)}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-stone-600 hover:bg-[#F5F7F4] hover:text-[#5A8F5A] transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Instellingen</span>
              </Link>
              
              <button 
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-bold text-stone-600 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Uitloggen</span>
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}