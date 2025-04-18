
import { createContext, useContext, useState, ReactNode } from "react";

// Define types for our user data
export type UserRole = "child" | "admin";

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  role: UserRole;
}

export interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
}

// Create sample users data
export const sampleUsers: User[] = [
  {
    id: "1",
    name: "Alex",
    avatar: "👦",
    points: 120,
    role: "child",
  },
  {
    id: "2",
    name: "Emma",
    avatar: "👧",
    points: 85,
    role: "child",
  },
  {
    id: "3",
    name: "Jack",
    avatar: "👨",
    points: 215,
    role: "child",
  },
  {
    id: "4",
    name: "Mom",
    avatar: "👩",
    points: 0,
    role: "admin",
  },
  {
    id: "5",
    name: "Dad",
    avatar: "🧔",
    points: 0,
    role: "admin",
  },
];

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Context provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(sampleUsers[0]);

  const addUser = (user: User) => {
    setUsers((prevUsers) => [...prevUsers, user]);
  };

  const updateUser = (updatedUser: User) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? updatedUser : user
      )
    );
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        addUser,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
