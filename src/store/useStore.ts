import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format } from 'date-fns';

export type PlantFamily = 'Groente' | 'Fruit' | 'Zaden' | 'Bloemen' | 'Overig';
export type SunPreference = 'Zon' | 'Halfschaduw' | 'Schaduw' | 'Duisternis';
export type PlantType = 'Zaad' | 'Bol' | 'Plant';

export interface Plant {
  id: string;
  name: string;
  family: PlantFamily;
  goodNeighbors: string[]; // Plant IDs
  badNeighbors: string[]; // Plant IDs
  sunPreference: SunPreference;
  daysToHarvest: number;
  waterNeeds: 'Laag' | 'Gemiddeld' | 'Hoog';
  imageUrl?: string;
  icon: string;
}

export interface GridCell {
  id: string;
  x: number;
  y: number;
  plantId: string | null;
  plantedDate: string | null;
  plantedBy: string | null;
  plantType: PlantType | null;
  sunExposure: SunPreference; // The actual sun exposure of this spot
  history: { year: number; family: PlantFamily }[]; // For crop rotation
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string | null; // null means continuous
  endDate?: string | null; // if set, task is a period from dueDate to endDate
  completed: boolean;
  assignedTo: string | null;
  originalAssignedTo?: string | null;
  relatedCellId: string | null;
  type: 'Water' | 'Oogst' | 'Snoei' | 'Zaai' | 'Overig';
  recurring?: {
    interval: number;
    unit: 'dagen' | 'weken' | 'maanden';
  } | null;
}

export interface FamilyGroup {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  password?: string;
  role: 'Admin' | 'Lid';
  avatar?: string;
  familyId: string;
}

export interface SeedInventory {
  id?: string;
  plantId: string;
  quantity: number; // e.g., grams or seeds
  unit?: 'stuks' | 'gram';
}

export interface HarvestRecord {
  id: string;
  plantId: string;
  plantName: string;
  date: string;
  userId: string | null;
  yieldQuantity: number;
  yieldUnit: string;
  notes?: string;
  distributedTo?: { familyId: string; quantity: number }[];
}

export interface GrowthLog {
  id: string;
  cellId: string;
  date: string;
  type: 'Planten' | 'Wateren' | 'Notitie' | 'Oogst' | 'Ompoten' | 'Verwijderd' | 'Overig';
  note: string;
  userId: string | null;
  imageUrl?: string;
}

interface AppState {
  plants: Plant[];
  grid: GridCell[];
  gridWidth: number;
  gridHeight: number;
  tasks: Task[];
  users: User[];
  families: FamilyGroup[];
  currentUser: User | null;
  seedBox: SeedInventory[];
  harvests: HarvestRecord[];
  logs: GrowthLog[];
  vacationMode: boolean;
  vacationDelegateId?: string | null;
  vacationStartDate?: string | null;
  vacationEndDate?: string | null;
  pushNotifications: boolean;
  isNotificationsModalOpen: boolean;
  dismissedLogs: Record<string, string[]>;

  // Actions
  setGridCell: (cellId: string, updates: Partial<GridCell>) => Promise<void>;
  updateGridSize: (width: number, height: number) => Promise<{ success: boolean; message?: string }>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id'>) => Promise<string>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  addSeed: (seed: SeedInventory) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  activateVacationMode: (delegateId: string, startDate: string, endDate: string) => void;
  deactivateVacationMode: () => void;
  setPushNotifications: (active: boolean) => void;
  setIsNotificationsModalOpen: (open: boolean) => void;
  addLog: (log: Omit<GrowthLog, 'id'>) => Promise<void>;
  dismissLog: (userId: string, logId: string) => void;
  addHarvest: (harvest: Omit<HarvestRecord, 'id'>) => Promise<void>;
  updateHarvest: (id: string, updates: Partial<HarvestRecord>) => Promise<void>;
  addFamily: (name: string) => Promise<string>;
  updateFamily: (id: string, name: string) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  updateUserFamily: (userId: string, familyId: string) => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  importData: (data: Partial<AppState>) => void;
  initializeFromDB: () => Promise<void>;
}

// Initial empty state
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  plants: [],
  grid: [],
  gridWidth: 4,
  gridHeight: 4,
  tasks: [],
  users: [],
  families: [],
  currentUser: null,
  seedBox: [],
  harvests: [],
  logs: [],
  vacationMode: false,
  vacationDelegateId: null,
  pushNotifications: false,
  isNotificationsModalOpen: false,
  dismissedLogs: {},

  initializeFromDB: async () => {
    try {
      const { pb } = await import('../lib/pb');
      const [plants, grid, tasks, families, users, seedBox, harvests, logs] = await Promise.all([
        pb.collection('plants').getFullList().catch(e => { console.error('plants error', e); return []; }),
        pb.collection('grid').getFullList().catch(e => { console.error('grid error', e); return []; }),
        pb.collection('tasks').getFullList().catch(e => { console.error('tasks error', e); return []; }),
        pb.collection('families').getFullList().catch(e => { console.error('families error', e); return []; }),
        pb.collection('users').getFullList().catch(e => { console.error('users error', e); return []; }),
        pb.collection('seedBox').getFullList().catch(e => { console.error('seedBox error', e); return []; }),
        pb.collection('harvests').getFullList().catch(e => { console.error('harvests error', e); return []; }),
        pb.collection('logs').getFullList().catch(e => { console.error('logs error', e); return []; }),
      ]);

      let fetchedGrid = grid as any[];
      
      // Auto-generate a 4x4 grid if completely empty
      if (fetchedGrid.length === 0 && pb.authStore.isValid) {
        try {
          console.log('Generating initial grid in PocketBase...');
          const newCells = [];
          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
              const cell = {
                x,
                y,
                sunExposure: y < 2 ? 'Zon' : 'Halfschaduw'
              };
              const record = await pb.collection('grid').create(cell);
              newCells.push(record);
            }
          }
          fetchedGrid = newCells;
        } catch (gridErr: any) {
          console.error('Failed to generate initial grid', gridErr?.response || gridErr);
        }
      }

      set({
        plants: plants as any,
        grid: fetchedGrid as any,
        tasks: tasks as any,
        families: families as any,
        users: users.map((u: any) => ({ id: u.id, name: u.name || u.username || u.email || 'Gebruiker', role: u.role, familyId: u.familyId, avatar: u.avatar ? pb.files.getUrl(u, u.avatar) : undefined })) as any,
        seedBox: seedBox as any,
        harvests: harvests as any,
        logs: logs as any,
      });
    } catch (e: any) {
      console.error("Failed to initialize from DB completely", e?.response || e);
    }
  },

  setGridCell: async (cellId, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('grid').update(cellId, updates);
      set((state) => ({
        grid: state.grid.map(c => c.id === cellId ? { ...c, ...updates } : c)
      }));
    } catch (e) {
      console.error("Failed to update grid cell in PB", e);
      // Optimistic update
      set((state) => ({
        grid: state.grid.map(c => c.id === cellId ? { ...c, ...updates } : c)
      }));
    }
  },

  updateGridSize: async (width, height) => {
    const state = get();
    if (width < 1 || height < 1) return { success: false, message: 'Grid moet minimaal 1x1 zijn.' };

    if (width < state.gridWidth) {
      const hasPlants = state.grid.some(c => c.x >= width && c.plantId !== null);
      if (hasPlants) return { success: false, message: 'Verwijder eerst de planten uit de kolommen die je wilt verwijderen.' };
    }
    if (height < state.gridHeight) {
      const hasPlants = state.grid.some(c => c.y >= height && c.plantId !== null);
      if (hasPlants) return { success: false, message: 'Verwijder eerst de planten uit de rijen die je wilt verwijderen.' };
    }

    try {
      const { pb } = await import('../lib/pb');
      let newGrid = state.grid.filter(c => c.x < width && c.y < height);
      
      const cellsToDelete = state.grid.filter(c => c.x >= width || c.y >= height);
      await Promise.all(cellsToDelete.map(c => pb.collection('grid').delete(c.id).catch(console.error)));

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!newGrid.some(c => c.x === x && c.y === y)) {
            const newCell = { x, y, sunExposure: 'Zon' };
            const record = await pb.collection('grid').create(newCell);
            newGrid.push({
              id: record.id,
              x,
              y,
              plantId: null,
              plantedDate: null,
              plantedBy: null,
              plantType: null,
              sunExposure: 'Zon',
              history: [],
            });
          }
        }
      }

      set({ gridWidth: width, gridHeight: height, grid: newGrid });
      return { success: true };
    } catch (e) {
      console.error("Failed to update grid size in PB", e);
      return { success: false, message: 'Fout bij opslaan van grid in database.' };
    }
  },
  
  addTask: async (task) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('tasks').create(task);
      set((state) => ({
        tasks: [...state.tasks, { ...task, id: record.id } as Task]
      }));
    } catch (e) {
      console.error("Failed to add task to PB", e);
      set((state) => ({
        tasks: [...state.tasks, { ...task, id: `t-${Date.now()}` } as Task]
      }));
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('tasks').update(id, updates);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    } catch (e) {
      console.error("Failed to update task in PB", e);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    }
  },

  addPlant: async (plant) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('plants').create(plant);
      set((state) => ({
        plants: [...state.plants, { ...plant, id: record.id } as Plant]
      }));
      return record.id;
    } catch (e) {
      console.error("Failed to add plant to PB", e);
      const mockId = `p-${Date.now()}`;
      set((state) => ({
        plants: [...state.plants, { ...plant, id: mockId } as Plant]
      }));
      return mockId;
    }
  },

  updatePlant: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('plants').update(id, updates);
      set((state) => ({
        plants: state.plants.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
    } catch (e) {
      console.error("Failed to update plant in PB", e);
      set((state) => ({
        plants: state.plants.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
    }
  },

  deletePlant: async (id) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('plants').delete(id);
      set((state) => ({
        plants: state.plants.filter(p => p.id !== id),
        grid: state.grid.map(c => c.plantId === id ? { ...c, plantId: null, plantType: null, plantedDate: null, plantedBy: null } : c),
        seedBox: state.seedBox.filter(s => s.plantId !== id)
      }));
    } catch (e) {
      console.error("Failed to delete plant from PB", e);
      set((state) => ({
        plants: state.plants.filter(p => p.id !== id),
        grid: state.grid.map(c => c.plantId === id ? { ...c, plantId: null, plantType: null, plantedDate: null, plantedBy: null } : c),
        seedBox: state.seedBox.filter(s => s.plantId !== id)
      }));
    }
  },

  addSeed: async (seed) => {
    try {
      const { pb } = await import('../lib/pb');
      const state = get();
      const existing = state.seedBox.find(s => s.plantId === seed.plantId);
      
      if (existing) {
        let recordId = existing.id;
        if (!recordId) {
           const records = await pb.collection('seedBox').getFullList({ filter: `plantId="${seed.plantId}"` });
           if (records.length > 0) recordId = records[0].id;
        }
        
        if (recordId) {
          const updated = await pb.collection('seedBox').update(recordId, { quantity: existing.quantity + seed.quantity, unit: seed.unit || existing.unit });
          set((state) => ({
            seedBox: state.seedBox.map(s => s.plantId === seed.plantId 
              ? { ...s, id: updated.id, quantity: s.quantity + seed.quantity, unit: seed.unit || s.unit } 
              : s)
          }));
          return;
        }
      }
      
      const record = await pb.collection('seedBox').create(seed);
      set((state) => ({ seedBox: [...state.seedBox, { ...seed, id: record.id }] }));
    } catch (e) {
      console.error("Failed to add seed to PB", e);
      set((state) => {
        const existing = state.seedBox.find(s => s.plantId === seed.plantId);
        if (existing) {
          return {
            seedBox: state.seedBox.map(s => s.plantId === seed.plantId 
              ? { ...s, quantity: s.quantity + seed.quantity, unit: seed.unit || s.unit } 
              : s)
          };
        }
        return { seedBox: [...state.seedBox, seed] };
      });
    }
  },

  toggleTask: async (taskId) => {
    try {
      const { pb } = await import('../lib/pb');
      const state = get();
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      if (!task.completed && task.recurring && task.dueDate) {
        const newDate = new Date(task.dueDate);
        if (task.recurring.unit === 'dagen') newDate.setDate(newDate.getDate() + task.recurring.interval);
        else if (task.recurring.unit === 'weken') newDate.setDate(newDate.getDate() + task.recurring.interval * 7);
        else if (task.recurring.unit === 'maanden') newDate.setMonth(newDate.getMonth() + task.recurring.interval);
        
        const newTaskData = {
          ...task,
          dueDate: format(newDate, 'yyyy-MM-dd'),
          completed: false
        };
        // Remove the id from the new task data for PocketBase
        const { id: _, ...newTaskDataWithoutId } = newTaskData;
        
        const [updatedRecord, newRecord] = await Promise.all([
          pb.collection('tasks').update(taskId, { completed: true, recurring: null }),
          pb.collection('tasks').create(newTaskDataWithoutId)
        ]);
        
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: true, recurring: null } : t).concat({ ...newTaskData, id: newRecord.id } as Task)
        }));
      } else {
        await pb.collection('tasks').update(taskId, { completed: !task.completed });
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        }));
      }
    } catch (e) {
      console.error("Failed to toggle task in PB", e);
      // Fallback optimistic
      set((state) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task) return state;

        if (!task.completed && task.recurring && task.dueDate) {
          const newDate = new Date(task.dueDate);
          if (task.recurring.unit === 'dagen') newDate.setDate(newDate.getDate() + task.recurring.interval);
          else if (task.recurring.unit === 'weken') newDate.setDate(newDate.getDate() + task.recurring.interval * 7);
          else if (task.recurring.unit === 'maanden') newDate.setMonth(newDate.getMonth() + task.recurring.interval);
          
          const newTask = {
            ...task,
            id: `t-${Date.now()}`,
            dueDate: format(newDate, 'yyyy-MM-dd'),
            completed: false
          };
          
          return {
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: true, recurring: null } : t).concat(newTask)
          };
        }

        return {
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        };
      });
    }
  },

  activateVacationMode: (delegateId, startDate, endDate) => set((state) => ({
    vacationMode: true,
    vacationDelegateId: delegateId,
    vacationStartDate: startDate,
    vacationEndDate: endDate,
    tasks: state.tasks.map(t => {
      if (!t.completed && t.assignedTo === state.currentUser?.id) {
        const tStart = t.dueDate ? new Date(t.dueDate) : null;
        const tEnd = t.endDate ? new Date(t.endDate) : tStart;
        
        const vStart = new Date(startDate);
        const vEnd = new Date(endDate);
        vEnd.setHours(23, 59, 59, 999);
        
        let overlaps = false;
        
        if (!tStart) {
           overlaps = true;
        } else {
           if (tStart <= vEnd && (tEnd ? tEnd >= vStart : true)) {
             overlaps = true;
           }
        }
        
        if (overlaps) {
          return { ...t, assignedTo: delegateId, originalAssignedTo: state.currentUser?.id };
        }
      }
      return t;
    })
  })),

  deactivateVacationMode: () => set((state) => ({
    vacationMode: false,
    vacationDelegateId: null,
    vacationStartDate: null,
    vacationEndDate: null,
    tasks: state.tasks.map(t => {
      if (!t.completed && t.originalAssignedTo === state.currentUser?.id && t.assignedTo === state.vacationDelegateId) {
        return { ...t, assignedTo: state.currentUser?.id, originalAssignedTo: null };
      }
      return t;
    })
  })),

  setPushNotifications: (active) => set({ pushNotifications: active }),
  setIsNotificationsModalOpen: (open) => set({ isNotificationsModalOpen: open }),
  
  addLog: async (log) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('logs').create(log);
      set((state) => ({
        logs: [...state.logs, { ...log, id: record.id } as GrowthLog]
      }));
    } catch (e) {
      console.error("Failed to add log to PB", e);
      set((state) => ({
        logs: [...state.logs, { ...log, id: `l-${Date.now()}` } as GrowthLog]
      }));
    }
  },

  dismissLog: (userId, logId) => set((state) => {
    const userDismissed = state.dismissedLogs?.[userId] || [];
    if (!userDismissed.includes(logId)) {
      return {
        dismissedLogs: {
          ...(state.dismissedLogs || {}),
          [userId]: [...userDismissed, logId]
        }
      };
    }
    return state;
  }),

  addHarvest: async (harvest) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('harvests').create(harvest);
      set((state) => ({
        harvests: [...state.harvests, { ...harvest, id: record.id } as HarvestRecord]
      }));
    } catch (e) {
      console.error("Failed to add harvest to PB", e);
      set((state) => ({
        harvests: [...state.harvests, { ...harvest, id: `h-${Date.now()}` } as HarvestRecord]
      }));
    }
  },

  updateHarvest: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('harvests').update(id, updates);
      set((state) => ({
        harvests: state.harvests.map(h => h.id === id ? { ...h, ...updates } : h)
      }));
    } catch (e) {
      console.error("Failed to update harvest in PB", e);
      set((state) => ({
        harvests: state.harvests.map(h => h.id === id ? { ...h, ...updates } : h)
      }));
    }
  },

  addFamily: async (name) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('families').create({ name });
      const id = record.id;
      
      set((state) => {
        const newFamilies = [...state.families, { id, name }];
        let newUsers = state.users;
        let newCurrentUser = state.currentUser;
        
        if (state.currentUser) {
          pb.collection('users').update(state.currentUser.id, { familyId: id }).catch(console.error);
          newUsers = state.users.map(u => u.id === state.currentUser!.id ? { ...u, familyId: id } : u);
          newCurrentUser = { ...state.currentUser, familyId: id };
        }
        
        return { families: newFamilies, users: newUsers, currentUser: newCurrentUser };
      });
      return id;
    } catch (e) {
      console.error("Failed to add family to PB", e);
      const id = `f-${Date.now()}`;
      set((state) => {
        const newFamilies = [...state.families, { id, name }];
        let newUsers = state.users;
        let newCurrentUser = state.currentUser;
        
        if (state.currentUser) {
          newUsers = state.users.map(u => u.id === state.currentUser!.id ? { ...u, familyId: id } : u);
          newCurrentUser = { ...state.currentUser, familyId: id };
        }
        
        return { families: newFamilies, users: newUsers, currentUser: newCurrentUser };
      });
      return id;
    }
  },

  updateFamily: async (id, name) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('families').update(id, { name });
      set((state) => ({
        families: state.families.map(f => f.id === id ? { ...f, name } : f)
      }));
    } catch (e) {
      console.error("Failed to update family in PB", e);
      set((state) => ({
        families: state.families.map(f => f.id === id ? { ...f, name } : f)
      }));
    }
  },

  deleteFamily: async (id) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('families').delete(id);
      
      set((state) => {
        const defaultFamilyId = state.families.find(f => f.id !== id)?.id || '';
        
        state.users.forEach(u => {
          if (u.familyId === id) {
            pb.collection('users').update(u.id, { familyId: defaultFamilyId }).catch(console.error);
          }
        });
        
        return {
          families: state.families.filter(f => f.id !== id),
          users: state.users.map(u => u.familyId === id ? { ...u, familyId: defaultFamilyId } : u),
          currentUser: state.currentUser?.familyId === id ? { ...state.currentUser, familyId: defaultFamilyId } : state.currentUser
        };
      });
    } catch (e) {
      console.error("Failed to delete family from PB", e);
      set((state) => {
        const defaultFamilyId = state.families.find(f => f.id !== id)?.id || '';
        return {
          families: state.families.filter(f => f.id !== id),
          users: state.users.map(u => u.familyId === id ? { ...u, familyId: defaultFamilyId } : u),
          currentUser: state.currentUser?.familyId === id ? { ...state.currentUser, familyId: defaultFamilyId } : state.currentUser
        };
      });
    }
  },

  updateUserFamily: async (userId, familyId) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('users').update(userId, { familyId });
      set((state) => ({
        users: state.users.map(u => u.id === userId ? { ...u, familyId } : u),
        currentUser: state.currentUser?.id === userId ? { ...state.currentUser, familyId } : state.currentUser
      }));
    } catch (e) {
      console.error("Failed to update user family in PB", e);
      set((state) => ({
        users: state.users.map(u => u.id === userId ? { ...u, familyId } : u),
        currentUser: state.currentUser?.id === userId ? { ...state.currentUser, familyId } : state.currentUser
      }));
    }
  },

  setCurrentUser: async (userId) => {
    try {
      const { pb } = await import('../lib/pb');
      const user = await pb.collection('users').getOne(userId);
      set((state) => ({
        currentUser: {
          id: user.id,
          name: user.name || user.username || user.email || 'Gebruiker',
          role: user.role as 'Admin' | 'Lid',
          familyId: user.familyId,
          avatar: user.avatar ? pb.files.getUrl(user, user.avatar) : undefined
        }
      }));
    } catch (e) {
      console.error("Failed to fetch user", e);
      set((state) => ({
        currentUser: state.users.find(u => u.id === userId) || null
      }));
    }
  },

  logout: () => set({ currentUser: null }),

  addUser: async (user) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('users').create({
        ...user,
        emailVisibility: true,
        passwordConfirm: user.password
      });
      set((state) => ({
        users: [...state.users, { ...user, id: record.id } as User]
      }));
    } catch (e) {
      console.error("Failed to add user to PB", e);
      set((state) => ({
        users: [...state.users, { ...user, id: `u-${Date.now()}` } as User]
      }));
    }
  },

  updateUser: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      const pbUpdates: any = { ...updates };
      
      if (updates.avatar) {
         console.warn("Avatar update via store is currently local-only. Full PB file upload required.");
      }

      await pb.collection('users').update(id, pbUpdates);
      
      set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
      }));
    } catch (e) {
      console.error("Failed to update user in PB", e);
      set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
      }));
    }
  },

  deleteUser: async (id) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('users').delete(id);
      set((state) => ({
        users: state.users.filter(u => u.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser
      }));
    } catch (e) {
      console.error("Failed to delete user from PB", e);
      set((state) => ({
        users: state.users.filter(u => u.id !== id),
        currentUser: state.currentUser?.id === id ? null : state.currentUser
      }));
    }
  },

  importData: (data) => set((state) => {
    const newCurrentUser = data.users?.find((u: User) => u.id === state.currentUser?.id) || state.currentUser;
    return {
      ...state,
      ...data,
      currentUser: newCurrentUser,
    };
  }),
}),
{
  name: 'moestuin-storage',
  version: 1,
  migrate: (persistedState: any, version: number) => {
    if (version === 0) {
      const state = persistedState;
      const familyMap: Record<string, string> = {
        'Nachtschade': 'Groente',
        'Kruisbloemigen': 'Groente',
        'Vlinderbloemigen': 'Groente',
        'Schermbloemigen': 'Groente',
        'Composieten': 'Groente',
        'Komkommerachtigen': 'Groente',
        'Lelieachtigen': 'Groente',
        'Grasachtigen': 'Overig',
        'Kruiden': 'Zaden',
      };
      
      if (state.plants) {
        state.plants = state.plants.map((p: any) => ({
          ...p,
          family: familyMap[p.family] || p.family
        }));
      }
      return state;
    }
    return persistedState;
  }
}
));
