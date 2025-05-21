
import MainLayout from "@/components/layout/MainLayout";
import ProfileCard from "@/components/profile/ProfileCard";
import ProfileStats from "@/components/profile/ProfileStats";
import { useUser } from "@/contexts/UserContext";
import { Loader2 } from 'lucide-react';

export default function Profile() {
  const { currentUser, isLoading } = useUser();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-joy-primary" />
          <p className="ml-4 text-lg text-gray-600">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  if (!currentUser) {
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
          <p className="text-xl text-gray-700 mb-4">Profile Not Available</p>
          <p className="text-md text-gray-500">Could not load user data. Please try again later.</p>
          {/* Optionally, add a button to try to re-login or refresh */}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <ProfileCard />
        <ProfileStats />
      </div>
    </MainLayout>
  );
}
