
import MainLayout from "@/components/layout/MainLayout";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileStats from "@/components/profile/ProfileStats";

export default function Profile() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <ProfileCard />
        <ProfileStats />
      </div>
    </MainLayout>
  );
}
