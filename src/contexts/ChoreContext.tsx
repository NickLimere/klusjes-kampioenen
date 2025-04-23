import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { 
  getChores, 
  createChore as dbCreateChore, 
  updateChore as dbUpdateChore, 
  deleteChore as dbDeleteChore,
  completeChore as dbCompleteChore,
  getUserCompletedChores as dbGetUserCompletedChores,
  deleteCompletedChore as dbDeleteCompletedChore
} from "@/lib/db-service";
import { Timestamp } from "firebase/firestore";
import type { Chore as DbChore, CompletedChore as DbCompletedChore } from "@/lib/db-types";
import { useUser } from "@/contexts/UserContext";

// Define types for our chore data
export interface Chore extends Omit<DbChore, 'createdAt' | 'updatedAt' | 'dueDate'> {
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
}

export interface CompletedChore extends Omit<DbCompletedChore, 'completedAt' | 'createdAt' | 'updatedAt'> {
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChoreContextType {
  chores: Chore[];
  completedChores: CompletedChore[];
  addChore: (chore: Omit<DbChore, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateChore: (id: string, chore: Partial<DbChore>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  completeChore: (choreId: string, userId: string) => Promise<string>;
  deleteCompletedChore: (id: string) => Promise<void>;
  getUserChores: (userId: string) => Chore[];
  getUserCompletedChores: (userId: string) => Promise<CompletedChore[]>;
}

// Create the context
const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

// Create the hook at the top level
export function useChore() {
  const context = useContext(ChoreContext);
  if (context === undefined) {
    throw new Error("useChore must be used within a ChoreProvider");
  }
  return context;
}

// Context provider component
export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [completedChores, setCompletedChores] = useState<CompletedChore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUser();

  // Load chores on mount
  useEffect(() => {
    const loadChores = async () => {
      try {
        const fetchedChores = await getChores();
        setChores(fetchedChores.map(chore => ({
          ...chore,
          createdAt: (chore.createdAt as Timestamp).toDate(),
          updatedAt: (chore.updatedAt as Timestamp).toDate(),
          dueDate: chore.dueDate ? (chore.dueDate as Timestamp).toDate() : undefined
        })));
      } catch (error) {
        console.error('Error loading chores:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChores();
  }, []);

  // Load completed chores when current user changes
  useEffect(() => {
    const loadCompletedChores = async () => {
      if (currentUser) {
        try {
          const fetchedChores = await dbGetUserCompletedChores(currentUser.id);
          const convertedChores = fetchedChores.map(chore => {
            // Only check for completedAt since that's the only required timestamp
            if (!chore.completedAt) {
              console.error('Missing completedAt field in completed chore:', chore);
              return null;
            }
            
            return {
              ...chore,
              completedAt: (chore.completedAt as Timestamp).toDate(),
              // Use completedAt for createdAt and updatedAt if they don't exist
              createdAt: chore.createdAt ? (chore.createdAt as Timestamp).toDate() : (chore.completedAt as Timestamp).toDate(),
              updatedAt: chore.updatedAt ? (chore.updatedAt as Timestamp).toDate() : (chore.completedAt as Timestamp).toDate()
            };
          }).filter((chore): chore is CompletedChore => chore !== null);
          
          // Ensure unique chores by ID
          setCompletedChores(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newChores = convertedChores.filter(c => !existingIds.has(c.id));
            return [...prev, ...newChores];
          });
        } catch (error) {
          console.error('Error loading completed chores:', error);
          setCompletedChores([]);
        }
      } else {
        setCompletedChores([]);
      }
    };

    loadCompletedChores();
  }, [currentUser]);

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

    const now = Timestamp.now();
    const id = await dbCompleteChore({
      choreId,
      userId,
      completedAt: now,
      pointsEarned: chore.pointValue,
      createdAt: now,
      updatedAt: now
    });

    const newCompletedChore: CompletedChore = {
      id,
      choreId,
      userId,
      completedAt: now.toDate(),
      pointsEarned: chore.pointValue,
      createdAt: now.toDate(),
      updatedAt: now.toDate()
    };

    setCompletedChores(prev => {
      // Check if this chore is already completed
      if (prev.some(c => c.id === id)) {
        return prev;
      }
      return [...prev, newCompletedChore];
    });
    return id;
  };

  const deleteCompletedChore = async (id: string) => {
    await dbDeleteCompletedChore(id);
    setCompletedChores(prev => prev.filter(c => c.id !== id));
  };

  const getUserChores = (userId: string) => {
    return chores.filter(chore => chore.assignedTo.includes(userId));
  };

  const getUserCompletedChores = async (userId: string) => {
    const fetchedChores = await dbGetUserCompletedChores(userId);
    const convertedChores = fetchedChores.map(chore => ({
      ...chore,
      completedAt: (chore.completedAt as Timestamp).toDate(),
      createdAt: (chore.createdAt as Timestamp).toDate(),
      updatedAt: (chore.updatedAt as Timestamp).toDate()
    }));
    
    // Update state with unique chores only
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
        deleteCompletedChore,
        getUserChores,
        getUserCompletedChores,
      }}
    >
      {children}
    </ChoreContext.Provider>
  );
}
