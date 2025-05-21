import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import { 
  createChoreInstance as dbCreateChoreInstance, 
  updateChoreInstance as dbUpdateChoreInstance, 
  deleteChoreInstance as dbDeleteChoreInstance,
  getChoreInstances as dbGetChoreInstances, // Added
  assignChoreInstance as dbAssignChoreInstance,
  getUserChoreAssignments as dbGetUserChoreAssignments,
  completeAssignment as dbCompleteAssignment,
  getUserCompletedChores as dbGetUserCompletedChores,
  deleteCompletedChore as dbDeleteCompletedChore,
  completeChore
} from "@/lib/db-service";

import type { CompletedChore as DbCompletedChore } from "@/lib/db-types"; // Removed DbChore
import { useUser } from "@/contexts/UserContext";
import { Timestamp } from "firebase/firestore";


export interface CompletedChore extends Omit<DbCompletedChore, 'completedAt' | 'createdAt' | 'updatedAt'> {
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

import type { ChoreInstance as DbChoreInstance } from "@/lib/db-types";

// This interface represents ChoreInstance data as provided BY THE CONTEXT,
// after Timestamps have been converted to Dates.
export interface ChoreInstance {
  id: string;
  title: string;
  description?: string;
  pointValue: number;
  recurrence: 'daily' | 'weekly' | 'one-time';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
}

export interface ChoreAssignmentWithInstance {
  id: string;
  choreInstanceId: string;
  userId: string;

  pointsEarned?: number;
  createdAt: Date;
  updatedAt: Date;
  choreInstance: ChoreInstance | null;
}

export interface ChoreContextType {
  // chores: Chore[]; // Removed
  choreInstances: ChoreInstance[];
  completedChores: CompletedChore[];
  addChoreInstance: (choreInstance: Omit<DbChoreInstance, 'id' | 'createdAt' | 'updatedAt'>, assignedUserIds?: string[]) => Promise<string>; // Renamed and updated signature
  updateChoreInstance: (id: string, choreInstance: Partial<DbChoreInstance>) => Promise<void>; // Renamed and updated signature
  deleteChoreInstance: (id: string) => Promise<void>; // Renamed
  completeAssignment: (assignmentId: string, pointsEarned?: number) => Promise<void>;
  deleteCompletedChore: (id: string) => Promise<void>;
  getUserAssignments: (userId: string) => Promise<ChoreAssignmentWithInstance[]>;
  getUserCompletedChores: (userId: string) => Promise<CompletedChore[]>;
  getAssignmentsGroupedByChore: () => Promise<Record<string, ChoreAssignmentWithInstance[]>>;
  allAssignments: ChoreAssignmentWithInstance[];
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
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ChoreProvider({ children }: { children: ReactNode }) {
  const [choreInstances, setChoreInstances] = useState<ChoreInstance[]>([]);
  const [completedChores, setCompletedChores] = useState<CompletedChore[]>([]);
  const [allAssignments, setAllAssignments] = useState<ChoreAssignmentWithInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUser();

  const fetchAllAssignmentsInProvider = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getAllChoreAssignments } = await import("@/lib/db-service");
      const fetchedDbAssignments = await getAllChoreAssignments();

      const mappedAssignments: ChoreAssignmentWithInstance[] = fetchedDbAssignments.map(a => {
        let mappedChoreInstance: ChoreInstance | null = null;
        if (a.choreInstance) {
          const ci = a.choreInstance;
          mappedChoreInstance = {
            id: ci.id,
            title: ci.title,
            description: ci.description,
            pointValue: ci.pointValue,
            recurrence: ci.recurrence,
            createdAt: (ci.createdAt as Timestamp).toDate(),
            updatedAt: (ci.updatedAt as Timestamp).toDate(),
            dueDate: ci.dueDate ? (ci.dueDate as Timestamp).toDate() : undefined,
            completedAt: ci.completedAt ? (ci.completedAt as Timestamp).toDate() : undefined,
          };
        } else {
           mappedChoreInstance = {
              id: a.choreInstanceId ? `${a.choreInstanceId}-fallback` : 'orphan-assignment-fallback',
              title: 'Unknown Chore Instance (AllAssignments Fallback)',
              description: 'This assignment may be orphaned or its instance data is missing.',
              pointValue: 0,
              recurrence: 'one-time',
              createdAt: new Date(), 
              updatedAt: new Date(), 
              dueDate: undefined,
              completedAt: undefined,
           } as ChoreInstance;
        }
        return {
          id: a.id,
          choreInstanceId: a.choreInstanceId,
          userId: a.userId,
          pointsEarned: a.pointsEarned,
          createdAt: (a.createdAt as Timestamp).toDate(),
          updatedAt: (a.updatedAt as Timestamp).toDate(),
          choreInstance: mappedChoreInstance,
        };
      });
      setAllAssignments(mappedAssignments);
    } catch (error) {
      console.error("Error fetching all assignments in provider:", error);
      setAllAssignments([]); 
    } finally {
      setIsLoading(false); 
    }
  }, []); 

  const getUserCompletedChores = useCallback(async (userId: string) => {
    const fetchedDbChores = await dbGetUserCompletedChores(userId);
    const convertedChores = fetchedDbChores.map(chore => ({
      ...chore,
      id: chore.id,
      completedAt: (chore.completedAt as Timestamp).toDate(),
      createdAt: (chore.createdAt as Timestamp).toDate(),
      updatedAt: (chore.updatedAt as Timestamp).toDate(),
    } as CompletedChore));
    setCompletedChores(convertedChores); 
    return convertedChores;
  }, []); 

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const fetchedInstances = await dbGetChoreInstances();
        setChoreInstances(fetchedInstances.map((dbInstance: DbChoreInstance): ChoreInstance => ({
          id: dbInstance.id,
          title: dbInstance.title,
          description: dbInstance.description,
          pointValue: dbInstance.pointValue,
          recurrence: dbInstance.recurrence,
          createdAt: dbInstance.createdAt.toDate(), 
          updatedAt: dbInstance.updatedAt.toDate(), 
          dueDate: dbInstance.dueDate ? dbInstance.dueDate.toDate() : undefined,
          completedAt: dbInstance.completedAt ? dbInstance.completedAt.toDate() : undefined,
        })));
        
        await fetchAllAssignmentsInProvider();

      } catch (error) {
        console.error("Error loading chore instances or all assignments:", error);
      } finally {
        // setIsLoading(false) is handled by fetchAllAssignmentsInProvider and the user completed chores effect
      }
    };

    loadInitialData();
  }, [fetchAllAssignmentsInProvider]); 

  useEffect(() => {
    console.log('CHORE_CONTEXT: currentUser effect running. User ID:', currentUser?.id, new Date().toLocaleTimeString());
    const loadUserChores = async () => {
      if (currentUser && currentUser.id) {
        setIsLoading(true); 
        try {
          await getUserCompletedChores(currentUser.id);
        } catch (error) {
          console.error(`Error loading completed chores for user ${currentUser.id}:`, error);
          setCompletedChores([]); 
        } finally {
          setIsLoading(false); 
        }
      }
    };

    loadUserChores();
  }, [currentUser, getUserCompletedChores]);

  const addChoreInstance = useCallback(async (choreInstanceData: Omit<DbChoreInstance, 'id' | 'createdAt' | 'updatedAt'>, assignedUserIds?: string[]) => {
    const newInstanceId = await dbCreateChoreInstance(choreInstanceData); 

    const newChoreInstanceForState: ChoreInstance = {
      id: newInstanceId,
      title: choreInstanceData.title,
      description: choreInstanceData.description,
      pointValue: choreInstanceData.pointValue,
      recurrence: choreInstanceData.recurrence,
      createdAt: new Date(), 
      updatedAt: new Date(), 
      dueDate: choreInstanceData.dueDate ? (choreInstanceData.dueDate as Timestamp).toDate() : undefined,
      completedAt: choreInstanceData.completedAt ? (choreInstanceData.completedAt as Timestamp).toDate() : undefined,
    };

    setChoreInstances((prevInstances) => [...prevInstances, newChoreInstanceForState]);

    if (assignedUserIds && assignedUserIds.length > 0) {
      for (const userId of assignedUserIds) {
        await dbAssignChoreInstance(newInstanceId, userId, choreInstanceData.pointValue);
      }
    }
    return newInstanceId;
  }, []); 

  const updateChoreInstance = useCallback(async (id: string, choreInstanceUpdate: Partial<DbChoreInstance>) => {
    await dbUpdateChoreInstance(id, choreInstanceUpdate);
    setChoreInstances(prevInstances =>
      prevInstances.map(instance =>
        instance.id === id
          ? { 
              ...instance, 
              ...choreInstanceUpdate, 
              createdAt: choreInstanceUpdate.createdAt ? (choreInstanceUpdate.createdAt instanceof Timestamp ? choreInstanceUpdate.createdAt.toDate() : new Date(choreInstanceUpdate.createdAt as any)) : instance.createdAt,
              updatedAt: new Date() 
            } as ChoreInstance
          : instance
      )
    );
  }, []);

  const deleteChoreInstance = useCallback(async (id: string) => {
    await dbDeleteChoreInstance(id);
    setChoreInstances(prevInstances => prevInstances.filter(instance => instance.id !== id));
  }, []);

  const completeAssignment = useCallback(async (assignmentId: string, pointsEarned?: number) => {
    if (!currentUser?.id) {
        console.error("Cannot complete assignment: no current user.");
        return;
    }
    const userAssignments = await dbGetUserChoreAssignments(currentUser.id);
    const assignment = userAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
      console.error("Assignment not found for completion record");
      return;
    }
    if (!assignment.choreInstanceId) {
        console.error("ChoreInstanceId not found on assignment");
        return;
    }
    const now = Timestamp.now();
    const completedChoreData: Omit<DbCompletedChore, 'id'> = {
      choreInstanceId: assignment.choreInstanceId,
      userId: assignment.userId,
      completedAt: now,
      pointsEarned: typeof pointsEarned === 'number' ? pointsEarned : (assignment.pointsEarned || 0),
      createdAt: now, 
      updatedAt: now
    };
    await completeChore(completedChoreData);
    await getUserCompletedChores(currentUser.id);
  }, [currentUser, getUserCompletedChores]); 

  const deleteCompletedChore = useCallback(async (id: string) => {
    await dbDeleteCompletedChore(id);
    setCompletedChores(prev => prev.filter(c => c.id !== id));
  }, []);

  const getUserAssignments = useCallback(async (userId: string): Promise<ChoreAssignmentWithInstance[]> => {
    const dbAssignments = await dbGetUserChoreAssignments(userId);
    return dbAssignments.map((a): ChoreAssignmentWithInstance => {
      let mappedChoreInstance: ChoreInstance | null = null;
      if (a.choreInstance) {
        const ci = a.choreInstance;
        mappedChoreInstance = {
          id: ci.id,
          title: ci.title,
          description: ci.description,
          pointValue: ci.pointValue,
          recurrence: ci.recurrence,
          createdAt: (ci.createdAt as Timestamp).toDate(),
          updatedAt: (ci.updatedAt as Timestamp).toDate(),
          dueDate: ci.dueDate ? (ci.dueDate as Timestamp).toDate() : undefined,
          completedAt: ci.completedAt ? (ci.completedAt as Timestamp).toDate() : undefined,
        };
      } else {
        const localInstance = choreInstances.find(inst => inst.id === a.choreInstanceId);
        if (localInstance) {
          mappedChoreInstance = localInstance;
        } else {
          mappedChoreInstance = {
             id: a.choreInstanceId ? `${a.choreInstanceId}-fallback` : 'orphan-assignment-fallback',
             title: 'Unknown Chore Instance (UserAssignments Fallback)',
             description: '',
             pointValue: 0,
             recurrence: 'one-time',
             createdAt: new Date(), 
             updatedAt: new Date(), 
             dueDate: undefined,
             completedAt: undefined,
          } as ChoreInstance;
        }
      }
      return {
        id: a.id,
        choreInstanceId: a.choreInstanceId,
        userId: a.userId,
        pointsEarned: a.pointsEarned,
        createdAt: (a.createdAt as Timestamp).toDate(),
        updatedAt: (a.updatedAt as Timestamp).toDate(),
        choreInstance: mappedChoreInstance,
      };
    });
  }, [choreInstances]);

  const getAssignmentsGroupedByChore = useCallback(async (): Promise<Record<string, ChoreAssignmentWithInstance[]>> => {
    const { getAllChoreAssignments } = await import("@/lib/db-service");
    const assignments = await getAllChoreAssignments();
    const grouped: Record<string, ChoreAssignmentWithInstance[]> = {};
    for (const a of assignments) {
      const instanceId = a.choreInstanceId || "unknown";
      let mappedChoreInstance: ChoreInstance | null = null;
      if (a.choreInstance) {
        const ci = a.choreInstance;
        mappedChoreInstance = {
          id: ci.id, title: ci.title, description: ci.description, pointValue: ci.pointValue, recurrence: ci.recurrence,
          createdAt: (ci.createdAt as Timestamp).toDate(), updatedAt: (ci.updatedAt as Timestamp).toDate(),
          dueDate: ci.dueDate ? (ci.dueDate as Timestamp).toDate() : undefined, completedAt: ci.completedAt ? (ci.completedAt as Timestamp).toDate() : undefined,
        };
      } else {
         mappedChoreInstance = {
            id: 'unknown-instance-fallback', title: 'Unknown Chore Instance (Fallback)', description: '', pointValue: 0, recurrence: 'one-time',
            createdAt: new Date(), updatedAt: new Date(), dueDate: undefined, completedAt: undefined,
         } as ChoreInstance;
      }
      const assignmentWithInstance: ChoreAssignmentWithInstance = {
        id: a.id, choreInstanceId: a.choreInstanceId, userId: a.userId, pointsEarned: a.pointsEarned,
        createdAt: (a.createdAt as Timestamp).toDate(), updatedAt: (a.updatedAt as Timestamp).toDate(),
        choreInstance: mappedChoreInstance,
      };
      if (!grouped[instanceId]) grouped[instanceId] = [];
      grouped[instanceId].push(assignmentWithInstance);
    }
    return grouped;
  }, []);

  const contextValue = useMemo(() => ({
    choreInstances,
    completedChores,
    allAssignments,
    addChoreInstance,
    updateChoreInstance,
    deleteChoreInstance,
    completeAssignment,
    deleteCompletedChore,
    getUserAssignments,
    getUserCompletedChores,
    getAssignmentsGroupedByChore,
  }), [
    choreInstances, completedChores, allAssignments,
    addChoreInstance, updateChoreInstance, deleteChoreInstance,
    completeAssignment, deleteCompletedChore, getUserAssignments,
    getUserCompletedChores, getAssignmentsGroupedByChore,
  ]);

  if (isLoading && !currentUser) { 
    return <div>Loading chores data...</div>;
  }

  return (
    <ChoreContext.Provider value={contextValue}>
      {children}
    </ChoreContext.Provider>
  );
}
