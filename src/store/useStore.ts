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
  customEmojiUrl?: string;
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
  customDaysToHarvest?: number | null;
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
  assignedTo: string[];
  originalAssignedTo?: string[];
  relatedCellId: string | null;
  type: 'Water' | 'Oogst' | 'Snoei' | 'Zaai' | 'Overig';
  recurring_interval?: number | null;
  recurring_unit?: 'dagen' | 'weken' | 'maanden' | string | null;
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
  imageUrl?: string;
  distributedTo?: { familyId: string; quantity: number }[];
}

export interface GrowthLog {
  id: string;
  cellId: string;
  plantId?: string | null;
  date: string;
  type: 'Planten' | 'Wateren' | 'Notitie' | 'Oogst' | 'Verwijderd' | 'Overig';
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
  deleteTask: (id: string) => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id'>) => Promise<string>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  addSeed: (seed: SeedInventory) => Promise<void>;
  updateSeed: (id: string, updates: Partial<SeedInventory>) => Promise<void>;
  deleteSeed: (id: string) => Promise<void>;
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
  fetchDataFromDB: () => Promise<void>;
}

const processImage = async (dataUrl: string) => {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return null;
  try {
    const { default: imageCompression } = await import('browser-image-compression');
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    };
    return await imageCompression(new File([blob], 'image.jpg', { type: blob.type }), options);
  } catch (error) {
    console.error('Image compression failed, using original', error);
    const res = await fetch(dataUrl);
    return await res.blob();
  }
};

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

  fetchDataFromDB: async () => {
    try {
      const { pb } = await import('../lib/pb');
      if (!pb.authStore.isValid) return;

      const [plants, grid, tasks, families, users, seedBox, harvests, logs] = await Promise.all([
        pb.collection('plants').getFullList({ expand: 'custom_emoji', requestKey: null }).catch(e => { console.error('plants error', e); return null; }),
        pb.collection('grid').getFullList({ requestKey: null }).catch(e => { console.error('grid error', e); return null; }),
        pb.collection('tasks').getFullList({ requestKey: null }).catch(e => { console.error('tasks error', e); return null; }),
        pb.collection('families').getFullList({ requestKey: null }).catch(e => { console.error('families error', e); return null; }),
        pb.collection('users').getFullList({ requestKey: null }).catch(e => { console.error('users error', e); return null; }),
        pb.collection('seedBox').getFullList({ requestKey: null }).catch(e => { console.error('seedBox error', e); return null; }),
        pb.collection('harvests').getFullList({ requestKey: null }).catch(e => { console.error('harvests error', e); return null; }),
        pb.collection('logs').getFullList({ requestKey: null }).catch(e => { console.error('logs error', e); return null; }),
      ]);

      if (!plants || !grid || !tasks || !families || !users || !seedBox || !harvests || !logs) {
        console.error('One or more collections failed to load. Aborting fetchDataFromDB.');
        return;
      }

      const mappedPlants = plants.map((p: any) => {
        const customEmojiRecord = Array.isArray(p.expand?.custom_emoji) ? p.expand.custom_emoji[0] : p.expand?.custom_emoji;
        return {
          ...p,
          imageUrl: p.imageUrl ? (p.imageUrl.startsWith('http') ? p.imageUrl : pb.files.getURL(p, p.imageUrl)) : undefined,
          customEmojiUrl: customEmojiRecord?.image ? pb.files.getURL(customEmojiRecord, customEmojiRecord.image) : undefined
        };
      });

      const mappedLogs = logs.map((l: any) => ({
        ...l,
        imageUrl: l.imageUrl ? pb.files.getURL(l, l.imageUrl) : undefined
      }));

      const mappedHarvests = harvests.map((h: any) => ({
        ...h,
        imageUrl: h.imageUrl ? pb.files.getURL(h, h.imageUrl) : undefined
      }));

      const mappedGrid = (grid as any[]).map((c: any) => ({
        ...c,
        plantId: Array.isArray(c.plantId) ? c.plantId[0] : (c.plantId || null),
        plantedBy: Array.isArray(c.plantedBy) ? c.plantedBy[0] : (c.plantedBy || null),
      })).sort((a, b) => {
        const dateA = new Date(a.updated).getTime();
        const dateB = new Date(b.updated).getTime();
        return dateB - dateA;
      });

      const uniqueCells = new Map<string, any>();
      const cellsToDelete: any[] = [];

      for (const cell of mappedGrid) {
        const key = `${cell.x}-${cell.y}`;
        if (uniqueCells.has(key)) {
          cellsToDelete.push(cell);
        } else {
          uniqueCells.set(key, cell);
        }
      }

      let fetchedGrid = Array.from(uniqueCells.values()).sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
      });

      if (cellsToDelete.length > 0) {
        console.log(`Found ${cellsToDelete.length} duplicate grid cells, cleaning up...`);
        Promise.all(cellsToDelete.map(c => pb.collection('grid').delete(c.id).catch(console.error)));
      }
      
      if (fetchedGrid.length === 0 && pb.authStore.isValid) {
        try {
          const newCells = [];
          for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
              const cell = { x, y, sunExposure: y < 2 ? 'Zon' : 'Halfschaduw' };
              const record = await pb.collection('grid').create(cell);
              newCells.push(record);
            }
          }
          fetchedGrid = newCells.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
          });
        } catch (gridErr: any) {
          console.error('Failed to generate initial grid', gridErr?.response || gridErr);
        }
      }

      const calculatedWidth = fetchedGrid.length > 0 ? Math.max(...fetchedGrid.map(c => c.x)) + 1 : 4;
      const calculatedHeight = fetchedGrid.length > 0 ? Math.max(...fetchedGrid.map(c => c.y)) + 1 : 4;

      if (fetchedGrid.length > 0 && fetchedGrid.length < calculatedWidth * calculatedHeight) {
        try {
          const newCells = [];
          for (let y = 0; y < calculatedHeight; y++) {
            for (let x = 0; x < calculatedWidth; x++) {
              if (!fetchedGrid.some((c: any) => c.x === x && c.y === y)) {
                const cell = { x, y, sunExposure: 'Zon' };
                newCells.push(pb.collection('grid').create(cell));
              }
            }
          }
          if (newCells.length > 0) {
            const created = await Promise.all(newCells);
            fetchedGrid = [...fetchedGrid, ...created].sort((a: any, b: any) => {
              if (a.y !== b.y) return a.y - b.y;
              return a.x - b.x;
            });
          }
        } catch (repairErr: any) {
          console.error('Failed to repair missing grid cells', repairErr);
        }
      }

      const mappedTasks = (tasks as any[]).map(t => ({
        ...t,
        assignedTo: Array.isArray(t.assignedTo) ? t.assignedTo : [],
        relatedCellId: Array.isArray(t.relatedCellId) ? t.relatedCellId[0] : (t.relatedCellId || null)
      }));

      const mappedSeeds = (seedBox as any[]).map(s => ({
        ...s,
        plantId: Array.isArray(s.plantId) ? s.plantId[0] : s.plantId
      }));

      const mappedLogsWithRelations = mappedLogs.map(l => ({
        ...l,
        cellId: Array.isArray(l.cellId) ? l.cellId[0] : l.cellId,
        plantId: Array.isArray(l.plantId) ? l.plantId[0] : (l.plantId || null),
        userId: Array.isArray(l.userId) ? l.userId[0] : (l.userId || null)
      }));

      const mappedHarvestsWithRelations = mappedHarvests.map(h => ({
        ...h,
        plantId: Array.isArray(h.plantId) ? h.plantId[0] : h.plantId,
        userId: Array.isArray(h.userId) ? h.userId[0] : (h.userId || null)
      }));

      set({
        plants: mappedPlants,
        grid: fetchedGrid as any,
        gridWidth: calculatedWidth,
        gridHeight: calculatedHeight,
        tasks: mappedTasks as any,
        families: families as any,
        users: users.map((u: any) => ({ 
          id: u.id, 
          name: u.name || u.username || u.email || 'Gebruiker', 
          role: u.role, 
          familyId: Array.isArray(u.familyId) ? u.familyId[0] : (u.familyId || ''), 
          avatar: u.avatar ? pb.files.getURL(u, u.avatar) : undefined 
        })) as any,
        seedBox: mappedSeeds as any,
        harvests: mappedHarvestsWithRelations,
        logs: mappedLogsWithRelations,
      });
    } catch (e: any) {
      console.error("Failed to fetch from DB", e?.response || e);
    }
  },

  initializeFromDB: async () => {
    try {
      const { pb } = await import('../lib/pb');

      if (!pb.authStore.isValid && get().currentUser) {
        console.warn('PocketBase auth token is invalid or expired. Logging out.');
        get().logout();
        return;
      }

      // Initial data fetch
      await get().fetchDataFromDB();

      // Only subscribe if not already subscribed to prevent multiple listeners and 403s
      if (!(window as any).__PB_SUBSCRIBED__) {
        (window as any).__PB_SUBSCRIBED__ = true;
        
        const collections = ['plants', 'grid', 'tasks', 'families', 'users', 'seedBox', 'harvests', 'logs'];
        
        collections.forEach(coll => {
          try {
            pb.collection(coll).subscribe('*', async (e) => {
              await get().fetchDataFromDB(); // Fetch without touching subscriptions
              const state = get();

              if (state.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
                const { action, record } = e;
                const title = 'Moestuin Update';
                let body = '';
                
                const getPlantName = (id: any, logRecord?: any) => {
                  if (logRecord && logRecord.note) {
                    if (logRecord.note.includes(' geplant als')) {
                      return logRecord.note.split(' geplant als')[0].replace('[', '').replace(']', '').trim();
                    }
                    if (logRecord.note.includes(' geoogst van')) {
                      return logRecord.note.split(' geoogst van')[0].replace('[', '').replace(']', '').trim();
                    }
                  }
                  if (id) {
                    const searchId = Array.isArray(id) ? id[0] : id;
                    const plant = state.plants.find(p => p.id === searchId);
                    if (plant) return plant.name;
                  }
                  return 'een gewas';
                };

                const getUserName = (id: any) => {
                  if (!id) return 'Iemand';
                  const searchId = Array.isArray(id) ? id[0] : id;
                  const user = state.users.find(u => u.id === searchId);
                  return user?.name || 'Iemand';
                };

                try {
                  if (coll === 'tasks' && (action === 'create' || action === 'update')) {
                     const existingTask = state.tasks.find(t => t.id === record.id);
                     const wasAssigned = existingTask?.assignedTo?.includes(state.currentUser?.id || '');
                     const isAssigned = record.assignedTo && Array.isArray(record.assignedTo) && record.assignedTo.includes(state.currentUser?.id);
                     if (isAssigned && !wasAssigned && !record.completed) {
                       body = `Nieuwe taak aan jou toegewezen: ${record.title}`;
                     }
                  }
                  else if (coll === 'grid' && action === 'update') {
                     const existingCell = state.grid.find(c => c.id === record.id);
                     if (record.plantId && record.plantedBy && record.plantedBy !== state.currentUser?.id && !existingCell?.plantId) {
                        body = `${getUserName(record.plantedBy)} heeft ${getPlantName(record.plantId)} geplant!`;
                     }
                  }
                  else if (coll === 'harvests' && action === 'create') {
                     if (record.userId && record.userId !== state.currentUser?.id) {
                        body = `${getUserName(record.userId)} heeft ${record.yieldQuantity} ${record.yieldUnit} ${record.plantName} geoogst!`;
                     }
                  }
                  else if (coll === 'logs' && action === 'create') {
                     if (record.userId && record.userId !== state.currentUser?.id) {
                        const userName = getUserName(record.userId);
                        const relatedCell = state.grid.find(c => c.id === record.cellId);
                        const cellName = relatedCell ? `${String.fromCharCode(65 + relatedCell.y)}${relatedCell.x + 1}` : 'een vak';

                        if (record.type === 'Planten') {
                           body = `${userName} heeft ${getPlantName(record.plantId, record)} op ${cellName} geplant!`;
                        } else if (record.type === 'Oogst') {
                           body = `${userName} heeft ${getPlantName(record.plantId, record)} geoogst van ${cellName}!`;
                        } else if (record.type === 'Wateren') {
                           body = `${userName} heeft ${cellName} water gegeven.`;
                        } else if (record.type === 'Verwijderd') {
                           body = `${userName} heeft ${getPlantName(record.plantId, record)} verwijderd van ${cellName}.`;
                        }
                     }
                  }

                  if (body) {
                    const lastNotif = sessionStorage.getItem('last_notif_body');
                    if (lastNotif !== body) {
                      const showNotif = () => {
                        if (!('Notification' in window)) return;
                        if ('serviceWorker' in navigator) {
                          navigator.serviceWorker.ready.then(registration => {
                            registration.showNotification(title, { body, icon: '/logo.png' });
                          }).catch(() => new Notification(title, { body, icon: '/logo.png' }));
                        } else {
                          new Notification(title, { body, icon: '/logo.png' });
                        }
                      };
                      showNotif();
                      sessionStorage.setItem('last_notif_body', body);
                      setTimeout(() => sessionStorage.removeItem('last_notif_body'), 5000);
                    }
                  }
                } catch (err) {
                  console.error('Error showing notification', err);
                }
              }
            });
          } catch (subErr) {
            console.error(`Failed to subscribe to ${coll}`, subErr);
          }
        });
      }
    } catch (e: any) {
      console.error("Failed to initialize from DB completely", e?.response || e);
    }
  },

  setGridCell: async (cellId, updates) => {
    // 1. Optimistic Update FIRST to ensure UI updates immediately
    set((state) => ({
      grid: state.grid.map(c => c.id === cellId ? { ...c, ...updates } : c)
    }));

    try {
      const { pb } = await import('../lib/pb');
      const pbUpdates: any = { ...updates };

      // Only sanitize keys that are actually present in the updates object (Partial update)
      if ('plantId' in pbUpdates) {
        if (Array.isArray(pbUpdates.plantId)) pbUpdates.plantId = pbUpdates.plantId[0] || "";
        if (pbUpdates.plantId === null) pbUpdates.plantId = "";
      }

      if ('plantedBy' in pbUpdates) {
        if (Array.isArray(pbUpdates.plantedBy)) pbUpdates.plantedBy = pbUpdates.plantedBy[0] || "";
        if (pbUpdates.plantedBy === null) pbUpdates.plantedBy = "";
      }

      if ('plantedDate' in pbUpdates && pbUpdates.plantedDate === null) {
        pbUpdates.plantedDate = "";
      }

      if ('plantType' in pbUpdates && pbUpdates.plantType === null) {
        pbUpdates.plantType = "";
      }

      if ('customDaysToHarvest' in pbUpdates) {
        if (pbUpdates.customDaysToHarvest === null) pbUpdates.customDaysToHarvest = "";
        else if (typeof pbUpdates.customDaysToHarvest === 'number') {
          pbUpdates.customDaysToHarvest = Math.round(pbUpdates.customDaysToHarvest);
        }
      }

      await pb.collection('grid').update(cellId, pbUpdates);
    } catch (e: any) {
      console.error("Failed to update grid cell in PB", e?.response || e);
      // Revert optimistic update
      set((state) => {
        const originalCell = state.grid.find(c => c.id === cellId);
        // We actually need the previous state to fully revert accurately, but we can just let realtime subscription re-sync
        // or throw error for now so caller can handle.
        return state;
      });
      // Fetch latest DB state to override the optimistic update
      get().fetchDataFromDB();
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updateGridSize: async (width, height) => {
    const state = get();
    if (width < 1 || height < 1) return { success: false, message: 'Grid moet minimaal 1x1 zijn.' };

    if (width < state.gridWidth) {
      const hasPlants = state.grid.some(c => c.x >= width && !!c.plantId);
      if (hasPlants) return { success: false, message: 'Verwijder eerst de planten uit de kolommen die je wilt verwijderen.' };
    }
    if (height < state.gridHeight) {
      const hasPlants = state.grid.some(c => c.y >= height && !!c.plantId);
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
    } catch (e: any) {
      console.error("Failed to update grid size in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },
  
  addTask: async (task) => {
    try {
      const { pb } = await import('../lib/pb');
      const record = await pb.collection('tasks').create(task);
      set((state) => ({
        tasks: [...state.tasks, { ...task, id: record.id } as Task]
      }));
    } catch (e: any) {
      console.error("Failed to add task to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updateTask: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('tasks').update(id, updates);
      set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    } catch (e: any) {
      console.error("Failed to update task in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  deleteTask: async (id) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('tasks').delete(id);
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (e: any) {
      console.error("Failed to delete task from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
    } catch (e: any) {
      console.error("Failed to add plant to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updatePlant: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('plants').update(id, updates);
      set((state) => ({
        plants: state.plants.map(p => p.id === id ? { ...p, ...updates } : p)
      }));
    } catch (e: any) {
      console.error("Failed to update plant in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
    } catch (e: any) {
      console.error("Failed to delete plant from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
           const records = await pb.collection('seedBox').getFullList({ filter: `plantId="${seed.plantId}"`, requestKey: null });
           if (records.length > 0) recordId = records[0].id;
        }
        
        if (recordId) {
          const updated = await pb.collection('seedBox').update(recordId, { quantity: existing.quantity + seed.quantity, unit: seed.unit || existing.unit }, { requestKey: null });
          set((state) => ({
            seedBox: state.seedBox.map(s => s.plantId === seed.plantId 
              ? { ...s, id: updated.id, quantity: s.quantity + seed.quantity, unit: seed.unit || s.unit } 
              : s)
          }));
          return;
        }
      }
      
      const payload = { ...seed };
      if (!payload.unit) delete payload.unit;
      const record = await pb.collection('seedBox').create(payload, { requestKey: null });
      set((state) => ({ seedBox: [...state.seedBox, { ...seed, id: record.id }] }));
    } catch (e: any) {
      console.error("Failed to add seed to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updateSeed: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('seedBox').update(id, updates, { requestKey: null });
      set((state) => ({
        seedBox: state.seedBox.map(s => s.id === id ? { ...s, ...updates } : s)
      }));
    } catch (e: any) {
      console.error("Failed to update seed in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  deleteSeed: async (idOrPlantId) => {
    try {
      const { pb } = await import('../lib/pb');
      const state = get();
      const seed = state.seedBox.find(s => s.id === idOrPlantId || s.plantId === idOrPlantId);

      if (seed && seed.id && !seed.id.startsWith('s-')) {
        await pb.collection('seedBox').delete(seed.id, { requestKey: null });
      } else if (!seed?.id?.startsWith('s-')) {
        const records = await pb.collection('seedBox').getFullList({ filter: `plantId="${idOrPlantId}"`, requestKey: null });
        for (const record of records) {
          await pb.collection('seedBox').delete(record.id, { requestKey: null });
        }
      }

      set((state) => ({
        seedBox: state.seedBox.filter(s => s.id !== idOrPlantId && s.plantId !== idOrPlantId)
      }));
    } catch (e: any) {
      console.error("Failed to delete seed from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  toggleTask: async (taskId) => {
    try {
      const { pb } = await import('../lib/pb');
      const state = get();
      const task = state.tasks.find(t => t.id === taskId);
      if (!task) return;

      const hasRecurring = task.recurring || task.recurring_interval;
      const interval = task.recurring?.interval || task.recurring_interval;
      const unit = task.recurring?.unit || task.recurring_unit;

      if (!task.completed && hasRecurring && task.dueDate) {
        const newDate = new Date(task.dueDate);
        if (unit === 'dagen') newDate.setDate(newDate.getDate() + interval);
        else if (unit === 'weken') newDate.setDate(newDate.getDate() + interval * 7);
        else if (unit === 'maanden') newDate.setMonth(newDate.getMonth() + interval);
        
        const newTaskData = {
          ...task,
          dueDate: format(newDate, 'yyyy-MM-dd'),
          completed: false
        };
        // Remove the id from the new task data for PocketBase
        const { id: _, ...newTaskDataWithoutId } = newTaskData;
        
        const [updatedRecord, newRecord] = await Promise.all([
          pb.collection('tasks').update(taskId, { completed: true, recurring: null, recurring_interval: null, recurring_unit: "" }),
          pb.collection('tasks').create(newTaskDataWithoutId)
        ]);
        
        set((state) => ({
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: true, recurring: null, recurring_interval: null, recurring_unit: "" } : t).concat({ ...newTaskData, id: newRecord.id } as Task)
        }));
      } else {
        await pb.collection('tasks').update(taskId, { completed: !task.completed });
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
          ),
        }));
      }
    } catch (e: any) {
      console.error("Failed to toggle task in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  activateVacationMode: (delegateId, startDate, endDate) => set((state) => ({
    vacationMode: true,
    vacationDelegateId: delegateId,
    vacationStartDate: startDate,
    vacationEndDate: endDate,
    tasks: state.tasks.map(t => {
      if (!t.completed && t.assignedTo && t.assignedTo.includes(state.currentUser?.id || '')) {
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
          const newAssignedTo = t.assignedTo.map(id => id === state.currentUser?.id ? delegateId : id);
          return { ...t, assignedTo: Array.from(new Set(newAssignedTo)), originalAssignedTo: t.assignedTo };
        }
      }
      return t;
    })  })),

  deactivateVacationMode: () => set((state) => ({
    vacationMode: false,
    vacationDelegateId: null,
    vacationStartDate: null,
    vacationEndDate: null,
    tasks: state.tasks.map(t => {
      if (!t.completed && t.originalAssignedTo && t.originalAssignedTo.includes(state.currentUser?.id || '') && t.assignedTo && t.assignedTo.includes(state.vacationDelegateId || '')) {
        return { ...t, assignedTo: t.originalAssignedTo, originalAssignedTo: [] };
      }
      return t;
    })
  })),

  setPushNotifications: (active) => set({ pushNotifications: active }),
  setIsNotificationsModalOpen: (open) => set({ isNotificationsModalOpen: open }),
  
  addLog: async (log) => {
    try {
      const { pb } = await import('../lib/pb');
      let payload: any = { ...log };
      
      if (log.imageUrl && log.imageUrl.startsWith('data:image')) {
        const compressedBlob = await processImage(log.imageUrl);
        if (compressedBlob) {
          const formData = new FormData();
          Object.entries(log).forEach(([key, value]) => {
            if (key !== 'imageUrl' && value !== undefined && value !== null) {
              formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value as string);
            }
          });
          formData.append('imageUrl', compressedBlob, 'photo.jpg');
          payload = formData;
        }
      }
      
      const record = await pb.collection('logs').create(payload);
      const finalImageUrl = record.imageUrl ? pb.files.getURL(record, record.imageUrl) : log.imageUrl;

      set((state) => ({
        logs: [{ ...log, id: record.id, imageUrl: finalImageUrl } as GrowthLog, ...state.logs]
      }));
    } catch (e: any) {
      console.error("Failed to add log to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
      let payload: any = { ...harvest };
      
      if (harvest.imageUrl && harvest.imageUrl.startsWith('data:image')) {
        const compressedBlob = await processImage(harvest.imageUrl);
        if (compressedBlob) {
          const formData = new FormData();
          Object.entries(harvest).forEach(([key, value]) => {
            if (key !== 'imageUrl' && value !== undefined && value !== null) {
              formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value as string);
            }
          });
          formData.append('imageUrl', compressedBlob, 'harvest.jpg');
          payload = formData;
        }
      }

      const record = await pb.collection('harvests').create(payload);
      const finalImageUrl = record.imageUrl ? pb.files.getURL(record, record.imageUrl) : harvest.imageUrl;

      set((state) => ({
        harvests: [{ ...harvest, id: record.id, imageUrl: finalImageUrl } as HarvestRecord, ...state.harvests]
      }));
    } catch (e: any) {
      console.error("Failed to add harvest to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updateHarvest: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      let payload: any = { ...updates };
      
      if (updates.imageUrl && updates.imageUrl.startsWith('data:image')) {
        const compressedBlob = await processImage(updates.imageUrl);
        if (compressedBlob) {
          const formData = new FormData();
          Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'imageUrl' && value !== undefined && value !== null) {
              formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value as string);
            }
          });
          formData.append('imageUrl', compressedBlob, 'harvest.jpg');
          payload = formData;
        }
      }

      const record = await pb.collection('harvests').update(id, payload);
      const finalImageUrl = record.imageUrl ? pb.files.getURL(record, record.imageUrl) : updates.imageUrl;

      set((state) => ({
        harvests: state.harvests.map(h => h.id === id ? { ...h, ...updates, ...(finalImageUrl && { imageUrl: finalImageUrl }) } : h)
      }));
    } catch (e) {
      console.error("Failed to update harvest in PB", e);
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
    } catch (e: any) {
      console.error("Failed to add family to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updateFamily: async (id, name) => {
    try {
      const { pb } = await import('../lib/pb');
      await pb.collection('families').update(id, { name });
      set((state) => ({
        families: state.families.map(f => f.id === id ? { ...f, name } : f)
      }));
    } catch (e: any) {
      console.error("Failed to update family in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
    } catch (e: any) {
      console.error("Failed to delete family from PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
    } catch (e: any) {
      console.error("Failed to update user family in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
          avatar: user.avatar ? pb.files.getURL(user, user.avatar) : undefined
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
    } catch (e: any) {
      console.error("Failed to add user to PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
    }
  },

  updateUser: async (id, updates) => {
    try {
      const { pb } = await import('../lib/pb');
      let payload: any = { ...updates };
      
      if (updates.avatar && updates.avatar.startsWith('data:image')) {
        const compressedBlob = await processImage(updates.avatar);
        if (compressedBlob) {
          const formData = new FormData();
          Object.entries(updates).forEach(([key, value]) => {
            if (key !== 'avatar' && value !== undefined && value !== null) {
              formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value as string);
            }
          });
          formData.append('avatar', compressedBlob, 'avatar.jpg');
          payload = formData;
        } else {
          delete payload.avatar;
        }
      }

      const record = await pb.collection('users').update(id, payload);
      
      const finalUpdates = { ...updates };
      if (record.avatar && updates.avatar && updates.avatar.startsWith('data:image')) {
         finalUpdates.avatar = pb.files.getURL(record, record.avatar);
      }

      set((state) => ({
        users: state.users.map(u => u.id === id ? { ...u, ...finalUpdates } : u),
        currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...finalUpdates } : state.currentUser
      }));
    } catch (e: any) {
      console.error("Failed to update user in PB", e?.response || e);
      throw new Error(e?.response?.message || e.message || "Er is een onbekende fout opgetreden bij het opslaan in de database.");
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
