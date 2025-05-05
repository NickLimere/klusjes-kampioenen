import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { 
  getRewards, 
  createReward as dbCreateReward, 
  updateReward as dbUpdateReward, 
  deleteReward as dbDeleteReward,
  redeemReward as dbRedeemReward,
  updateRedeemStatus as dbUpdateRedeemStatus,
  getUserRedeemedRewards as dbGetUserRedeemedRewards
} from "@/lib/db-service";
import { Timestamp } from "firebase/firestore";
import type { Reward as DbReward, RedeemedReward as DbRedeemedReward } from "@/lib/db-types";

// Define types for our reward data
export interface Reward extends Omit<DbReward, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
}

export interface RedeemedReward extends Omit<DbRedeemedReward, 'redeemedAt' | 'updatedAt'> {
  redeemedAt: Date;
  updatedAt: Date;
}

export interface RewardContextType {
  rewards: Reward[];
  redeemedRewards: RedeemedReward[];
  addReward: (reward: Omit<DbReward, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReward: (id: string, reward: Partial<DbReward>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  redeemReward: (rewardId: string, userId: string) => Promise<string>;
  updateRedeemStatus: (id: string, status: "approved" | "denied") => Promise<void>;
  getUserRedeemedRewards: (userId: string) => Promise<RedeemedReward[]>;
}

// Create the context
const RewardContext = createContext<RewardContextType | undefined>(undefined);

// Context provider component
export function RewardProvider({ children }: { children: ReactNode }) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch rewards from Firestore on component mount
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        const fetchedRewards = await getRewards();
        // Convert Firestore Timestamps to JavaScript Dates
        const convertedRewards = fetchedRewards.map(reward => ({
          ...reward,
          createdAt: (reward.createdAt as Timestamp).toDate(),
          updatedAt: (reward.updatedAt as Timestamp).toDate()
        }));
        setRewards(convertedRewards);
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const addReward = async (reward: Omit<DbReward, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await dbCreateReward(reward);
    const newReward = {
      ...reward,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setRewards(prev => [...prev, newReward]);
    return id;
  };

  const updateReward = async (id: string, reward: Partial<DbReward>) => {
    await dbUpdateReward(id, reward);
    setRewards(prev =>
      prev.map(r => r.id === id ? { 
        ...r, 
        ...reward, 
        updatedAt: new Date(),
        createdAt: r.createdAt instanceof Timestamp ? r.createdAt.toDate() : r.createdAt
      } : r)
    );
  };

  const deleteReward = async (id: string) => {
    await dbDeleteReward(id);
    setRewards(prev => prev.filter(r => r.id !== id));
  };

  const redeemReward = async (rewardId: string, userId: string) => {
    const id = await dbRedeemReward({
      rewardId,
      userId,
      redeemedAt: Timestamp.now(),
      status: "pending"
    });
    
    const newRedeemedReward: RedeemedReward = {
      id,
      rewardId,
      userId,
      redeemedAt: new Date(),
      status: "pending",
      updatedAt: new Date()
    };
    
    setRedeemedRewards(prev => [...prev, newRedeemedReward]);
    return id;
  };

  const updateRedeemStatus = async (id: string, status: "approved" | "denied") => {
    await dbUpdateRedeemStatus(id, status);
    setRedeemedRewards(prev =>
      prev.map(rr => rr.id === id ? { ...rr, status, updatedAt: new Date() } : rr)
    );
  };

  const getUserRedeemedRewards = async (userId: string) => {
    const fetchedRewards = await dbGetUserRedeemedRewards(userId);
    const convertedRewards = fetchedRewards.map(reward => ({
      ...reward,
      redeemedAt: (reward.redeemedAt as Timestamp).toDate(),
      updatedAt: (reward.updatedAt as Timestamp).toDate()
    }));
    setRedeemedRewards(prev => {
      const existingIds = new Set(prev.map(r => r.id));
      const newRewards = convertedRewards.filter(r => !existingIds.has(r.id));
      return [...prev, ...newRewards];
    });
    return convertedRewards;
  };

  if (isLoading) {
    return <div>Loading rewards...</div>;
  }

  return (
    <RewardContext.Provider
      value={{
        rewards,
        redeemedRewards,
        addReward,
        updateReward,
        deleteReward,
        redeemReward,
        updateRedeemStatus,
        getUserRedeemedRewards,
      }}
    >
      {children}
    </RewardContext.Provider>
  );
}

// Custom hook to use the context
export function useReward() {
  const context = useContext(RewardContext);
  if (context === undefined) {
    throw new Error("useReward must be used within a RewardProvider");
  }
  return context;
}
