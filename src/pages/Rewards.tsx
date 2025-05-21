import MainLayout from "@/components/layout/MainLayout";
import MyRewards from "@/components/rewards/MyRewards";
import RewardGrid from "@/components/rewards/RewardGrid";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter } from "lucide-react";

export default function Rewards() {
  const { currentUser } = useUser();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['pending']);

  const handleStatusChange = (status: string, checked: boolean) => {
    setSelectedStatuses(prev =>
      checked ? [...prev, status] : prev.filter(s => s !== status)
    );
  };

  return (
    <MainLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">Rewards Shop</h1>
          <p className="text-gray-600">
            Redeem your hard-earned points for awesome rewards
          </p>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('pending')}
                onCheckedChange={(checked) => handleStatusChange('pending', checked as boolean)}
              >
                Pending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('approved')}
                onCheckedChange={(checked) => handleStatusChange('approved', checked as boolean)}
              >
                Approved
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatuses.includes('denied')}
                onCheckedChange={(checked) => handleStatusChange('denied', checked as boolean)}
              >
                Denied
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <MyRewards selectedStatuses={selectedStatuses} />
      
      <div className="mt-8 mb-4">
        <h2 className="text-xl font-semibold">
            Available Rewards {currentUser && `(${currentUser.points} total points)`}
          </h2>
        <p className="text-gray-500 text-sm">
          Select a reward to redeem your points
        </p>
      </div>
      
      <RewardGrid />
    </MainLayout>
  );
}
