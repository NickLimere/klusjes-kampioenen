
import { useUser } from "@/contexts/UserContext";
import { useReward } from "@/contexts/RewardContext";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";

export default function PointsSummary() {
  const { currentUser } = useUser();
  const { rewards } = useReward();
  
  if (!currentUser || currentUser.role === "admin") return null;
  
  // Find the next available reward (the cheapest one the user can't afford yet)
  const availableRewards = rewards.filter(r => r.pointCost <= currentUser.points);
  const unavailableRewards = rewards.filter(r => r.pointCost > currentUser.points);
  const nextReward = unavailableRewards.sort((a, b) => a.pointCost - b.pointCost)[0];
  
  // Calculate progress percentage to next reward
  let progress = 100; // Default to 100% if all rewards are available
  let pointsToGo = 0;
  
  if (nextReward) {
    progress = Math.round((currentUser.points / nextReward.pointCost) * 100);
    pointsToGo = nextReward.pointCost - currentUser.points;
  }
  
  return (
    <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">Points Summary</h2>
        <div className="flex items-center bg-joy-primary/10 text-joy-primary font-semibold rounded-full px-3 py-1">
          <Award className="mr-1 h-4 w-4" />
          <span>{currentUser.points}</span>
        </div>
      </div>
      
      {nextReward ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Next reward: {nextReward.title}</span>
            <span>{currentUser.points} / {nextReward.pointCost}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600">
            You need {pointsToGo} more points to unlock this reward!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-green-600 font-medium">
            You can afford all available rewards! 🎉
          </p>
          <Progress value={100} className="h-2 bg-green-100" />
          <p className="text-sm text-gray-600">
            Visit the Rewards shop to redeem your points!
          </p>
        </div>
      )}
      
      <div className="mt-4 pt-3 border-t">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Available rewards:</span>
          <span className="font-medium">{availableRewards.length}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total rewards unlocked:</span>
          <span className="font-medium">
            {availableRewards.length} of {rewards.length}
          </span>
        </div>
      </div>
    </div>
  );
}
