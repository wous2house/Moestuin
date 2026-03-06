import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home, ListTodo, BarChart2, Settings, Plus, Leaf } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
  const navItemsLeft = [
    { to: '/', icon: Home, label: 'Garden' },
    { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  ];
  
  const navItemsRight = [
    { to: '/plants', icon: BarChart2, label: 'Insights' },
    { to: '/profile', icon: Settings, label: 'Settings' },
  ];

  const allNavItems = [...navItemsLeft, ...navItemsRight];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#EAF2EA] text-stone-900 overflow-hidden font-sans">
      
      {/* Desktop/Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 shadow-sm z-50">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#E8F0E8] rounded-xl flex items-center justify-center text-[#5A8F5A]">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-[#1A2E1A]">Moestuin</span>
        </div>

        <div className="px-6 mb-8">
          <Link to="/add" className="w-full bg-[#5A8F5A] text-white py-3 px-4 rounded-xl shadow-sm hover:bg-[#4A7A4A] transition-colors flex items-center justify-center space-x-2 font-bold">
            <Plus className="w-5 h-5" />
            <span>Nieuwe Plant</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
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
              <item.icon className={cn("w-5 h-5", item.label === 'Garden' && "fill-current")} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 no-scrollbar relative">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-50 rounded-t-3xl">
        <div className="flex justify-between items-center h-20 max-w-md mx-auto px-6 relative">
          
          {/* Left Items */}
          <div className="flex space-x-8">
            {navItemsLeft.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center space-y-1 transition-colors w-12",
                    isActive ? "text-[#5A8F5A]" : "text-stone-400 hover:text-stone-600"
                  )
                }
              >
                <item.icon className={cn("w-6 h-6", item.label === 'Garden' && "fill-current")} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Center FAB */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6">
            <Link to="/add" className="bg-[#5A8F5A] text-white p-4 rounded-full shadow-lg shadow-[#5A8F5A]/30 hover:bg-[#4A7A4A] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center">
              <Plus className="w-8 h-8" />
            </Link>
          </div>

          {/* Right Items */}
          <div className="flex space-x-8">
            {navItemsRight.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center space-y-1 transition-colors w-12",
                    isActive ? "text-[#5A8F5A]" : "text-stone-400 hover:text-stone-600"
                  )
                }
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </NavLink>
            ))}
          </div>

        </div>
      </nav>
    </div>
  );
}
