import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { 
  getChores, 
  createChoreInstance as dbCreateChoreInstance, 
  updateChore as dbUpdateChore, 
  deleteChore as dbDeleteChore,
  assignChoreInstance as dbAssignChoreInstance,
  getUserChoreAssignments as dbGetUserChoreAssignments,
  completeAssignment as dbCompleteAssignment,
  getUserCompletedChores as dbGetUserCompletedChores,
  deleteCompletedChore as dbDeleteCompletedChore
} from "@/lib/db-service";

import type { Chore as DbChore, CompletedChore as DbCompletedChore } from "@/lib/db-types";
import { useUser } from "@/contexts/UserContext";
import { Timestamp } from "firebase/firestore";

// Define types for our chore data
export interface Chore extends Omit<DbChore, 'createdAt' | 'updatedAt' | 'dueDate'> {
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Timestamp;
}

export interface CompletedChore extends Omit<DbCompletedChore, 'completedAt' | 'createdAt' | 'updatedAt'> {
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}


import type { ChoreInstance as DbChoreInstance } from "@/lib/db-types";

// Locally override ChoreInstance to allow dueDate as Date | Timestamp | undefined
export interface ChoreInstance extends Omit<DbChoreInstance, 'createdAt' | 'updatedAt' | 'dueDate'> {
  choreId: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  dueDate?: Timestamp;
}

export interface ChoreAssignmentWithInstance {
  id: string;
  choreInstanceId: string;
  userId: string;
  completed: boolean;
  completedAt?: Date;
  pointsEarned?: number;
  createdAt: Date;
  updatedAt: Date;
  choreInstance: ChoreInstance | null;
}

export interface ChoreContextType {
  chores: Chore[];
  completedChores: CompletedChore[];
  addChore: (chore: Omit<DbChore, 'id' | 'createdAt' | 'updatedAt'>, assignedUserIds: string[]) => Promise<string[]>;
  updateChore: (id: string, chore: Partial<DbChore>) => Promise<void>;
  deleteChore: (id: string) => Promise<void>;
  completeAssignment: (assignmentId: string, pointsEarned?: number) => Promise<void>;
  deleteCompletedChore: (id: string) => Promise<void>;
  getUserAssignments: (userId: string) => Promise<ChoreAssignmentWithInstance[]>;
  getUserCompletedChores: (userId: string) => Promise<CompletedChore[]>;
  getAssignmentsGroupedByChore: () => Promise<Record<string, ChoreAssignmentWithInstance[]>>;
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
          dueDate: (chore.dueDate && (chore.dueDate as Timestamp).seconds !== undefined)
            ? (chore.dueDate as Timestamp)
            : undefined,
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

  const addChore = async (chore: Omit<DbChore, 'id' | 'createdAt' | 'updatedAt'>, assignedUserIds?: string[]) => {
    // Fallback: try to use assignedTo from chore if assignedUserIds not provided
    let userIds: string[] | undefined = assignedUserIds;
    if (!userIds || !Array.isArray(userIds)) {
      if (Array.isArray((chore as any).assignedTo)) {
        userIds = (chore as any).assignedTo;
      } else {
        throw new Error("addChore: assignedUserIds must be an array of user IDs");
      }
    }
    if (!userIds || userIds.length === 0) {
      throw new Error("addChore: No users assigned to this chore");
    }

    // 1. Create a single chore instance
    const instanceData = {
      ...chore,
      recurrence: chore.recurrence,
      pointValue: chore.pointValue,
      title: chore.title,
      description: chore.description,
      // Add any other fields needed for the instance
    };
    const instanceId = await dbCreateChoreInstance(instanceData);

    // 2. For each assigned user, create a chore assignment for this instance
    const assignmentIds: string[] = [];
    for (const userId of userIds) {
      const assignmentId = await dbAssignChoreInstance(instanceId, userId);
      assignmentIds.push(assignmentId);
    }

    // 3. Optionally, update local state if needed
    return assignmentIds;
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

  const completeAssignment = async (assignmentId: string, pointsEarned?: number) => {
  await dbCompleteAssignment(assignmentId, pointsEarned);
  // Optionally, refresh state if needed (e.g., refetch assignments)
};

  const deleteCompletedChore = async (id: string) => {
    await dbDeleteCompletedChore(id);
    setCompletedChores(prev => prev.filter(c => c.id !== id));
  };

  const getUserAssignments = async (userId: string): Promise<ChoreAssignmentWithInstance[]> => {
  const assignments = await dbGetUserChoreAssignments(userId);
  // Convert Firestore timestamps to JS Dates
  return assignments.map(a => ({
    ...a,
    createdAt: a.createdAt
      ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : (a.createdAt instanceof Date ? a.createdAt : undefined))
      : undefined,
    updatedAt: a.updatedAt
      ? (typeof a.updatedAt.toDate === 'function' ? a.updatedAt.toDate() : (a.updatedAt instanceof Date ? a.updatedAt : undefined))
      : undefined,
    completedAt: a.completedAt
      ? (typeof a.completedAt.toDate === 'function' ? a.completedAt.toDate() : (a.completedAt instanceof Date ? a.completedAt : undefined))
      : undefined,
    choreInstance: a.choreInstance
      ? {
          ...a.choreInstance,
          createdAt: typeof a.choreInstance.createdAt?.toDate === 'function' ? a.choreInstance.createdAt.toDate() : (a.choreInstance.createdAt instanceof Date ? a.choreInstance.createdAt : new Date()),
          updatedAt: a.choreInstance.updatedAt
            ? (typeof a.choreInstance.updatedAt.toDate === 'function' ? a.choreInstance.updatedAt.toDate() : (a.choreInstance.updatedAt instanceof Date ? a.choreInstance.updatedAt : new Date()))
            : new Date(),
          
        }
      : null
  }));
};

  const getUserCompletedChores = async (userId: string) => {
    const fetchedChores = await dbGetUserCompletedChores(userId);
    const convertedChores = fetchedChores.map(chore => ({
      ...chore,
      completedAt: (chore.completedAt as Timestamp).toDate(),
      createdAt: (chore.createdAt as Timestamp).toDate(),
      updatedAt: (chore.updatedAt as Timestamp).toDate(),
    }));
    
    // Update state with unique chores only
    setCompletedChores(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newChores = convertedChores.filter(c => !existingIds.has(c.id));
      return [...prev, ...newChores];
    });
    
    return convertedChores;
  };

  // Admin helper: group all assignments by choreId
  const getAssignmentsGroupedByChore = async (): Promise<Record<string, ChoreAssignmentWithInstance[]>> => {
    // Fetch all assignments for all users
    // @ts-ignore: import is available
    const { getAllChoreAssignments } = await import("@/lib/db-service");
    const assignments = await getAllChoreAssignments();

    // Group by original choreId (from the choreInstance)
    const grouped: Record<string, ChoreAssignmentWithInstance[]> = {};
    for (const a of assignments) {
      const choreId = a.choreInstance?.choreId || "unknown";
      const assignmentWithInstance: ChoreAssignmentWithInstance = {
        ...a,
        createdAt: a.createdAt
          ? (typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : (a.createdAt instanceof Date ? a.createdAt : undefined))
          : undefined,
        updatedAt: a.updatedAt
          ? (typeof a.updatedAt.toDate === 'function' ? a.updatedAt.toDate() : (a.updatedAt instanceof Date ? a.updatedAt : undefined))
          : undefined,
        completedAt: a.completedAt
          ? (typeof a.completedAt.toDate === 'function' ? a.completedAt.toDate() : (a.completedAt instanceof Date ? a.completedAt : undefined))
          : undefined,
        choreInstance: a.choreInstance
          ? {
              id: a.choreInstance.id || '',
              title: a.choreInstance.title || '',
              pointValue: a.choreInstance.pointValue || 0,
              recurrence: a.choreInstance.recurrence || 'daily',
              choreId: a.choreInstance.choreId || '',
              createdAt: typeof a.choreInstance.createdAt?.toDate === 'function' ? a.choreInstance.createdAt.toDate() : (a.choreInstance.createdAt instanceof Date ? a.choreInstance.createdAt : new Date()),
              updatedAt: a.choreInstance.updatedAt
                ? (typeof a.choreInstance.updatedAt.toDate === 'function' ? a.choreInstance.updatedAt.toDate() : (a.choreInstance.updatedAt instanceof Date ? a.choreInstance.updatedAt : new Date()))
                : new Date(),
              dueDate: a.choreInstance.dueDate && (a.choreInstance.dueDate as Timestamp).seconds !== undefined
                ? (a.choreInstance.dueDate as Timestamp)
                : undefined,
              description: a.choreInstance.description || '',
            }
          : {
              id: '',
              title: '',
              pointValue: 0,
              recurrence: 'daily',
              choreId: '',
              createdAt: new Date(),
              updatedAt: new Date(),
              dueDate: undefined,
              description: '',
            }
      };
      if (!grouped[choreId]) grouped[choreId] = [];
      grouped[choreId].push(assignmentWithInstance);
    }
    return grouped;
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
        completeAssignment,
        deleteCompletedChore,
        getUserAssignments,
        getUserCompletedChores,
        getAssignmentsGroupedByChore,
      }}
    >
      {children}
    </ChoreContext.Provider>
  );
}
