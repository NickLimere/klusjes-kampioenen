
import MainLayout from "@/components/layout/MainLayout";
import RewardGrid from "@/components/rewards/RewardGrid";
import MyRewards from "@/components/rewards/MyRewards";

export default function Rewards() {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Rewards Shop</h1>
        <p className="text-gray-600">
          Redeem your hard-earned points for awesome rewards
        </p>
      </div>
      
      <MyRewards />
      
      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold">Available Rewards</h2>
        <p className="text-gray-500 text-sm">
          Select a reward to redeem your points
        </p>
      </div>
      
      <RewardGrid />
    </MainLayout>
  );
}
