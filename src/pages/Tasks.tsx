import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { CheckCircle2, Circle, Droplets, Scissors, Sprout, Wheat, MoreHorizontal } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function Tasks() {
  const { tasks, toggleTask, users } = useStore();

  const getIcon = (type: string) => {
    switch (type) {
      case 'Water': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'Snoei': return <Scissors className="w-5 h-5 text-stone-500" />;
      case 'Zaai': return <Sprout className="w-5 h-5 text-[#5A8F5A]" />;
      case 'Oogst': return <Wheat className="w-5 h-5 text-amber-500" />;
      default: return <MoreHorizontal className="w-5 h-5 text-stone-400" />;
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return a.completed ? 1 : -1;
  });

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-6xl mx-auto h-full flex flex-col">
      <header className="mb-6 pt-4">
        <h1 className="text-2xl font-bold text-[#1A2E1A]">Taken</h1>
        <p className="text-sm text-stone-500">Wat moet er gebeuren in de tuin?</p>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sortedTasks.map(task => {
            const isOverdue = isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed;
            const assignedUser = users.find(u => u.id === task.assignedTo);

            return (
              <div 
                key={task.id} 
                className={cn(
                  "bg-white border rounded-2xl p-4 flex items-start space-x-4 shadow-sm transition-all h-full",
                  task.completed ? "opacity-60 border-stone-200" : 
                  isOverdue ? "border-red-200 bg-red-50/30" : "border-stone-100"
                )}
              >
                <button 
                  onClick={() => toggleTask(task.id)}
                  className="mt-1 shrink-0"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-[#5A8F5A]" />
                  ) : (
                    <Circle className="w-6 h-6 text-stone-300 hover:text-[#5A8F5A] transition-colors" />
                  )}
                </button>
                
                <div className="flex-1 min-w-0 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <h3 className={cn(
                      "text-base font-bold truncate pr-2",
                      task.completed ? "text-stone-500 line-through" : "text-[#1A2E1A]"
                    )}>
                      {task.title}
                    </h3>
                    <div className="shrink-0 bg-[#F5F7F4] p-1.5 rounded-lg">
                      {getIcon(task.type)}
                    </div>
                  </div>
                  
                  <p className="text-sm text-stone-500 mt-1 line-clamp-2 flex-1">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isOverdue ? "text-red-600" : "text-stone-400"
                    )}>
                      {format(new Date(task.dueDate), 'd MMM', { locale: nl })}
                    </span>
                    
                    {assignedUser && (
                      <div className="flex items-center space-x-1.5 bg-[#F5F7F4] px-2 py-1 rounded-md">
                        {assignedUser.avatar ? (
                          <img src={assignedUser.avatar} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[8px] font-bold text-[#5A8F5A]">
                            {assignedUser.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-stone-600">{assignedUser.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
