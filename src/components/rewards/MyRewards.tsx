
import { useReward } from "@/contexts/RewardContext";
import { useUser } from "@/contexts/UserContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, X } from "lucide-react";

export default function MyRewards() {
  const { redeemedRewards, rewards } = useReward();
  const { currentUser } = useUser();
  
  if (!currentUser) return null;
  
  // Get redeemed rewards for this user
  const userRedeemedRewards = redeemedRewards.filter(
    rr => rr.userId === currentUser.id
  );
  
  // Sort by most recent first
  userRedeemedRewards.sort((a, b) => 
    new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
  );
  
  if (userRedeemedRewards.length === 0) {
    return null;
  }
  
  // Get status icon based on reward status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "denied":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };
  
  // Get status text and color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Approved
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Denied
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Rewards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userRedeemedRewards.map((redeemedReward) => {
            const reward = rewards.find(r => r.id === redeemedReward.rewardId);
            
            if (!reward) return null;
            
            return (
              <div
                key={redeemedReward.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md shadow-sm text-xl">
                    {reward.image || "🎁"}
                  </div>
                  <div>
                    <h3 className="font-medium">{reward.title}</h3>
                    <p className="text-xs text-gray-500">
                      Redeemed on {new Date(redeemedReward.redeemedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 items-center">
                  {getStatusBadge(redeemedReward.status)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
