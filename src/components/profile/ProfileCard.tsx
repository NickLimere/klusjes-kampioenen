
import { useUser } from "@/contexts/UserContext";
import { useChore } from "@/contexts/ChoreContext";
import { useReward } from "@/contexts/RewardContext";
import { CheckCircle, Trophy, Star } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileCard() {
  const { currentUser } = useUser();
  const { completedChores, chores } = useChore();
  const { redeemedRewards } = useReward();
  
  if (!currentUser) return null;
  
  const userCompletedChores = completedChores.filter(
    cc => cc.userId === currentUser.id
  );
  
  const userRedeemedRewards = redeemedRewards.filter(
    rr => rr.userId === currentUser.id
  );
  
  // Calculate total points earned (all time)
  const totalPointsEarned = userCompletedChores.reduce(
    (sum, cc) => sum + cc.pointsEarned, 0
  );
  
  // Calculate total points spent
  const totalPointsSpent = userRedeemedRewards
    .filter(rr => rr.status === "approved")
    .length * 10; // Simplified for demo
  
  // Find favorite chore (most completed)
  const choreCountMap: Record<string, number> = {};
  
  userCompletedChores.forEach(cc => {
    if (!choreCountMap[cc.choreInstanceId]) {
      choreCountMap[cc.choreInstanceId] = 0;
    }
    choreCountMap[cc.choreInstanceId]++;
  });
  
  let favoriteChoreId = "";
  let favoriteChoreCount = 0;
  
  Object.entries(choreCountMap).forEach(([choreInstanceId, count]) => {
    if (count > favoriteChoreCount) {
      favoriteChoreId = choreInstanceId;
      favoriteChoreCount = count;
    }
  });
  
  const favoriteChore = chores.find(c => c.id === favoriteChoreId);

  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-gradient-to-r from-joy-primary to-joy-secondary" />
      <CardHeader className="mt-[-4rem] pb-2">
        <div className="flex flex-col items-center">
          <Avatar className="h-20 w-20 ring-4 ring-white bg-white text-4xl">
            <AvatarFallback>{currentUser.avatar}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mt-4">{currentUser.name}</h2>
          <p className="text-gray-500">
            {currentUser.role === "admin" ? "Parent" : "Child"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
          <div className="bg-joy-card-1 rounded-xl p-4 flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
              <CheckCircle className="h-6 w-6 text-joy-primary" />
            </div>
            <span className="text-xl font-bold">{userCompletedChores.length}</span>
            <span className="text-sm text-gray-600">Chores completed</span>
          </div>
          
          <div className="bg-joy-card-2 rounded-xl p-4 flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
              <Trophy className="h-6 w-6 text-joy-secondary" />
            </div>
            <span className="text-xl font-bold">{totalPointsEarned}</span>
            <span className="text-sm text-gray-600">Points earned</span>
          </div>
          
          <div className="bg-joy-card-4 rounded-xl p-4 flex flex-col items-center">
            <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
              <Star className="h-6 w-6 text-joy-accent" />
            </div>
            <span className="text-xl font-bold">{userRedeemedRewards.length}</span>
            <span className="text-sm text-gray-600">Rewards redeemed</span>
          </div>
        </div>
        
        {favoriteChore && (
          <div className="mt-6 bg-gray-50 p-4 rounded-xl">
            <h3 className="font-medium text-gray-700 mb-1">Favorite Chore</h3>
            <div className="flex items-center justify-between">
              <p className="text-joy-primary font-semibold">{favoriteChore.title}</p>
              <span className="text-sm text-gray-500">
                Completed {favoriteChoreCount} times
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
