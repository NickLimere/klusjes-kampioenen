import { useState, useEffect } from "react";
import { useChore, Chore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
import { Timestamp } from "firebase/firestore";
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
  
  // Filter out admin users and sort in specific order
  const userOrder = ['Mia', 'Emma', 'Mama', 'Papa'];
  const childUsers = users
    .filter(user => user.role !== "admin" && user.id)
    .sort((a, b) => {
      const aIndex = userOrder.indexOf(a.name);
      const bIndex = userOrder.indexOf(b.name);
      return aIndex - bIndex;
    });
  
  // Create a test chore if none exist
  useEffect(() => {
    if (chores.length === 0 && childUsers.length > 0) {
      console.log('Creating test chore...');
      const testChore = {
        title: "Make Bed",
        description: "Make your bed every morning",
        pointValue: 5,
        assignedTo: [childUsers[0].id],
        recurrence: "daily" as const
      };
      addChore(testChore).catch(error => {
        console.error('Error creating test chore:', error);
      });
    }
  }, [chores, childUsers, addChore]);
  
  // Log the current state
  useEffect(() => {
    console.log('Current chores:', chores);
    console.log('Current users:', users.map(user => ({ id: user.id, name: user.name, role: user.role })));
  }, [chores, users]);
  
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
  
  const handleAddChore = async () => {
    if (!newChore.title) {
      toast.error("Please enter a title for the chore");
      return;
    }
    
    // Filter out any undefined values from assignedTo
    const validAssignedTo = (newChore.assignedTo || []).filter(id => id !== undefined && id !== null);
    
    if (validAssignedTo.length === 0) {
      toast.error("Please assign this chore to at least one person");
      return;
    }
    
    // Create a chore object that matches the Chore interface from db-types.ts
    const choreToAdd = {
      title: newChore.title,
      description: newChore.description || "",
      pointValue: newChore.pointValue || 5,
      assignedTo: validAssignedTo,
      recurrence: (newChore.recurrence || "daily") as "daily" | "weekly" | "one-time",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    try {
      console.log('Starting to add chore with data:', newChore);
      console.log('Processed chore data:', choreToAdd);
      console.log('Data types:', {
        title: typeof choreToAdd.title,
        description: typeof choreToAdd.description,
        pointValue: typeof choreToAdd.pointValue,
        assignedTo: Array.isArray(choreToAdd.assignedTo),
        assignedToContents: choreToAdd.assignedTo.map(id => ({ id, type: typeof id })),
        recurrence: typeof choreToAdd.recurrence,
        createdAt: choreToAdd.createdAt instanceof Timestamp,
        updatedAt: choreToAdd.updatedAt instanceof Timestamp
      });

      // Validate required fields
      if (!choreToAdd.title || !choreToAdd.assignedTo || choreToAdd.assignedTo.length === 0) {
        console.error('Validation failed:', {
          hasTitle: !!choreToAdd.title,
          hasAssignedTo: !!choreToAdd.assignedTo,
          assignedToLength: choreToAdd.assignedTo.length,
          assignedToContents: choreToAdd.assignedTo
        });
        throw new Error("Missing required fields");
      }

      // Ensure all fields have the correct type
      if (typeof choreToAdd.pointValue !== 'number') {
        console.error('Invalid pointValue type:', typeof choreToAdd.pointValue);
        throw new Error("Point value must be a number");
      }

      if (!['daily', 'weekly'].includes(choreToAdd.recurrence)) {
        console.error('Invalid recurrence value:', choreToAdd.recurrence);
        throw new Error("Recurrence must be either 'daily' or 'weekly'");
      }

      console.log('Attempting to add chore to Firestore...');
      const result = await addChore(choreToAdd);
      console.log('Chore added successfully with ID:', result);
      
      toast.success("Chore added successfully");
      resetChoreForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Detailed error adding chore:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        choreData: newChore,
        processedChoreData: choreToAdd
      });
      toast.error("Failed to add chore. Check console for details.");
    }
  };
  
  const handleUpdateChore = async () => {
    if (!editingChore) return;
    
    if (!editingChore.title) {
      toast.error("Please enter a title for the chore");
      return;
    }
    
    if (editingChore.assignedTo.length === 0) {
      toast.error("Please assign this chore to at least one person");
      return;
    }
    
    try {
      // Create a clean update object without undefined values
      const updateData = {
        title: editingChore.title,
        description: editingChore.description || "",
        pointValue: editingChore.pointValue,
        assignedTo: editingChore.assignedTo,
        recurrence: editingChore.recurrence,
        updatedAt: Timestamp.now()
      };

      // Remove any undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateChore(editingChore.id, updateData);
      toast.success("Chore updated successfully");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating chore:', error);
      toast.error("Failed to update chore");
    }
  };
  
  const handleDeleteChore = async (choreId: string) => {
    try {
      await deleteChore(choreId);
      toast.success("Chore deleted successfully");
    } catch (error) {
      console.error('Error deleting chore:', error);
      toast.error("Failed to delete chore");
    }
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
        <div className="flex gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Chore
          </Button>
        </div>
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
                    {chore.assignedTo.map((userId, index) => {
                      const user = users.find((u) => u.id === userId);
                      return user ? (
                        <span
                          key={`${chore.id}-${userId}-${index}`}
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
                  min="0"
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
                      checked={newChore.assignedTo?.includes(user.id) || false}
                      onCheckedChange={(checked) => {
                        console.log('Checkbox changed:', { userId: user.id, checked });
                        setNewChore(prev => {
                          const currentAssignedTo = prev.assignedTo || [];
                          let newAssignedTo: string[];
                          
                          if (checked) {
                            newAssignedTo = [...currentAssignedTo, user.id];
                          } else {
                            newAssignedTo = currentAssignedTo.filter(id => id !== user.id);
                          }
                          
                          console.log('New assignedTo:', newAssignedTo);
                          return {
                            ...prev,
                            assignedTo: newAssignedTo
                          };
                        });
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
                    min="0"
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
                        recurrence: value as "daily" | "weekly" | "one-time",
                      })
                    }
                  >
                    <SelectTrigger id="edit-recurrence">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
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
                        checked={editingChore?.assignedTo.includes(user.id) || false}
                        onCheckedChange={(checked) => {
                          if (!editingChore) return;
                          setEditingChore(prev => {
                            if (!prev) return prev;
                            if (checked) {
                              return {
                                ...prev,
                                assignedTo: [...prev.assignedTo, user.id]
                              };
                            } else {
                              return {
                                ...prev,
                                assignedTo: prev.assignedTo.filter(id => id !== user.id)
                              };
                            }
                          });
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateChore}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
