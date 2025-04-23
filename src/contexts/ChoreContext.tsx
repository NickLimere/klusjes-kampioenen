import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { 
  getChores, 
  createChore as dbCreateChore, 
  updateChore as dbUpdateChore, 
  deleteChore as dbDeleteChore,
  completeChore as dbCompleteChore,
  getUserCompletedChores as dbGetUserCompletedChores
} from "@/lib/db-service";
import { Timestamp } from "firebase/firestore";
import type { Chore as DbChore, CompletedChore as DbCompletedChore } from "@/lib/db-types";

// Define types for our chore data
export interface Chore extends Omit<DbChore, 'createdAt' | 'updatedAt' | 'dueDate'> {
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface CompletedChore extends Omit<DbCompletedChore, 'completedAt'> {
  completedAt: Date;
}

export interface ChoreContextType {
  chores: Chore[];
  completedChores: CompletedChore[];
  addChore: (chore: Omit<DbChore, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateChore: (id: string, chore: Partial<DbChore>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  completeChore: (choreId: string, userId: string) => Promise<string>;
  getUserChores: (userId: string) => Chore[];
  getUserCompletedChores: (userId: string) => Promise<CompletedChore[]>;
}

// Create the context
const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

// Context provider component
export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [completedChores, setCompletedChores] = useState<CompletedChore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch chores from Firestore on component mount
  useEffect(() => {
    const fetchChores = async () => {
      try {
        console.log('Starting to fetch chores...');
        const fetchedChores = await getChores();
        console.log('Raw fetched chores:', fetchedChores);
        
        // Convert Firestore Timestamps to JavaScript Dates
        const convertedChores = fetchedChores.map(chore => {
          const converted = {
            ...chore,
            id: chore.id, // Ensure we have the ID
            createdAt: (chore.createdAt as Timestamp).toDate(),
            updatedAt: (chore.updatedAt as Timestamp).toDate(),
            dueDate: chore.dueDate ? (chore.dueDate as Timestamp).toDate() : undefined
          };
          console.log('Converted chore:', converted);
          return converted;
        });
        
        console.log('Setting chores in state:', convertedChores);
        setChores(convertedChores);
      } catch (error) {
        console.error('Error fetching chores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChores();
  }, []);

  const addChore = async (chore: Omit<DbChore, 'id' | 'createdAt' | 'updatedAt'>) => {
    const dbChore = {
      ...chore,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    const id = await dbCreateChore(dbChore);
    const newChore: Chore = {
      ...chore,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: chore.dueDate ? (chore.dueDate as Timestamp).toDate() : undefined
    };
    setChores(prev => [...prev, newChore]);
    return id;
  };

  const updateChore = async (id: string, chore: Partial<DbChore>) => {
    await dbUpdateChore(id, chore);
    setChores(prev =>
      prev.map(c => c.id === id ? { 
        ...c, 
        ...chore,
        updatedAt: new Date(),
        createdAt: c.createdAt instanceof Timestamp ? c.createdAt.toDate() : c.createdAt,
        dueDate: chore.dueDate ? (chore.dueDate as Timestamp).toDate() : c.dueDate
      } : c)
    );
  };

  const deleteChore = async (id: string) => {
    await dbDeleteChore(id);
    setChores(prev => prev.filter(c => c.id !== id));
  };

  const completeChore = async (choreId: string, userId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) throw new Error('Chore not found');

    const id = await dbCompleteChore({
      choreId,
      userId,
      completedAt: Timestamp.now(),
      pointsEarned: chore.pointValue
    });

    const newCompletedChore: CompletedChore = {
      id,
      choreId,
      userId,
      completedAt: new Date(),
      pointsEarned: chore.pointValue
    };

    setCompletedChores(prev => [...prev, newCompletedChore]);
    return id;
  };

  const getUserChores = (userId: string) => {
    return chores.filter(chore => chore.assignedTo.includes(userId));
  };

  const getUserCompletedChores = async (userId: string) => {
    const fetchedChores = await dbGetUserCompletedChores(userId);
    const convertedChores = fetchedChores.map(chore => ({
      ...chore,
      completedAt: (chore.completedAt as Timestamp).toDate()
    }));
    setCompletedChores(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newChores = convertedChores.filter(c => !existingIds.has(c.id));
      return [...prev, ...newChores];
    });
    return convertedChores;
  };

  if (isLoading) {
    return <div>Loading chores...</div>;
  }

  return (
    <ChoreContext.Provider
      value={{
        chores,
        completedChores,
        addChore,
        updateChore,
        deleteChore,
        completeChore,
        getUserChores,
        getUserCompletedChores,
      }}
    >
      {children}
    </ChoreContext.Provider>
  );
}

// Custom hook to use the context
export function useChore() {
  const context = useContext(ChoreContext);
  if (context === undefined) {
    throw new Error("useChore must be used within a ChoreProvider");
  }
  return context;
}
