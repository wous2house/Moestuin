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
  setGridCell: (cellId: string, updates: Partial<GridCell>) => void;
  updateGridSize: (width: number, height: number) => { success: boolean; message?: string };
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addPlant: (plant: Omit<Plant, 'id'>) => string;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  addSeed: (seed: SeedInventory) => void;
  toggleTask: (taskId: string) => void;
  activateVacationMode: (delegateId: string, startDate: string, endDate: string) => void;
  deactivateVacationMode: () => void;
  setPushNotifications: (active: boolean) => void;
  setIsNotificationsModalOpen: (open: boolean) => void;
  addLog: (log: Omit<GrowthLog, 'id'>) => void;
  dismissLog: (userId: string, logId: string) => void;
  addHarvest: (harvest: Omit<HarvestRecord, 'id'>) => void;
  updateHarvest: (id: string, updates: Partial<HarvestRecord>) => void;
  addFamily: (name: string) => string;
  updateFamily: (id: string, name: string) => void;
  deleteFamily: (id: string) => void;
  updateUserFamily: (userId: string, familyId: string) => void;
  setCurrentUser: (userId: string) => Promise<void>;
  logout: () => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  importData: (data: Partial<AppState>) => void;
}

// Mock Data
const MOCK_PLANTS: Plant[] = [
  { id: 'p1', name: 'Tomaat', family: 'Groente', goodNeighbors: ['p2', 'p4'], badNeighbors: ['p3'], sunPreference: 'Zon', daysToHarvest: 80, waterNeeds: 'Hoog', icon: '🍅', imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=800' },
  { id: 'p2', name: 'Basilicum', family: 'Zaden', goodNeighbors: ['p1'], badNeighbors: [], sunPreference: 'Zon', daysToHarvest: 40, waterNeeds: 'Gemiddeld', icon: '🌿', imageUrl: 'https://images.unsplash.com/photo-1615486171448-4fc1eb8f15b4?auto=format&fit=crop&q=80&w=800' },
  { id: 'p3', name: 'Aardappel', family: 'Groente', goodNeighbors: [], badNeighbors: ['p1'], sunPreference: 'Zon', daysToHarvest: 100, waterNeeds: 'Gemiddeld', icon: '🥔', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800' },
  { id: 'p4', name: 'Wortel', family: 'Groente', goodNeighbors: ['p1', 'p5'], badNeighbors: [], sunPreference: 'Halfschaduw', daysToHarvest: 70, waterNeeds: 'Gemiddeld', icon: '🥕', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800' },
  { id: 'p5', name: 'Ui', family: 'Groente', goodNeighbors: ['p4'], badNeighbors: ['p6'], sunPreference: 'Zon', daysToHarvest: 90, waterNeeds: 'Laag', icon: '🧅', imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800' },
  { id: 'p6', name: 'Boon', family: 'Groente', goodNeighbors: [], badNeighbors: ['p5'], sunPreference: 'Zon', daysToHarvest: 60, waterNeeds: 'Gemiddeld', icon: '🫘', imageUrl: 'https://images.unsplash.com/photo-1551228450-4228913c2393?auto=format&fit=crop&q=80&w=800' },
];

const MOCK_FAMILIES: FamilyGroup[] = [
  { id: 'f1', name: 'Familie Jansen' },
  { id: 'f2', name: 'Buurttuin De Molen' },
];

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Papa', role: 'Admin', familyId: 'f1' },
  { id: 'u2', name: 'Mama', role: 'Admin', familyId: 'f1' },
  { id: 'u3', name: 'Kind', role: 'Lid', familyId: 'f1' },
  { id: 'u4', name: 'Buurman Henk', role: 'Admin', familyId: 'f2' },
  { id: 'u5', name: 'Buurvrouw Ingrid', role: 'Lid', familyId: 'f2' },
];

// Generate 4x4 grid
const initialGrid: GridCell[] = [];
for (let y = 0; y < 4; y++) {
  for (let x = 0; x < 4; x++) {
    let plantId = null;
    if (y === 0 && x === 0) plantId = 'p1'; // Tomaat
    if (y === 0 && x === 1) plantId = 'p2'; // Basilicum
    if (y === 1 && x === 0) plantId = 'p4'; // Wortel
    if (y === 2 && x === 2) plantId = 'p6'; // Boon

    initialGrid.push({
      id: `c-${x}-${y}`,
      x,
      y,
      plantId,
      plantedDate: plantId ? '2024-05-01' : null,
      plantedBy: plantId ? 'u1' : null,
      plantType: plantId ? 'Plant' : null,
      sunExposure: y < 2 ? 'Zon' : 'Halfschaduw',
      history: [],
    });
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
  plants: MOCK_PLANTS,
  grid: initialGrid,
  gridWidth: 4,
  gridHeight: 4,
  tasks: [
    { id: 't1', title: 'Tomaten water geven', description: 'Het is warm, extra water nodig.', dueDate: format(new Date(), 'yyyy-MM-dd'), completed: false, assignedTo: 'u1', relatedCellId: 'c-0-0', type: 'Water' },
    { id: 't2', title: 'Wortels uitdunnen', description: 'Zorg voor 5cm ruimte tussen de wortels.', dueDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'), completed: false, assignedTo: 'u2', relatedCellId: 'c-0-1', type: 'Overig' },
  ],
  users: MOCK_USERS,
  families: MOCK_FAMILIES,
  currentUser: MOCK_USERS[0],
  seedBox: [
    { plantId: 'p1', quantity: 50 },
    { plantId: 'p4', quantity: 200 },
  ],
  harvests: [],
  logs: [],
  vacationMode: false,
  vacationDelegateId: null,
  pushNotifications: false,
  isNotificationsModalOpen: false,
  dismissedLogs: {},

  setGridCell: (cellId, updates) => set((state) => ({
    grid: state.grid.map(c => c.id === cellId ? { ...c, ...updates } : c)
  })),

  updateGridSize: (width, height) => {
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

    let newGrid = state.grid.filter(c => c.x < width && c.y < height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!newGrid.some(c => c.x === x && c.y === y)) {
          newGrid.push({
            id: `c-${x}-${y}`,
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
  },
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: `t-${Date.now()}` }]
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  addPlant: (plant) => {
    const id = `p-${Date.now()}`;
    set((state) => ({
      plants: [...state.plants, { ...plant, id }]
    }));
    return id;
  },

  updatePlant: (id, updates) => set((state) => ({
    plants: state.plants.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  deletePlant: (id) => set((state) => ({
    plants: state.plants.filter(p => p.id !== id),
    // Optionally clean up grid cells and seedBox
    grid: state.grid.map(c => c.plantId === id ? { ...c, plantId: null, plantType: null, plantedDate: null, plantedBy: null } : c),
    seedBox: state.seedBox.filter(s => s.plantId !== id)
  })),

  addSeed: (seed) => set((state) => {
    const existing = state.seedBox.find(s => s.plantId === seed.plantId);
    if (existing) {
      return {
        seedBox: state.seedBox.map(s => s.plantId === seed.plantId 
          ? { ...s, quantity: s.quantity + seed.quantity, unit: seed.unit || s.unit } 
          : s)
      };
    }
    return { seedBox: [...state.seedBox, seed] };
  }),
  toggleTask: (taskId) => set((state) => {
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
  }),

  activateVacationMode: (delegateId, startDate, endDate) => set((state) => ({
    vacationMode: true,
    vacationDelegateId: delegateId,
    vacationStartDate: startDate,
    vacationEndDate: endDate,
    tasks: state.tasks.map(t => {
      // If task is assigned to current user, reassign to delegate if it falls in the period
      if (!t.completed && t.assignedTo === state.currentUser?.id) {
        const tStart = t.dueDate ? new Date(t.dueDate) : null;
        const tEnd = t.endDate ? new Date(t.endDate) : tStart;
        
        const vStart = new Date(startDate);
        const vEnd = new Date(endDate);
        vEnd.setHours(23, 59, 59, 999);
        
        let overlaps = false;
        
        if (!tStart) {
           overlaps = true; // Continuous task
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
      // Revert tasks that were reassigned and are still assigned to the delegate
      if (!t.completed && t.originalAssignedTo === state.currentUser?.id && t.assignedTo === state.vacationDelegateId) {
        return { ...t, assignedTo: state.currentUser?.id, originalAssignedTo: null };
      }
      return t;
    })
  })),

  setPushNotifications: (active) => set({ pushNotifications: active }),
  setIsNotificationsModalOpen: (open) => set({ isNotificationsModalOpen: open }),
  addLog: (log) => set((state) => ({
    logs: [...state.logs, { ...log, id: `l-${Date.now()}` }]
  })),

  dismissLog: (userId, logId) => set((state) => {
    const userDismissed = state.dismissedLogs[userId] || [];
    if (!userDismissed.includes(logId)) {
      return {
        dismissedLogs: {
          ...state.dismissedLogs,
          [userId]: [...userDismissed, logId]
        }
      };
    }
    return state;
  }),

  addHarvest: (harvest) => set((state) => ({
    harvests: [...state.harvests, { ...harvest, id: `h-${Date.now()}` }]
  })),

  updateHarvest: (id, updates) => set((state) => ({
    harvests: state.harvests.map(h => h.id === id ? { ...h, ...updates } : h)
  })),

  addFamily: (name) => {
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
  },

  updateFamily: (id, name) => set((state) => ({
    families: state.families.map(f => f.id === id ? { ...f, name } : f)
  })),

  deleteFamily: (id) => set((state) => {
    const defaultFamilyId = state.families.find(f => f.id !== id)?.id || '';
    return {
      families: state.families.filter(f => f.id !== id),
      users: state.users.map(u => u.familyId === id ? { ...u, familyId: defaultFamilyId } : u),
      currentUser: state.currentUser?.familyId === id ? { ...state.currentUser, familyId: defaultFamilyId } : state.currentUser
    };
  }),

  updateUserFamily: (userId, familyId) => set((state) => ({
    users: state.users.map(u => u.id === userId ? { ...u, familyId } : u),
    currentUser: state.currentUser?.id === userId ? { ...state.currentUser, familyId } : state.currentUser
  })),

  setCurrentUser: async (userId) => {
    try {
      const { pb } = await import('../lib/pb');
      const user = await pb.collection('users').getOne(userId);
      set((state) => ({
        currentUser: {
          id: user.id,
          name: user.name || user.username,
          role: user.role as 'Admin' | 'Lid',
          familyId: user.familyId,
          avatar: user.avatar ? pb.files.getUrl(user, user.avatar) : undefined
        }
      }));
    } catch (e) {
      console.error("Failed to fetch user", e);
      // Fallback for mock users
      set((state) => ({
        currentUser: state.users.find(u => u.id === userId) || null
      }));
    }
  },

  logout: () => set({ currentUser: null }),

  addUser: (user) => set((state) => ({
    users: [...state.users, { ...user, id: `u-${Date.now()}` }]
  })),

  updateUser: (id, updates) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...updates } : u),
    currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser
  })),

  deleteUser: (id) => set((state) => ({
    users: state.users.filter(u => u.id !== id),
    currentUser: state.currentUser?.id === id ? null : state.currentUser
  })),

  importData: (data) => set((state) => {
    // Update currentUser if it exists in the imported data
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
