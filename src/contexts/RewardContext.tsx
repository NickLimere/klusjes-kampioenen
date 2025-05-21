import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";
import { 
  getRewards, 
  createReward as dbCreateReward, 
  updateReward as dbUpdateReward, 
  deleteReward as dbDeleteReward,
  redeemReward as dbRedeemReward,
  updateRedeemStatus as dbUpdateRedeemStatus,
  getUserRedeemedRewards as dbGetUserRedeemedRewards,
  getAllRedeemedRewards // Added for fetching all redeemed rewards
} from "@/lib/db-service";
import { Timestamp } from "firebase/firestore";
import { toast } from "@/components/ui/sonner";
import type { Reward as DbReward, RedeemedReward as DbRedeemedReward } from "@/lib/db-types";
import { useUser } from "./UserContext"; // Assuming UserContext is in the same directory

// Define types for our reward data
export interface Reward {
  id: string;
  title: string;
  description?: string;
  icon: string;
  pointCost: number;
  createdAt: Date; // Converted from Timestamp
  updatedAt: Date; // Converted from Timestamp
  // availableQuantity is not in DbReward, so it's removed
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
  const { currentUser, users, updateUser: updateUserPoints } = useUser(); // Added 'users' for refund logic

  const addReward = useCallback(async (rewardData: Omit<DbReward, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = await dbCreateReward(rewardData);
    const newReward: Reward = {
      ...rewardData,
      id,
      createdAt: new Date(), 
      updatedAt: new Date()
    };
    setRewards(prev => [...prev, newReward]);
    return id;
  }, []); // setRewards is stable

  const updateReward = useCallback(async (id: string, rewardData: Partial<DbReward>) => {
    await dbUpdateReward(id, rewardData);
    setRewards(prev =>
      prev.map(r => r.id === id ? { 
        ...r, 
        ...rewardData, 
        updatedAt: new Date(),
        createdAt: rewardData.createdAt instanceof Timestamp ? rewardData.createdAt.toDate() : r.createdAt
      } as Reward : r)
    );
  }, []); // setRewards is stable

  const deleteReward = useCallback(async (id: string) => {
    await dbDeleteReward(id);
    setRewards(prev => prev.filter(r => r.id !== id));
  }, []); // setRewards is stable

  const redeemReward = useCallback(async (rewardId: string, userId: string) => {
    if (!currentUser) {
      toast.error("No user selected. Please select a user.");
      throw new Error("No current user found for redeeming reward.");
    }

    if (currentUser.id !== userId) {
      toast.error("Cannot redeem rewards for another user.");
      throw new Error("Attempted to redeem reward for a different user.");
    }

    const rewardToRedeem = rewards.find(r => r.id === rewardId);
    if (!rewardToRedeem) {
      toast.error("Reward not found.");
      throw new Error(`Reward with ID ${rewardId} not found.`);
    }

    if (currentUser.points < rewardToRedeem.pointCost) {
      toast.error("Not enough points to redeem this reward.");
      throw new Error("Insufficient points for redemption.");
    }

    const newRedemptionData = {
      rewardId,
      userId: currentUser.id, // Ensure userId is from currentUser
      redeemedAt: Timestamp.now(),
      status: "pending" as "pending" | "approved" | "denied"
    };

    try {
      // 1. Deduct points
      const updatedUser = {
        ...currentUser,
        points: currentUser.points - rewardToRedeem.pointCost,
        updatedAt: new Date() // Update timestamp for user
      };
      await updateUserPoints(updatedUser); // This updates Firestore and UserContext state

      // 2. Create redeemed reward entry in Firestore
      const id = await dbRedeemReward(newRedemptionData);
      
      // 3. Update local redeemedRewards state
      const newRedeemedRewardLocal: RedeemedReward = {
        id,
        rewardId,
        userId: currentUser.id,
        redeemedAt: new Date(), 
        status: "pending",
        updatedAt: new Date() 
      };
      
      setRedeemedRewards(prev => [...prev, newRedeemedRewardLocal]);
      toast.success("Reward requested! Points deducted."); 
      return id;
    } catch (error) {
      console.error("Error during reward redemption process:", error);
      // Note: If dbRedeemReward fails AFTER points are deducted, we don't have an automatic rollback.
      // A more robust solution would involve transactions or a compensating action.
      // For now, if updateUserPoints succeeded but dbRedeemReward failed, points remain deducted.
      toast.error("Failed to complete reward redemption. Please check and try again.");
      throw error; 
    }
  }, [currentUser, updateUserPoints, rewards, setRedeemedRewards]);

  const updateRedeemStatus = useCallback(async (id: string, status: "approved" | "denied") => {
    await dbUpdateRedeemStatus(id, status); // Update status in Firestore first

    const redeemedEntry = redeemedRewards.find(rr => rr.id === id);

    if (status === "denied" && redeemedEntry) {
      const rewardDefinition = rewards.find(r => r.id === redeemedEntry.rewardId);
      const userToRefund = users.find(u => u.id === redeemedEntry.userId);

      if (rewardDefinition && userToRefund) {
        try {
          const refundedUser = {
            ...userToRefund,
            points: userToRefund.points + rewardDefinition.pointCost,
            updatedAt: new Date()
          };
          await updateUserPoints(refundedUser);
          toast.success(`Reward denied. ${rewardDefinition.pointCost} points refunded to ${userToRefund.name}.`);
        } catch (error) {
          console.error("Error refunding points:", error);
          toast.error(`Failed to refund points for denied reward. Please check user points manually.`);
        }
      } else {
        console.warn("Could not find reward definition or user to refund for denied reward:", redeemedEntry);
        toast("Reward status updated to denied, but automatic point refund failed. Please check manually.");
      }
    }

    // Update local state for the redeemed reward status
    setRedeemedRewards(prev =>
      prev.map(rr => rr.id === id ? { ...rr, status, updatedAt: new Date() } : rr)
    );
  }, [users, rewards, redeemedRewards, updateUserPoints, setRedeemedRewards]); // Added dependencies

  const getUserRedeemedRewards = useCallback(async (userId: string) => {
    const fetchedDbRewards = await dbGetUserRedeemedRewards(userId);
    const convertedLocalRewards = fetchedDbRewards.map(dbReward => ({
      ...dbReward,
      id: dbReward.id,
      rewardId: dbReward.rewardId,
      userId: dbReward.userId,
      redeemedAt: (dbReward.redeemedAt as Timestamp).toDate(),
      status: dbReward.status,
      updatedAt: (dbReward.updatedAt as Timestamp).toDate()
    } as RedeemedReward));
    
    setRedeemedRewards(currentLocalRewards => {
      const rewardsMap = new Map(currentLocalRewards.map(r => [r.id, r]));
      convertedLocalRewards.forEach(r => rewardsMap.set(r.id, r));
      return Array.from(rewardsMap.values());
    });
    return convertedLocalRewards;
  }, []); // setRedeemedRewards is stable

  const contextValue = useMemo(() => ({
    rewards,
    redeemedRewards,
    addReward,
    updateReward,
    deleteReward,
    redeemReward,
    updateRedeemStatus,
    getUserRedeemedRewards,
  }), [rewards, redeemedRewards, addReward, updateReward, deleteReward, redeemReward, updateRedeemStatus, getUserRedeemedRewards]);

  useEffect(() => {
    const fetchInitialData = async () => { // Renamed for clarity
      try {
        setIsLoading(true);
        
        // Fetch Rewards
        const fetchedDbRewards = await getRewards();
        const convertedLocalRewards = fetchedDbRewards.map(dbReward => ({
          id: dbReward.id,
          title: dbReward.title, 
          description: dbReward.description,
          icon: dbReward.icon, 
          pointCost: dbReward.pointCost,
          createdAt: (dbReward.createdAt as Timestamp).toDate(),
          updatedAt: (dbReward.updatedAt as Timestamp).toDate()
        } as Reward));
        setRewards(convertedLocalRewards);

        // Fetch All Redeemed Rewards
        const fetchedDbRedeemedRewards = await getAllRedeemedRewards();
        const convertedLocalRedeemedRewards = fetchedDbRedeemedRewards.map(dbRedeemed => ({
          ...dbRedeemed, // Spread the rest of the properties
          id: dbRedeemed.id, // Ensure id is explicitly mapped
          redeemedAt: (dbRedeemed.redeemedAt as Timestamp).toDate(),
          updatedAt: (dbRedeemed.updatedAt as Timestamp).toDate()
        } as RedeemedReward)); // Cast to local RedeemedReward type
        setRedeemedRewards(convertedLocalRedeemedRewards);

      } catch (error) {
        console.error('Error fetching initial data:', error); // Generalized error message
        toast.error("Failed to load initial application data. Please try refreshing."); // User feedback
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []); // Empty dependency array means this runs once on mount

  if (isLoading) {
    return <div>Loading rewards...</div>;
  }

  return (
    <RewardContext.Provider value={contextValue}>
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
