
import { useState } from "react";
import { useReward } from "@/contexts/RewardContext";
import { useUser } from "@/contexts/UserContext";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export default function RewardGrid() {
  const { rewards, redeemReward } = useReward();
  const { currentUser } = useUser();
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  
  if (!currentUser) return null;
  const isAdmin = currentUser.role === "admin";
  
  const handleRedeemReward = (rewardId: string) => {
    if (currentUser && rewardId) {
      const reward = rewards.find(r => r.id === rewardId);
      
      if (reward && currentUser.points >= reward.pointCost) {
        const success = redeemReward(rewardId, currentUser.id);
        
        if (success) {
          toast.success("Reward redeemed! Waiting for approval.", {
            description: `You have redeemed ${reward.title}.`,
          });
        } else {
          toast.error("Couldn't redeem reward", {
            description: "There was an error processing your request.",
          });
        }
      } else {
        toast.error("Not enough points", {
          description: "You don't have enough points to redeem this reward.",
        });
      }
      
      setSelectedReward(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => {
          const canAfford = currentUser.points >= reward.pointCost || isAdmin;
          
          return (
            <div
              key={reward.id}
              className={`reward-card relative ${
                !canAfford ? "opacity-70" : ""
              }`}
            >
              <div className="text-4xl mb-3">{reward.image}</div>
              <h3 className="text-lg font-bold mb-1">{reward.title}</h3>
              {reward.description && (
                <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
              )}
              
              <div className="flex items-center justify-between mt-auto">
                <span className="inline-flex items-center gap-1 bg-joy-primary/10 text-joy-primary px-3 py-1 rounded-full text-sm font-medium">
                  {reward.pointCost} points
                </span>
                
                <Button
                  variant="default"
                  size="sm"
                  disabled={!canAfford}
                  onClick={() => setSelectedReward(reward.id)}
                  className="btn-bounce"
                >
                  Redeem
                </Button>
              </div>
              
              {!canAfford && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                  <div className="bg-joy-dark/80 text-white px-3 py-1 rounded-full text-sm">
                    Need {reward.pointCost - currentUser.points} more points
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <AlertDialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redeem Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to redeem this reward? This will deduct points from your balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReward && handleRedeemReward(selectedReward)}
            >
              Redeem
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
