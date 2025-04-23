import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { getUsers } from "@/lib/db-service";
import { Timestamp } from "firebase/firestore";

// Define types for our user data
export type UserRole = "child" | "admin";

export interface User {
  id: string;
  name: string;
  avatar: string;
  points: number;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserContextType {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User) => void;
  addUser: (user: User) => void;
  updateUser: (user: User) => void;
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Context provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch users from Firestore on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        // Convert Firestore Timestamps to JavaScript Dates
        const convertedUsers = fetchedUsers.map(user => ({
          ...user,
          createdAt: (user.createdAt as Timestamp).toDate(),
          updatedAt: (user.updatedAt as Timestamp).toDate()
        }));
        setUsers(convertedUsers);
        // Set the first user as current user if none is set
        if (!currentUser && convertedUsers.length > 0) {
          setCurrentUser(convertedUsers[0]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
