
import { useState } from "react";
import { useReward, Reward } from "@/contexts/RewardContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function AdminRewards() {
  const { rewards, addReward, updateReward, deleteReward, redeemedRewards } = useReward();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newReward, setNewReward] = useState<Partial<Reward>>({
    title: "",
    description: "",
    image: "🎁",
    pointCost: 20,
  });
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  
  const resetRewardForm = () => {
    setNewReward({
      title: "",
      description: "",
      image: "🎁",
      pointCost: 20,
    });
  };
  
  const handleOpenEditDialog = (reward: Reward) => {
    setEditingReward(reward);
    setIsEditDialogOpen(true);
  };
  
  const handleAddReward = () => {
    if (!newReward.title) {
      toast.error("Please enter a title for the reward");
      return;
    }
    
    const rewardToAdd: Reward = {
      id: `r${Date.now()}`,
      title: newReward.title || "",
      description: newReward.description || "",
      image: newReward.image || "🎁",
      pointCost: newReward.pointCost || 20,
    };
    
    addReward(rewardToAdd);
    toast.success("Reward added successfully");
    resetRewardForm();
    setIsAddDialogOpen(false);
  };
  
  const handleUpdateReward = () => {
    if (!editingReward) return;
    
    if (!editingReward.title) {
      toast.error("Please enter a title for the reward");
      return;
    }
    
    updateReward(editingReward);
    toast.success("Reward updated successfully");
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteReward = (rewardId: string) => {
    // Check if reward has been redeemed by anyone
    const hasRedeemed = redeemedRewards.some(rr => rr.rewardId === rewardId);
    
    if (hasRedeemed) {
      toast.error("Cannot delete a reward that has been redeemed");
      return;
    }
    
    deleteReward(rewardId);
    toast.success("Reward deleted successfully");
  };
  
  // Available emojis for rewards
  const emojiOptions = [
    "🎁", "🎮", "🍦", "🍕", "🎬", "🎯", "🛌", "💵", "🎨", "📚", 
    "⚽", "🏀", "🎭", "🚫", "🏆", "🎫", "🍿", "🎪", "🎢", "🧩"
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Rewards</CardTitle>
          <CardDescription>
            Add, edit, or remove rewards that family members can redeem
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reward
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Point Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.map((reward) => (
              <TableRow key={reward.id}>
                <TableCell className="text-2xl">{reward.image}</TableCell>
                <TableCell className="font-medium">{reward.title}</TableCell>
                <TableCell>{reward.description}</TableCell>
                <TableCell>{reward.pointCost}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenEditDialog(reward)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteReward(reward.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      
      {/* Add Reward Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Reward</DialogTitle>
            <DialogDescription>
              Create a new reward that family members can earn
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emoji">Icon</Label>
              <Select
                value={newReward.image}
                onValueChange={(value) => setNewReward({ ...newReward, image: value })}
              >
                <SelectTrigger id="emoji" className="w-full">
                  <SelectValue placeholder="Select an emoji" />
                </SelectTrigger>
                <SelectContent>
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {emojiOptions.map((emoji) => (
                      <Button
                        key={emoji}
                        variant="outline"
                        className="text-2xl p-2 h-10"
                        onClick={() => {
                          setNewReward({ ...newReward, image: emoji });
                          const button = document.querySelector('[data-radix-select-viewport]')?.closest('[role="dialog"]')?.querySelector('[role="button"]');
                          if (button instanceof HTMLElement) button.click();
                        }}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newReward.title || ""}
                onChange={(e) =>
                  setNewReward({ ...newReward, title: e.target.value })
                }
                placeholder="Movie Night, Extra Screen Time, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newReward.description || ""}
                onChange={(e) =>
                  setNewReward({ ...newReward, description: e.target.value })
                }
                placeholder="Details about the reward"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points">Point Cost</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={newReward.pointCost || 20}
                onChange={(e) =>
                  setNewReward({
                    ...newReward,
                    pointCost: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReward}>Add Reward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Reward Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reward</DialogTitle>
            <DialogDescription>
              Modify the details of this reward
            </DialogDescription>
          </DialogHeader>
          
          {editingReward && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-emoji">Icon</Label>
                <Select
                  value={editingReward.image}
                  onValueChange={(value) => 
                    setEditingReward({ ...editingReward, image: value })
                  }
                >
                  <SelectTrigger id="edit-emoji" className="w-full">
                    <SelectValue placeholder="Select an emoji" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="grid grid-cols-5 gap-2 p-2">
                      {emojiOptions.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="outline"
                          className="text-2xl p-2 h-10"
                          onClick={() => {
                            setEditingReward({ ...editingReward, image: emoji });
                            const button = document.querySelector('[data-radix-select-viewport]')?.closest('[role="dialog"]')?.querySelector('[role="button"]');
                            if (button instanceof HTMLElement) button.click();
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingReward.title}
                  onChange={(e) =>
                    setEditingReward({
                      ...editingReward,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">
                  Description (Optional)
                </Label>
                <Input
                  id="edit-description"
                  value={editingReward.description || ""}
                  onChange={(e) =>
                    setEditingReward({
                      ...editingReward,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-points">Point Cost</Label>
                <Input
                  id="edit-points"
                  type="number"
                  min="1"
                  value={editingReward.pointCost}
                  onChange={(e) =>
                    setEditingReward({
                      ...editingReward,
                      pointCost: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateReward}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
