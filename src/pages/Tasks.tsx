import { useState } from 'react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { CheckCircle2, Circle, Droplets, Scissors, Sprout, Wheat, MoreHorizontal, Plus, X, Bell, Trash2, Edit2 } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';

import { HeaderActions } from '../components/HeaderActions';

export default function Tasks() {
  const { tasks, toggleTask, users, grid, plants, addTask, updateTask, deleteTask, currentUser, setIsNotificationsModalOpen, logs } = useStore();
  const [isAddingTaskOpen, setIsAddingTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [viewingTask, setViewingTask] = useState<any | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const activeTasksCount = tasks.filter(t => !t.completed && (!t.assignedTo || t.assignedTo.length === 0 || t.assignedTo.includes(currentUser?.id || ''))).length;
  const unreadLogsCount = logs.filter(l => l.userId !== currentUser?.id && (!currentUser?.dismissedLogs?.includes(l.id))).length;
  const notificationsCount = activeTasksCount + unreadLogsCount;
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [dateType, setDateType] = useState<'single' | 'period' | 'continuous' | 'recurring'>('single');
  const [newTaskDueDate, setNewTaskDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskEndDate, setNewTaskEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTaskType, setNewTaskType] = useState('Water');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState<string[]>([]);
  const [newTaskCellId, setNewTaskCellId] = useState<string>('');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringUnit, setRecurringUnit] = useState<'dagen' | 'weken' | 'maanden'>('weken');

  const [reassigningTaskId, setReassigningTaskId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Water': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'Snoei': return <Scissors className="w-5 h-5 text-stone-500" />;
      case 'Zaai': return <Sprout className="w-5 h-5 text-[#5A8F5A]" />;
      case 'Oogst': return <Wheat className="w-5 h-5 text-amber-500" />;
      default: return null;
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

  const handleEditTask = (task: any) => {
    try {
      setEditingTaskId(task.id);
      setNewTaskTitle(task.title || '');
      setNewTaskDescription(task.description || '');
      
      const hasRecurring = task.recurring || task.recurring_interval;
      if (hasRecurring) {
        setDateType('recurring');
        setRecurringInterval(task.recurring?.interval || task.recurring_interval || 1);
        setRecurringUnit(task.recurring?.unit || task.recurring_unit || 'weken');
      } else if (task.endDate) {
        setDateType('period');
      } else if (!task.dueDate) {
        setDateType('continuous');
      } else {
        setDateType('single');
      }

      const safeDate = (d: any) => {
        if (!d) return format(new Date(), 'yyyy-MM-dd');
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return format(new Date(), 'yyyy-MM-dd');
          return format(dt, 'yyyy-MM-dd');
        } catch(e) { return format(new Date(), 'yyyy-MM-dd'); }
      };

      setNewTaskDueDate(safeDate(task.dueDate));
      setNewTaskEndDate(safeDate(task.endDate));
      setNewTaskType(task.type || 'Water');
      setNewTaskAssignedTo(task.assignedTo || []);
      setNewTaskCellId(task.relatedCellId || '');
      setIsEditingTask(true);
      if (!viewingTask) {
        setIsAddingTaskOpen(true);
      }
    } catch(e) {
      console.error("Error in handleEditTask", e);
    }
  };

  const resetForm = () => {
    setIsAddingTaskOpen(false);
    setViewingTask(null);
    setIsEditingTask(false);
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setDateType('single');
    setNewTaskDueDate(format(new Date(), 'yyyy-MM-dd'));
    setNewTaskEndDate(format(new Date(), 'yyyy-MM-dd'));
    setNewTaskAssignedTo([]);
    setNewTaskCellId('');
    setRecurringInterval(1);
    setRecurringUnit('weken');
  };

  const handleSaveTask = () => {
    if (newTaskTitle.trim()) {
      const taskData = {
        title: newTaskTitle.trim(),
        description: newTaskDescription.trim(),
        dueDate: dateType === 'continuous' ? "" : (newTaskDueDate || ""),
        endDate: dateType === 'period' ? (newTaskEndDate || "") : "",
        assignedTo: newTaskAssignedTo,
        relatedCellId: newTaskCellId || "",
        type: newTaskType as any,
        recurring_interval: dateType === 'recurring' ? recurringInterval : null,
        recurring_unit: dateType === 'recurring' ? recurringUnit : "",
        recurring: dateType === 'recurring' ? { interval: recurringInterval, unit: recurringUnit } : null
      };

      if (editingTaskId) {
        updateTask(editingTaskId, taskData);
        if (viewingTask && viewingTask.id === editingTaskId) {
          setViewingTask({ ...viewingTask, ...taskData });
          setIsEditingTask(false);
        } else {
          resetForm();
        }
      } else {
        addTask({
          ...taskData,
          completed: false,
        });
        resetForm();
      }
    }
  };

  return (
    <div className="p-6 mw-2000 mx-auto h-full flex flex-col space-y-6">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2E1A]">Taken</h1>
          <p className="text-sm text-stone-500">Wat moet er gebeuren in de tuin?</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => {
              setEditingTaskId(null);
              setNewTaskTitle('');
              setNewTaskDescription('');
              setIsAddingTaskOpen(true);
            }}
            className="bg-[#5A8F5A] text-white px-4 py-2.5 rounded-xl font-bold flex items-center space-x-2 hover:bg-[#4A7A4A] transition-colors shadow-sm hidden md:flex"
          >
            <Plus className="w-5 h-5" />
            <span>Nieuwe Taak</span>
          </button>
          <HeaderActions />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {sortedTasks.map(task => {
            const isOverdue = task.dueDate ? isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed : false;
            const assignedUsers = task.assignedTo && task.assignedTo.length > 0 ? users.filter(u => task.assignedTo.includes(u.id)) : [];
            const relatedCell = task.relatedCellId ? grid.find(c => c.id === task.relatedCellId) : null;
            const relatedPlant = relatedCell?.plantId ? plants.find(p => p.id === relatedCell.plantId) : null;

            return (
              <div 
                key={task.id} 
                className={cn(
                  "bg-white border rounded-2xl p-4 flex items-start space-x-4 shadow-sm transition-all h-full cursor-pointer hover:shadow-md hover:border-[#5A8F5A]/30",
                  task.completed ? "opacity-60 border-stone-200" : 
                  isOverdue ? "border-red-200 bg-red-50/30" : "border-stone-100"
                )}
                onClick={() => handleEditTask(task)}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
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
                    
                    {assignedUsers.length > 0 ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          {assignedUsers.map((u) => (
                            <div key={u.id} title={u.name} className="w-5 h-5 rounded-full border border-stone-100 bg-[#E8F0E8] flex items-center justify-center text-[8px] font-bold text-[#5A8F5A] shrink-0">
                              {u.avatar ? (
                                <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                              ) : (
                                u.name?.charAt(0) || '?'
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] font-bold text-[#5A8F5A] bg-[#E8F0E8] px-2 py-1 rounded-md">
                        Iedereen
                      </div>
                    )}
                  </div>
                </div>

                </div>
              );
            })}
        </div>
      </div>

      {/* Fixed Bottom Action (Mobile Only) */}
      <div className="md:hidden fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[60]">
        <button
          onClick={() => {
            setEditingTaskId(null);
            setNewTaskTitle('');
            setNewTaskDescription('');
            setIsAddingTaskOpen(true);
          }}
          className="bg-[#5A8F5A] text-white p-4 rounded-2xl shadow-lg shadow-[#5A8F5A]/40 hover:bg-[#4A7A4A] transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* View Task Modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 h-full">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col relative animate-in fade-in zoom-in-95 max-h-[90vh]">
            <div className="flex justify-between items-start mb-4">
              {isEditingTask ? (
                <h2 className="text-xl font-bold text-[#1A2E1A] mt-1">Taak Bewerken</h2>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="bg-[#F5F7F4] p-3 rounded-xl flex items-center justify-center">
                    {getIcon(viewingTask.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A2E1A] leading-tight">{viewingTask.title}</h2>
                    <p className="text-[10px] font-bold text-[#5A8F5A] uppercase tracking-wider">{viewingTask.type}</p>
                  </div>
                </div>
              )}
              <button 
                onClick={() => { setViewingTask(null); setIsEditingTask(false); }}
                className="p-2 bg-stone-100 rounded-full text-stone-500 hover:text-stone-700 hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 no-scrollbar mb-6">
              {!isEditingTask ? (
                <>
                  {viewingTask.description && (
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Beschrijving</h3>
                      <p className="text-sm text-stone-600 bg-[#F5F7F4] p-4 rounded-xl">{viewingTask.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F5F7F4] p-3 rounded-xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Status</h3>
                      <div className="flex items-center space-x-2">
                        {viewingTask.completed ? <CheckCircle2 className="w-4 h-4 text-[#5A8F5A]" /> : <Circle className="w-4 h-4 text-stone-400" />}
                        <span className={cn("text-sm font-bold", viewingTask.completed ? "text-[#5A8F5A]" : "text-stone-600")}>
                          {viewingTask.completed ? 'Voltooid' : 'Openstaand'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-[#F5F7F4] p-3 rounded-xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Toegewezen aan</h3>
                      <p className="text-sm font-bold text-[#1A2E1A]">
                        {viewingTask.assignedTo ? users.find(u => u.id === viewingTask.assignedTo)?.name || 'Onbekend' : 'Iedereen'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F5F7F4] p-3 rounded-xl">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Timing</h3>
                    <p className="text-sm font-bold text-[#1A2E1A]">
                      {viewingTask.recurring || viewingTask.recurring_interval
                        ? `Elke ${viewingTask.recurring?.interval || viewingTask.recurring_interval || 1} ${viewingTask.recurring?.unit || viewingTask.recurring_unit || 'weken'}`
                        : viewingTask.dueDate 
                          ? (viewingTask.endDate 
                              ? `${format(new Date(viewingTask.dueDate), 'd MMM yyyy', { locale: nl })} t/m ${format(new Date(viewingTask.endDate), 'd MMM yyyy', { locale: nl })}`
                              : format(new Date(viewingTask.dueDate), 'd MMM yyyy', { locale: nl }))
                          : "Doorlopend"
                      }
                    </p>
                  </div>

                  {viewingTask.relatedCellId && (
                    <div className="bg-[#F5F7F4] p-3 rounded-xl">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Gekoppeld Gewas</h3>
                      <p className="text-sm font-bold text-[#1A2E1A] flex items-center space-x-1">
                        {(() => {
                          const cell = grid.find(c => c.id === viewingTask.relatedCellId);
                          const plant = cell?.plantId ? plants.find(p => p.id === cell.plantId) : null;
                          if (!plant || !cell) return <span>Gewas niet gevonden</span>;
                          return (
                            <>
                              {plant.customEmojiUrl ? (
                                <img src={plant.customEmojiUrl} alt={plant.name} className="w-[1em] h-[1em] object-contain inline-block align-middle" />
                              ) : (
                                <span>{plant.icon}</span>
                              )}
                              <span>
                                {plant.name} (Vak {String.fromCharCode(65 + cell.y)}{cell.x + 1})
                              </span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
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
                        <option value="recurring">Periodiek (Herhalend)</option>
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

                  {dateType === 'recurring' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Elke</label>
                        <input 
                          type="number"
                          min="1"
                          value={recurringInterval}
                          onChange={(e) => setRecurringInterval(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Eenheid</label>
                        <select 
                          value={recurringUnit}
                          onChange={(e) => setRecurringUnit(e.target.value as any)}
                          className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                        >
                          <option value="dagen">Dagen</option>
                          <option value="weken">Weken</option>
                          <option value="maanden">Maanden</option>
                        </select>
                      </div>
                    </div>
                  )}

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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setNewTaskAssignedTo([])}
                        className={cn("px-3 py-1.5 rounded-xl text-sm font-bold transition-colors", newTaskAssignedTo.length === 0 ? "bg-[#5A8F5A] text-white" : "bg-[#F5F7F4] text-stone-600")}
                      >
                        Iedereen
                      </button>
                      {users.map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            if (newTaskAssignedTo.includes(u.id)) {
                              setNewTaskAssignedTo(newTaskAssignedTo.filter(id => id !== u.id));
                            } else {
                              setNewTaskAssignedTo([...newTaskAssignedTo, u.id]);
                            }
                          }}
                          className={cn("px-3 py-1.5 rounded-xl text-sm font-bold transition-colors", newTaskAssignedTo.includes(u.id) ? "bg-[#5A8F5A] text-white" : "bg-[#F5F7F4] text-stone-600")}
                        >
                          {u.name}
                        </button>
                      ))}
                    </div>
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
                </>
              )}
            </div>
            
            {!isEditingTask ? (
              <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-stone-100">
                <button 
                  onClick={() => handleEditTask(viewingTask)}
                  className="py-3 bg-[#F5F7F4] text-[#1A2E1A] rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-[#E8F0E8] transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Bewerken</span>
                </button>
                <button 
                  onClick={() => {
                    setTaskToDelete(viewingTask.id);
                  }}
                  className="py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Verwijderen</span>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSaveTask}
                disabled={!newTaskTitle.trim()}
                className="mt-2 w-full py-3 bg-[#5A8F5A] text-white rounded-xl font-bold hover:bg-[#4A7A4A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Wijzigingen Opslaan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isAddingTaskOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 h-full">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#1A2E1A]">{editingTaskId ? 'Taak Bewerken' : 'Nieuwe Taak'}</h2>
              <button 
                onClick={resetForm}
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
                    <option value="recurring">Periodiek (Herhalend)</option>
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

              {dateType === 'recurring' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Elke</label>
                    <input 
                      type="number"
                      min="1"
                      value={recurringInterval}
                      onChange={(e) => setRecurringInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">Eenheid</label>
                    <select 
                      value={recurringUnit}
                      onChange={(e) => setRecurringUnit(e.target.value as any)}
                      className="w-full bg-[#F5F7F4] border-none rounded-xl py-2 px-3 text-sm font-bold text-[#1A2E1A] focus:outline-none focus:ring-2 focus:ring-[#5A8F5A]"
                    >
                      <option value="dagen">Dagen</option>
                      <option value="weken">Weken</option>
                      <option value="maanden">Maanden</option>
                    </select>
                  </div>
                </div>
              )}

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
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2">Toewijzen Aan</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTaskAssignedTo([])}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                      newTaskAssignedTo.length === 0 
                        ? "bg-[#5A8F5A] text-white border-[#5A8F5A] shadow-sm" 
                        : "bg-[#F5F7F4] text-stone-600 border-transparent hover:border-stone-200"
                    )}
                  >
                    Iedereen
                  </button>
                  {users.map(u => {
                    const isSelected = newTaskAssignedTo.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setNewTaskAssignedTo(newTaskAssignedTo.filter(id => id !== u.id));
                          } else {
                            setNewTaskAssignedTo([...newTaskAssignedTo, u.id]);
                          }
                        }}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                          isSelected 
                            ? "bg-[#5A8F5A] text-white border-[#5A8F5A] shadow-sm" 
                            : "bg-[#F5F7F4] text-stone-600 border-transparent hover:border-stone-200"
                        )}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                        ) : (
                          <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px]", isSelected ? "bg-white/20 text-white" : "bg-[#E8F0E8] text-[#5A8F5A]")}>
                            {u.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span>{u.name}</span>
                      </button>
                    );
                  })}
                </div>
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

      {/* Delete Task Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-xl flex flex-col animate-in fade-in zoom-in-95 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[#1A2E1A] mb-2">Taak Verwijderen</h2>
            <p className="text-sm text-stone-500 mb-6">
              Weet je zeker dat je deze taak wilt verwijderen?
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
              >
                Annuleren
              </button>
              <button 
                onClick={() => {
                  deleteTask(taskToDelete);
                  setTaskToDelete(null);
                  if (viewingTask?.id === taskToDelete) {
                    setViewingTask(null);
                  }
                }}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {reassigningTaskId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 h-full">
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
                onClick={() => { updateTask(reassigningTaskId, { assignedTo: [] }); setReassigningTaskId(null); }}
                className="w-full text-left p-3 rounded-xl hover:bg-[#F5F7F4] transition-colors text-sm font-bold text-stone-600 border border-transparent hover:border-stone-200"
              >
                Iedereen (Niemand specifiek)
              </button>
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => { updateTask(reassigningTaskId, { assignedTo: [u.id] }); setReassigningTaskId(null); }}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#F5F7F4] transition-colors text-sm font-bold text-[#1A2E1A] border border-transparent hover:border-stone-200 flex items-center space-x-3"
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#E8F0E8] flex items-center justify-center text-[10px] font-bold text-[#5A8F5A]">
                      {u.name?.charAt(0) || '?'}
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
