import { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { CheckCircle2, Circle, Droplets, Scissors, Sprout, Wheat, MoreHorizontal, Plus, X, Bell } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';

import { HeaderActions } from '../components/HeaderActions';

export default function Tasks() {
  const { tasks, toggleTask, users, grid, plants, addTask, updateTask, currentUser, setIsNotificationsModalOpen, logs, dismissedLogs } = useStore();
  const [isAddingTaskOpen, setIsAddingTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo === currentUser?.id)).length;
  const unreadLogsCount = logs.filter(l => l.userId !== currentUser?.id && (!currentUser || !dismissedLogs[currentUser.id]?.includes(l.id))).length;
  const notificationsCount = activeTasksCount + unreadLogsCount;
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [dateType, setDateType] = useState<'single' | 'period' | 'continuous'>('single');
  const [newTaskDueDate, setNewTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskEndDate, setNewTaskEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskType, setNewTaskType] = useState('Water');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string>('');
  const [newTaskCellId, setNewTaskCellId] = useState<string>('');

  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);

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
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    }
    return a.completed ? 1 : -1;
  });

  const handleSaveTask = () => {
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        dueDate: dateType === 'continuous' ? null : newTaskDueDate,
        endDate: dateType === 'period' ? newTaskEndDate : null,
        completed: false,
        assignedTo: newTaskAssignedTo || null,
        relatedCellId: newTaskCellId || null,
        type: newTaskType as any
      });
      setIsAddingTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setDateType('single');
      setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
      setNewTaskEndDate(format(new Date(), 'yyyy-MM-dd'));
      setNewTaskAssignedTo('');
      setNewTaskCellId('');
    }
  };

  return (
    <div className="p-6 max-w-md md:max-w-4xl lg:max-w-6xl mx-auto h-full flex flex-col space-y-6">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E1A]">Taken</h1>
          <p className="text-sm text-stone-500">Wat moet er gebeuren in de tuin?</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAddingTaskOpen(true)}
            className="bg-[#5A8F5A] text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#4A7A4A] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Nieuwe Taak</span>
          </button>
          <HeaderActions />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sortedTasks.map(task => {
            const isOverdue = task.dueDate ? isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed : false;
            const assignedUser = users.find(u => u.id === task.assignedTo);
            const relatedCell = task.relatedCellId ? grid.find(c => c.id === task.relatedCellId) : null;
            const relatedPlant = relatedCell?.plantId ? plants.find(p => p.id === relatedCell.plantId) : null;

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
                    <div className="shrink-0 bg-[#F5F7F4] p-1.5 rounded-lg flex items-center justify-center">
                      {relatedPlant ? <span className="text-xl">{relatedPlant.icon}</span> : getIcon(task.type)}
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
                      {task.dueDate 
                        ? (task.endDate 
                            ? `${format(new Date(task.dueDate), 'd MMM', { locale: nl })} - ${format(new Date(task.endDate), 'd MMM', { locale: nl })}`
                            : format(new Date(task.dueDate), 'd MMM', { locale: nl }))
                        : "Doorlopend"
                      }
                    </span>
                    
                    {assignedUser ? (
                      <button 
                        onClick={() => setReassigningTaskId(task.id)}
                        className="flex items-center space-x-1.5 bg-[#F5F7F4] hover:bg-[#E8F0E8] transition-colors px-2 py-1 rounded-md"
                      >
                        {assignedUser.avatar ? (
                          <img src={assignedUser.avatar} alt="" className="w-4 h-4 rounded-full" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[8px] font-bold text-[#5A8F5A]">
                            {assignedUser.name.charAt(0)}
                          </div>
                        )}
                        <span className="text-xs font-bold text-stone-600">{assignedUser.name}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setReassigningTaskId(task.id)}
                        className="text-[10px] font-bold text-[#5A8F5A] bg-[#E8F0E8] px-2 py-1 rounded-md hover:bg-[#D0E0D0] transition-colors"
                      >
                        Toewijzen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddingTaskOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#1A2E1A]">Nieuwe Taak</h2>
              <button 
                onClick={() => setIsAddingTaskOpen(false)}
                className="p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Titel</label>
                <input 
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Bijv. Tomaten water geven..."
                  className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Beschrijving (Optioneel)</label>
                <textarea 
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Extra details..."
                  className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A] resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Periode</label>
                  <select 
                    value={dateType}
                    onChange={(e) => setDateType(e.target.value as any)}
                    className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                  >
                    <option value="single">Specifieke Datum</option>
                    <option value="period">Periode (Van-Tot)</option>
                    <option value="continuous">Doorlopend</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Type Taak</label>
                  <select 
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value)}
                    className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                  >
                    <option value="Water">Wateren</option>
                    <option value="Zaai">Zaaien / Planten</option>
                    <option value="Oogst">Oogsten</option>
                    <option value="Snoei">Snoeien</option>
                    <option value="Overig">Overig</option>
                  </select>
                </div>
              </div>

              {dateType !== 'continuous' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">{dateType === 'period' ? 'Start Datum' : 'Datum'}</label>
                    <input 
                      type="date"
                      value={newTaskDueDate}
                      onChange={(e) => setNewTaskDueDate(e.target.value)}
                      className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                    />
                  </div>
                  {dateType === 'period' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Eind Datum</label>
                      <input 
                        type="date"
                        value={newTaskEndDate}
                        onChange={(e) => setNewTaskEndDate(e.target.value)}
                        className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                      />
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Toewijzen Aan</label>
                <select 
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                  className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                >
                  <option value="">Iedereen</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Koppel aan Gewas in Grid (Optioneel)</label>
                <select 
                  value={newTaskCellId}
                  onChange={(e) => setNewTaskCellId(e.target.value)}
                  className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                >
                  <option value="">Geen koppeling</option>
                  {grid.filter(c => c.plantId).map(c => {
                    const plant = plants.find(p => p.id === c.plantId);
                    return (
                      <option key={c.id} value={c.id}>
                        {plant?.name} (Vak {String.fromCharCode(65 + c.y)}{c.x + 1})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <button 
              onClick={handleSaveTask}
              disabled={!newTaskTitle.trim()}
              className="mt-6 w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Taak Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassigningTaskId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl flex flex-col relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setReassigningTaskId(null)}
              className="absolute top-4 right-4 p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-1">Taak Toewijzen</h2>
            <p className="text-sm text-stone-500 mb-6">Aan wie wil je deze taak toewijzen?</p>
            <div className="space-y-2 mb-6">
              <button
                onClick={() => { updateTask(reassigningTaskId, { assignedTo: null }); setReassigningTaskId(null); }}
                className="w-full text-left p-3 rounded-xl hover:bg-[#F5F7F4] transition-colors text-sm font-bold text-stone-600 border border-transparent hover:border-stone-200"
              >
                Iedereen (Niemand specifiek)
              </button>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { updateTask(reassigningTaskId, { assignedTo: u.id }); setReassigningTaskId(null); }}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#F5F7F4] transition-colors text-sm font-bold text-[#1A2E1A] border border-transparent hover:border-stone-200 flex items-center space-x-3"
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[10px] font-bold text-[#5A8F5A]">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
