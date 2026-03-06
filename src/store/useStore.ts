import { create } from 'zustand';
import { addDays, format } from 'date-fns';

export type PlantFamily = 'Nachtschade' | 'Kruisbloemigen' | 'Vlinderbloemigen' | 'Schermbloemigen' | 'Composieten' | 'Lelieachtigen' | 'Komkommerachtigen' | 'Grasachtigen' | 'Overig';
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
  dueDate: string;
  completed: boolean;
  assignedTo: string | null;
  relatedCellId: string | null;
  type: 'Water' | 'Oogst' | 'Snoei' | 'Zaai' | 'Overig';
}

export interface FamilyGroup {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Lid';
  avatar?: string;
  familyId: string;
}

export interface SeedInventory {
  plantId: string;
  quantity: number; // e.g., grams or seeds
}

export interface GrowthLog {
  id: string;
  cellId: string;
  date: string;
  note: string;
  imageUrl?: string;
}

interface AppState {
  plants: Plant[];
  grid: GridCell[];
  tasks: Task[];
  users: User[];
  families: FamilyGroup[];
  currentUser: User | null;
  seedBox: SeedInventory[];
  logs: GrowthLog[];
  vacationMode: boolean;
  
  // Actions
  setGridCell: (cellId: string, updates: Partial<GridCell>) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  toggleTask: (taskId: string) => void;
  setVacationMode: (active: boolean) => void;
  addLog: (log: Omit<GrowthLog, 'id'>) => void;
  addFamily: (name: string) => void;
  updateFamily: (id: string, name: string) => void;
  deleteFamily: (id: string) => void;
  updateUserFamily: (userId: string, familyId: string) => void;
  setCurrentUser: (userId: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
}

// Mock Data
const MOCK_PLANTS: Plant[] = [
  { id: 'p1', name: 'Tomaat', family: 'Nachtschade', goodNeighbors: ['p2', 'p4'], badNeighbors: ['p3'], sunPreference: 'Zon', daysToHarvest: 80, waterNeeds: 'Hoog', icon: '🍅', imageUrl: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&q=80&w=800' },
  { id: 'p2', name: 'Basilicum', family: 'Overig', goodNeighbors: ['p1'], badNeighbors: [], sunPreference: 'Zon', daysToHarvest: 40, waterNeeds: 'Gemiddeld', icon: '🌿', imageUrl: 'https://images.unsplash.com/photo-1615486171448-4fc1eb8f15b4?auto=format&fit=crop&q=80&w=800' },
  { id: 'p3', name: 'Aardappel', family: 'Nachtschade', goodNeighbors: [], badNeighbors: ['p1'], sunPreference: 'Zon', daysToHarvest: 100, waterNeeds: 'Gemiddeld', icon: '🥔', imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800' },
  { id: 'p4', name: 'Wortel', family: 'Schermbloemigen', goodNeighbors: ['p1', 'p5'], badNeighbors: [], sunPreference: 'Halfschaduw', daysToHarvest: 70, waterNeeds: 'Gemiddeld', icon: '🥕', imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=800' },
  { id: 'p5', name: 'Ui', family: 'Lelieachtigen', goodNeighbors: ['p4'], badNeighbors: ['p6'], sunPreference: 'Zon', daysToHarvest: 90, waterNeeds: 'Laag', icon: '🧅', imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=800' },
  { id: 'p6', name: 'Boon', family: 'Vlinderbloemigen', goodNeighbors: [], badNeighbors: ['p5'], sunPreference: 'Zon', daysToHarvest: 60, waterNeeds: 'Gemiddeld', icon: '🫘', imageUrl: 'https://images.unsplash.com/photo-1551228450-4228913c2393?auto=format&fit=crop&q=80&w=800' },
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

export const useStore = create<AppState>((set) => ({
  plants: MOCK_PLANTS,
  grid: initialGrid,
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
  logs: [],
  vacationMode: false,

  setGridCell: (cellId, updates) => set((state) => ({
    grid: state.grid.map(c => c.id === cellId ? { ...c, ...updates } : c)
  })),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, { ...task, id: `t-${Date.now()}` }]
  })),
  
  toggleTask: (taskId) => set((state) => ({
    tasks: state.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
  })),
  
  setVacationMode: (active) => set({ vacationMode: active }),
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, { ...log, id: `l-${Date.now()}` }]
  })),

  addFamily: (name) => set((state) => ({
    families: [...state.families, { id: `f-${Date.now()}`, name }]
  })),

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

  setCurrentUser: (userId) => set((state) => ({
    currentUser: state.users.find(u => u.id === userId) || null
  })),

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
}));
