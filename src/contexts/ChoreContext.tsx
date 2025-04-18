
import { createContext, useContext, useState, ReactNode } from "react";

// Define types for our chore data
export interface Chore {
  id: string;
  title: string;
  description?: string;
  pointValue: number;
  assignedTo: string[];
  recurrence: "daily" | "weekly";
  dueDate?: Date;
}

export interface CompletedChore {
  id: string;
  choreId: string;
  userId: string;
  completedAt: Date;
  pointsEarned: number;
}

export interface ChoreContextType {
  chores: Chore[];
  completedChores: CompletedChore[];
  addChore: (chore: Chore) => void;
  updateChore: (chore: Chore) => void;
  deleteChore: (choreId: string) => void;
  completeChore: (choreId: string, userId: string) => void;
  getUserChores: (userId: string) => Chore[];
  getUserCompletedChores: (userId: string) => CompletedChore[];
}

// Create sample chores data
export const sampleChores: Chore[] = [
  {
    id: "c1",
    title: "Make your bed",
    description: "Tuck in sheets and arrange pillows neatly",
    pointValue: 5,
    assignedTo: ["1", "2", "3"],
    recurrence: "daily",
  },
  {
    id: "c2",
    title: "Feed the pet",
    description: "Give Buddy his food and fresh water",
    pointValue: 5,
    assignedTo: ["1", "2"],
    recurrence: "daily",
  },
  {
    id: "c3",
    title: "Take out trash",
    description: "Empty all trash bins and take to outside container",
    pointValue: 10,
    assignedTo: ["3"],
    recurrence: "weekly",
  },
  {
    id: "c4",
    title: "Clean bathroom sink",
    description: "Wipe down sink, counter and mirror",
    pointValue: 15,
    assignedTo: ["2", "3"],
    recurrence: "weekly",
  },
  {
    id: "c5",
    title: "Set the table",
    description: "Place plates, utensils, and napkins for everyone",
    pointValue: 5,
    assignedTo: ["1", "2", "3"],
    recurrence: "daily",
  },
  {
    id: "c6",
    title: "Vacuum living room",
    description: "Vacuum carpet and under furniture",
    pointValue: 20,
    assignedTo: ["3"],
    recurrence: "weekly",
  },
];

// Sample completed chores (past week)
export const sampleCompletedChores: CompletedChore[] = [
  {
    id: "cc1",
    choreId: "c1",
    userId: "1",
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    pointsEarned: 5,
  },
  {
    id: "cc2",
    choreId: "c2",
    userId: "1",
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    pointsEarned: 5,
  },
  {
    id: "cc3",
    choreId: "c5",
    userId: "1",
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    pointsEarned: 5,
  },
  {
    id: "cc4",
    choreId: "c1",
    userId: "2",
    completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    pointsEarned: 5,
  },
  {
    id: "cc5",
    choreId: "c4",
    userId: "2",
    completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    pointsEarned: 15,
  },
  {
    id: "cc6",
    choreId: "c3",
    userId: "3",
    completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    pointsEarned: 10,
  },
  {
    id: "cc7",
    choreId: "c6",
    userId: "3",
    completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    pointsEarned: 20,
  },
];

// Create the context
const ChoreContext = createContext<ChoreContextType | undefined>(undefined);

// Context provider component
export function ChoreProvider({ children }: { children: ReactNode }) {
  const [chores, setChores] = useState<Chore[]>(sampleChores);
  const [completedChores, setCompletedChores] = useState<CompletedChore[]>(
    sampleCompletedChores
  );

  const addChore = (chore: Chore) => {
    setChores((prevChores) => [...prevChores, chore]);
  };

  const updateChore = (updatedChore: Chore) => {
    setChores((prevChores) =>
      prevChores.map((chore) =>
        chore.id === updatedChore.id ? updatedChore : chore
      )
    );
  };

  const deleteChore = (choreId: string) => {
    setChores((prevChores) => prevChores.filter((chore) => chore.id !== choreId));
  };

  const completeChore = (choreId: string, userId: string) => {
    const chore = chores.find((c) => c.id === choreId);
    
    if (chore) {
      // Generate a unique ID for completed chore
      const newId = `cc${Date.now()}`;
      
      // Create completed chore record
      const completedChore: CompletedChore = {
        id: newId,
        choreId,
        userId,
        completedAt: new Date(),
        pointsEarned: chore.pointValue,
      };
      
      setCompletedChores((prev) => [...prev, completedChore]);
    }
  };

  const getUserChores = (userId: string) => {
    return chores.filter((chore) => chore.assignedTo.includes(userId));
  };

  const getUserCompletedChores = (userId: string) => {
    return completedChores.filter((cc) => cc.userId === userId);
  };

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
