
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import AdminChores from "@/components/admin/AdminChores";
import AdminRewards from "@/components/admin/AdminRewards";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import RewardApprovals from "@/components/admin/RewardApprovals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("analytics");
  const { currentUser } = useUser();
  const navigate = useNavigate();
  
  // Redirect non-admin users
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);
  
  if (!currentUser || currentUser.role !== "admin") {
    return null;
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage chores, rewards, and view family progress
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="chores">Manage Chores</TabsTrigger>
          <TabsTrigger value="rewards">Manage Rewards</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analytics" className="mt-6">
          <AdminAnalytics />
        </TabsContent>
        
        <TabsContent value="chores" className="mt-6">
          <AdminChores />
        </TabsContent>
        
        <TabsContent value="rewards" className="mt-6">
          <AdminRewards />
        </TabsContent>
        
        <TabsContent value="approvals" className="mt-6">
          <RewardApprovals />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
