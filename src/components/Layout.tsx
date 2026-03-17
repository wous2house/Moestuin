import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { TreeDeciduous, ListTodo, Sprout, Settings, Plus, Leaf, Bell, X, AlertCircle, Wheat } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../lib/utils';

export default function Layout() {
  const { currentUser, tasks, logs, grid, users, isNotificationsModalOpen, setIsNotificationsModalOpen, dismissedLogs, dismissLog } = useStore();

  const activeTasks = tasks?.filter(t => !t.completed && (!t.assignedTo || t.assignedTo === currentUser?.id)) || [];
  const activeTasksCount = activeTasks.length;

  const unreadLogs = logs
    ?.filter(l => l.userId !== currentUser?.id && (!currentUser || !dismissedLogs?.[currentUser.id]?.includes(l.id)))
    ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

  const notificationsCount = activeTasksCount + unreadLogs.length;

  const getUser = (id: string | null) => users.find(u => u.id === id);

  const navItemsLeft = [
    { to: '/', icon: TreeDeciduous, label: 'Tuin' },    { to: '/tasks', icon: ListTodo, label: 'Taken' },
  ];
  
  const navItemsRight = [
    { to: '/harvests', icon: Wheat, label: 'Oogsten' },
    { to: '/plants', icon: Sprout, label: 'Gewassen' },
    { to: '/profile', icon: Settings, label: 'Instellingen' },
  ];

  const allNavItems = [...navItemsLeft, ...navItemsRight];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#EAF2EA] text-stone-900 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between z-50 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <img src="/logo-transparent.png" alt="Moestuin JTHV Logo" className="w-10 h-10 object-contain" />
          <span className="text-xl text-[#5A8F5A] font-bold tracking-wide">Moestuin JTHV</span>
        </div>
        <button 
          onClick={() => setIsNotificationsModalOpen(true)}
          className="relative bg-stone-50 rounded-full p-2.5 hover:bg-stone-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-stone-600" />
          {notificationsCount > 0 && (
            <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
              {notificationsCount}
            </span>
          )}
        </button>
      </header>

      {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 shadow-sm z-50">
        <div className="p-4 flex flex-col items-center justify-center w-full text-center">
          <img src="/logo-transparent.png" alt="Moestuin JTHV Logo" className="w-24 h-24 object-contain mb-2 drop-shadow-sm" />
          <span className="text-xl text-[#5A8F5A] font-serif font-bold tracking-wide">Moestuin JTHV</span>
        </div>

        <div className="px-6 mb-6">
          <Link to="/add" className="w-full bg-[#5A8F5A] text-white py-3 px-4 rounded-xl shadow-sm hover:bg-[#4A7A4A] transition-colors flex items-center justify-center space-x-2 font-bold">
            <Plus className="w-5 h-5" />
            <span>Nieuwe Plant</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar pb-4">
          {allNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-medium",
                  isActive 
                    ? "bg-[#E8F0E8] text-[#5A8F5A]" 
                    : "text-stone-500 hover:bg-stone-50 hover:text-stone-900"
                )
              }
            >
              <item.icon className={cn("w-5 h-5", item.label === 'Tuin' && "fill-current")} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 no-scrollbar relative">
        <Outlet />
      </main>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-24 right-6 z-40">
        <Link to="/add" className="bg-[#5A8F5A] text-white p-4 rounded-2xl shadow-lg shadow-[#5A8F5A]/40 hover:bg-[#4A7A4A] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </Link>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-20 max-w-md mx-auto px-2 pb-safe">
          
          {navItemsLeft.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center space-y-1 w-16 transition-colors",
                  isActive ? "text-[#5A8F5A]" : "text-stone-400 hover:text-stone-600"
                )
              }
            >
              <item.icon className={cn("w-6 h-6", item.label === 'Tuin' && "fill-current")} />
              <span className="text-[9px] font-bold uppercase tracking-wider truncate w-full text-center">{item.label}</span>
            </NavLink>
          ))}

          <button
            onClick={() => setIsNotificationsModalOpen(true)}
            className="flex flex-col items-center justify-center space-y-1 w-16 transition-colors text-stone-400 hover:text-[#5A8F5A] relative"
          >
            <div className="relative">
              <Bell className="w-6 h-6" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                  {notificationsCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider truncate w-full text-center">Meldingen</span>
          </button>

          {navItemsRight.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center space-y-1 w-16 transition-colors",
                  isActive ? "text-[#5A8F5A]" : "text-stone-400 hover:text-stone-600"
                )
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[9px] font-bold uppercase tracking-wider truncate w-full text-center">{item.label}</span>
            </NavLink>
          ))}

        </div>
      </nav>

      {/* Notifications Modal */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[80vh]">
            <button 
              onClick={() => setIsNotificationsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Meldingen</h2>
            <p className="text-sm text-stone-500 mb-6">Taken en recente activiteiten</p>

            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar space-y-6">
              {activeTasksCount > 0 ? (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Aan jou toegewezen taken</h3>
                  <div className="space-y-3">
                    {activeTasks.map(task => (
                      <div key={task.id} className="bg-red-50 border border-red-100 p-4 rounded-2xl">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-[#1A2E1A]">{task.title}</p>
                            <p className="text-xs text-stone-600 mt-1">{task.description}</p>
                            {task.dueDate && (
                              <p className="text-[10px] font-bold text-red-600 mt-2 uppercase tracking-wider">
                                Vervalt: {format(new Date(task.dueDate), 'd MMMM yyyy', { locale: nl })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Aan jou toegewezen taken</h3>
                  <p className="text-sm text-stone-500 italic">Je hebt geen openstaande taken.</p>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Recente Activiteit (Anderen)</h3>
                {unreadLogs.length > 0 ? (
                  <div className="space-y-3">
                    {unreadLogs.map(log => {
                      const logUser = getUser(log.userId);
                      const relatedCell = grid.find(c => c.id === log.cellId);
                      const cellName = relatedCell ? `${String.fromCharCode(65 + relatedCell.y)}${relatedCell.x + 1}` : '';
                      return (
                        <div key={log.id} className="relative flex items-center space-x-3 bg-[#F5F7F4] p-3 pr-10 rounded-xl border border-stone-100 group">
                          {logUser?.avatar ? (
                            <img src={logUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#E8F0E8] flex items-center justify-center text-xs font-bold text-[#5A8F5A]">
                              {logUser?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-xs font-bold text-[#1A2E1A]">{logUser?.name} heeft actie '{log.type}' uitgevoerd</p>
                            <p className="text-[10px] text-stone-500">In vak {cellName} • {format(new Date(log.date), 'd MMM HH:mm', { locale: nl })}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (currentUser) dismissLog(currentUser.id, log.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 italic">Geen nieuwe activiteiten van anderen.</p>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setIsNotificationsModalOpen(false)}
              className="mt-6 w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
