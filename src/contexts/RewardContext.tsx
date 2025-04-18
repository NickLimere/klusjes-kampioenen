
import { createContext, useContext, useState, ReactNode } from "react";

// Define types for our reward data
export interface Reward {
  id: string;
  title: string;
  description?: string;
  image?: string;
  pointCost: number;
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  userId: string;
  redeemedAt: Date;
  status: "pending" | "approved" | "denied";
}

export interface RewardContextType {
  rewards: Reward[];
  redeemedRewards: RedeemedReward[];
  addReward: (reward: Reward) => void;
  updateReward: (reward: Reward) => void;
  deleteReward: (rewardId: string) => void;
  redeemReward: (rewardId: string, userId: string) => boolean;
  updateRedeemStatus: (id: string, status: "approved" | "denied") => void;
  getUserRedeemedRewards: (userId: string) => RedeemedReward[];
}

// Create sample rewards data
export const sampleRewards: Reward[] = [
  {
    id: "r1",
    title: "Movie Night",
    description: "Pick any movie for family movie night",
    image: "🎬",
    pointCost: 50,
  },
  {
    id: "r2",
    title: "1-Hour Screen Time",
    description: "Extra hour of video games or tablet time",
    image: "🎮",
    pointCost: 30,
  },
  {
    id: "r3",
    title: "Sleepover",
    description: "Have a friend sleepover this weekend",
    image: "🛏️",
    pointCost: 100,
  },
  {
    id: "r4",
    title: "Skip One Chore",
    description: "Skip one assigned chore of your choice",
    image: "🚫",
    pointCost: 25,
  },
  {
    id: "r5",
    title: "Special Dessert",
    description: "Choose any dessert for after dinner",
    image: "🍦",
    pointCost: 20,
  },
  {
    id: "r6",
    title: "$5 Allowance",
    description: "Get $5 in cash to spend how you want",
    image: "💵",
    pointCost: 75,
  },
];

// Sample redeemed rewards
export const sampleRedeemedRewards: RedeemedReward[] = [
  {
    id: "rr1",
    rewardId: "r2",
    userId: "1",
    redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: "approved",
  },
  {
    id: "rr2",
    rewardId: "r5",
    userId: "2",
    redeemedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: "approved",
  },
  {
    id: "rr3",
    rewardId: "r4",
    userId: "3",
    redeemedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: "pending",
  },
];

// Create the context
const RewardContext = createContext<RewardContextType | undefined>(undefined);

// Context provider component
export function RewardProvider({ children }: { children: ReactNode }) {
  const [rewards, setRewards] = useState<Reward[]>(sampleRewards);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>(
    sampleRedeemedRewards
  );

  const addReward = (reward: Reward) => {
    setRewards((prevRewards) => [...prevRewards, reward]);
  };

  const updateReward = (updatedReward: Reward) => {
    setRewards((prevRewards) =>
      prevRewards.map((reward) =>
        reward.id === updatedReward.id ? updatedReward : reward
      )
    );
  };

  const deleteReward = (rewardId: string) => {
    setRewards((prevRewards) =>
      prevRewards.filter((reward) => reward.id !== rewardId)
    );
  };

  // Returns true if redemption was successful, false if not enough points
  const redeemReward = (rewardId: string, userId: string): boolean => {
    // In a real app, you would check the user's points balance here
    // and deduct points if sufficient
    
    // For this demo, we'll just create the redemption record
    const newId = `rr${Date.now()}`;
    
    const redeemedReward: RedeemedReward = {
      id: newId,
      rewardId,
      userId,
      redeemedAt: new Date(),
      status: "pending",
    };
    
    setRedeemedRewards((prev) => [...prev, redeemedReward]);
    return true;
  };

  const updateRedeemStatus = (id: string, status: "approved" | "denied") => {
    setRedeemedRewards((prev) =>
      prev.map((rr) => (rr.id === id ? { ...rr, status } : rr))
    );
  };

  const getUserRedeemedRewards = (userId: string) => {
    return redeemedRewards.filter((rr) => rr.userId === userId);
  };

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
