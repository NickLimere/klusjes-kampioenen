
import { useState } from "react";
import { useChore, Chore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
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
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

export default function AdminChores() {
  const { chores, addChore, updateChore, deleteChore } = useChore();
  const { users } = useUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newChore, setNewChore] = useState<Partial<Chore>>({
    title: "",
    description: "",
    pointValue: 5,
    assignedTo: [],
    recurrence: "daily",
  });
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  
  // Filter out admin users
  const childUsers = users.filter(user => user.role !== "admin");
  
  const resetChoreForm = () => {
    setNewChore({
      title: "",
      description: "",
      pointValue: 5,
      assignedTo: [],
      recurrence: "daily",
    });
  };
  
  const handleOpenEditDialog = (chore: Chore) => {
    setEditingChore(chore);
    setIsEditDialogOpen(true);
  };
  
  const handleAddChore = () => {
    if (!newChore.title) {
      toast.error("Please enter a title for the chore");
      return;
    }
    
    if (newChore.assignedTo?.length === 0) {
      toast.error("Please assign this chore to at least one person");
      return;
    }
    
    const choreToAdd: Chore = {
      id: `c${Date.now()}`,
      title: newChore.title || "",
      description: newChore.description || "",
      pointValue: newChore.pointValue || 5,
      assignedTo: newChore.assignedTo || [],
      recurrence: newChore.recurrence as "daily" | "weekly" || "daily",
    };
    
    addChore(choreToAdd);
    toast.success("Chore added successfully");
    resetChoreForm();
    setIsAddDialogOpen(false);
  };
  
  const handleUpdateChore = () => {
    if (!editingChore) return;
    
    if (!editingChore.title) {
      toast.error("Please enter a title for the chore");
      return;
    }
    
    if (editingChore.assignedTo.length === 0) {
      toast.error("Please assign this chore to at least one person");
      return;
    }
    
    updateChore(editingChore);
    toast.success("Chore updated successfully");
    setIsEditDialogOpen(false);
  };
  
  const handleDeleteChore = (choreId: string) => {
    deleteChore(choreId);
    toast.success("Chore deleted successfully");
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Chores</CardTitle>
          <CardDescription>
            Add, edit, or remove chores for your family members
          </CardDescription>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Chore
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Recurrence</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chores.map((chore) => (
              <TableRow key={chore.id}>
                <TableCell className="font-medium">{chore.title}</TableCell>
                <TableCell>{chore.pointValue}</TableCell>
                <TableCell className="capitalize">{chore.recurrence}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {chore.assignedTo.map((userId) => {
                      const user = users.find((u) => u.id === userId);
                      return user ? (
                        <span
                          key={userId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100"
                        >
                          {user.avatar} {user.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </TableCell>
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
                        onClick={() => handleOpenEditDialog(chore)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteChore(chore.id)}
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
      
      {/* Add Chore Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Chore</DialogTitle>
            <DialogDescription>
              Create a new chore and assign it to family members
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newChore.title || ""}
                onChange={(e) =>
                  setNewChore({ ...newChore, title: e.target.value })
                }
                placeholder="Make bed, Take out trash, etc."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newChore.description || ""}
                onChange={(e) =>
                  setNewChore({ ...newChore, description: e.target.value })
                }
                placeholder="Details about how to complete the chore"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Point Value</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={newChore.pointValue || 5}
                  onChange={(e) =>
                    setNewChore({
                      ...newChore,
                      pointValue: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recurrence">Recurrence</Label>
                <Select
                  value={newChore.recurrence}
                  onValueChange={(value) =>
                    setNewChore({
                      ...newChore,
                      recurrence: value as "daily" | "weekly",
                    })
                  }
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Assign to</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {childUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md"
                  >
                    <Checkbox
                      id={`user-${user.id}`}
                      checked={(newChore.assignedTo || []).includes(user.id)}
                      onCheckedChange={(checked) => {
                        const assignedTo = newChore.assignedTo || [];
                        if (checked) {
                          setNewChore({
                            ...newChore,
                            assignedTo: [...assignedTo, user.id],
                          });
                        } else {
                          setNewChore({
                            ...newChore,
                            assignedTo: assignedTo.filter(
                              (id) => id !== user.id
                            ),
                          });
                        }
                      }}
                    />
                    <Label
                      htmlFor={`user-${user.id}`}
                      className="text-sm cursor-pointer flex items-center"
                    >
                      <span className="mr-1">{user.avatar}</span> {user.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddChore}>Add Chore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Chore Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chore</DialogTitle>
            <DialogDescription>
              Modify the details of this chore
            </DialogDescription>
          </DialogHeader>
          
          {editingChore && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingChore.title}
                  onChange={(e) =>
                    setEditingChore({
                      ...editingChore,
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
                  value={editingChore.description || ""}
                  onChange={(e) =>
                    setEditingChore({
                      ...editingChore,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-points">Point Value</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    min="1"
                    value={editingChore.pointValue}
                    onChange={(e) =>
                      setEditingChore({
                        ...editingChore,
                        pointValue: parseInt(e.target.value, 10),
                      })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-recurrence">Recurrence</Label>
                  <Select
                    value={editingChore.recurrence}
                    onValueChange={(value) =>
                      setEditingChore({
                        ...editingChore,
                        recurrence: value as "daily" | "weekly",
                      })
                    }
                  >
                    <SelectTrigger id="edit-recurrence">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Assign to</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {childUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md"
                    >
                      <Checkbox
                        id={`edit-user-${user.id}`}
                        checked={editingChore.assignedTo.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditingChore({
                              ...editingChore,
                              assignedTo: [...editingChore.assignedTo, user.id],
                            });
                          } else {
                            setEditingChore({
                              ...editingChore,
                              assignedTo: editingChore.assignedTo.filter(
                                (id) => id !== user.id
                              ),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`edit-user-${user.id}`}
                        className="text-sm cursor-pointer flex items-center"
                      >
                        <span className="mr-1">{user.avatar}</span> {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
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
            <Button onClick={handleUpdateChore}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
