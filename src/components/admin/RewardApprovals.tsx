
import { useReward } from "@/contexts/RewardContext";
import { useUser } from "@/contexts/UserContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { CheckCircle, XCircle } from "lucide-react";

export default function RewardApprovals() {
  const { redeemedRewards, rewards, updateRedeemStatus } = useReward();
  const { users } = useUser();
  
  // Get pending reward redemptions
  const pendingRedemptions = redeemedRewards.filter(
    rr => rr.status === "pending"
  );
  
  const handleApprove = (id: string) => {
    updateRedeemStatus(id, "approved");
    toast.success("Reward approved!");
  };
  
  const handleDeny = (id: string) => {
    updateRedeemStatus(id, "denied");
    toast.success("Reward denied");
  };
  
  if (pendingRedemptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Reward Approvals</CardTitle>
          <CardDescription>
            Approve or deny reward redemption requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>No pending reward requests</p>
            <p className="text-sm mt-2">All redeemed rewards have been processed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Reward Approvals</CardTitle>
        <CardDescription>
          {pendingRedemptions.length} reward{pendingRedemptions.length !== 1 ? 's' : ''} awaiting your approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingRedemptions.map((redemption) => {
            const reward = rewards.find(r => r.id === redemption.rewardId);
            const user = users.find(u => u.id === redemption.userId);
            
            if (!reward || !user) return null;
            
            return (
              <div
                key={redemption.id}
                className="bg-gray-50 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-xl">
                      {reward.image || "🎁"}
                    </div>
                    <div>
                      <h3 className="font-medium">{reward.title}</h3>
                      <p className="text-sm text-gray-500">
                        {reward.pointCost} points
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                    Pending
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Requested by:</span>{" "}
                      <span className="inline-flex items-center">
                        {user.avatar} {user.name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested on {new Date(redemption.redeemedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeny(redemption.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Deny
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-200 text-green-600 hover:bg-green-50"
                      onClick={() => handleApprove(redemption.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
