import { useState, useEffect } from "react";
import { useChore, ChoreAssignmentWithInstance } from "@/contexts/ChoreContext";
import { ChoreInstance } from "@/lib/db-types";
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
  const { choreInstances, addChoreInstance, updateChoreInstance, deleteChoreInstance, getAssignmentsGroupedByChore, completeAssignment } = useChore();
  const { users } = useUser();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  // State for the "Add Chore" dialog
  const [newChoreData, setNewChoreData] = useState<Omit<ChoreInstance, 'id' | 'createdAt' | 'updatedAt'>>({
    title: "",
    description: "",
    pointValue: 5,
    recurrence: "daily", // 'assignedTo' is managed by newChoreAssignedUserIds
  });
  const [newChoreAssignedUserIds, setNewChoreAssignedUserIds] = useState<string[]>([]);
  // State for the "Edit Chore" dialog
  const [editingChoreInstance, setEditingChoreInstance] = useState<ChoreInstance | null>(null);
  const [editingChoreAssignedUserIds, setEditingChoreAssignedUserIds] = useState<string[]>([]);
  
  // Filter out admin users and sort in specific order
  const userOrder = ['Mia', 'Emma', 'Mama', 'Papa'];
  const childUsers = users
    .filter(user => user.role !== "admin" && user.id)
    .sort((a, b) => {
      const aIndex = userOrder.indexOf(a.name);
      const bIndex = userOrder.indexOf(b.name);
      return aIndex - bIndex;
    });
  
  // Group assignments by chore for admin view
  const [assignmentsByChore, setAssignmentsByChore] = useState<Record<string, ChoreAssignmentWithInstance[]>>({});
  useEffect(() => {
    (async () => {
      const grouped = await getAssignmentsGroupedByChore();
      setAssignmentsByChore(grouped);
    })();
  }, [choreInstances, getAssignmentsGroupedByChore]);

  // --- NEW: Group assignments by choreInstanceId for correct table rendering ---
  const allAssignments = Object.values(assignmentsByChore).flat();
  const assignmentsByInstance = allAssignments.reduce((acc, assignment) => {
    const instanceId = assignment.choreInstanceId;
    if (!acc[instanceId]) acc[instanceId] = [];
    acc[instanceId].push(assignment);
    return acc;
  }, {} as Record<string, ChoreAssignmentWithInstance[]>);

  
  const resetChoreForm = () => {
    setNewChoreData({
      title: "",
      description: "",
      pointValue: 5,
      recurrence: "daily",
    });
    setNewChoreAssignedUserIds([]);
  };
  
  const handleOpenEditDialog = (choreInstance: ChoreInstance, currentAssignedUserIds: string[]) => {
    setEditingChoreInstance(choreInstance);
    setEditingChoreAssignedUserIds(currentAssignedUserIds);
    setIsEditDialogOpen(true);
  };
  
  const handleAddChoreInstance = async () => {
    if (!newChoreData.title) {
      toast.error("Please enter a title for the chore");
      return;
    }
    
    if (newChoreAssignedUserIds.length === 0) {
      toast.error("Please assign this chore to at least one person");
      return;
    }
    
    const choreInstanceToAdd: Omit<ChoreInstance, 'id' | 'createdAt' | 'updatedAt'> = {
      title: newChoreData.title,
      description: newChoreData.description || "",
      pointValue: newChoreData.pointValue || 0,
      recurrence: (newChoreData.recurrence || "daily") as "daily" | "weekly" | "one-time",
    };

    try {
      await addChoreInstance(choreInstanceToAdd, newChoreAssignedUserIds);
      toast.success("Chore added successfully");
      resetChoreForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding chore:', error);
      toast.error("Failed to add chore");
    }
  };
  
  const handleUpdateChoreInstance = async () => {
    if (!editingChoreInstance || !editingChoreInstance.id) {
      toast.error("Cannot update chore: Essential data missing.");
      return;
    }

    const trimmedTitle = editingChoreInstance.title ? editingChoreInstance.title.trim() : "";
    if (!trimmedTitle) {
      toast.error("Please enter a title for the chore");
      return;
    }

    const pointValue = (typeof editingChoreInstance.pointValue === 'number' && !isNaN(editingChoreInstance.pointValue))
      ? editingChoreInstance.pointValue
      : 0;

    if (editingChoreAssignedUserIds.length === 0) {
      toast.error("Please assign this chore to at least one person");
      return;
    }

    const recurrence = editingChoreInstance.recurrence || "daily";

    try {
      const choreInstanceUpdateData: Partial<Omit<ChoreInstance, 'id' | 'createdAt' | 'status' | 'dueDate'>> = {
        title: trimmedTitle,
        description: editingChoreInstance.description || "",
        pointValue: pointValue,
        recurrence: recurrence as "daily" | "weekly" | "one-time",
        // Status and dueDate could be updated here if they were part of the form
      };

      // User assignments are not updated here; this only updates the chore instance properties.
      // A separate function call would be needed to update assignments if that's desired.
      await updateChoreInstance(editingChoreInstance.id, choreInstanceUpdateData);
      toast.success("Chore updated successfully");
      setIsEditDialogOpen(false);
      setEditingChoreInstance(null); // Clear editing chore state on success
    } catch (error) {
      console.error('Error updating chore:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to update chore: ${errorMessage}`);
    }
  };
  
  const handleDeleteChoreInstance = async (choreId: string) => {
    try {
      await deleteChoreInstance(choreId);
      toast.success("Chore deleted successfully");
    } catch (error) {
      console.error('Error deleting chore:', error);
      toast.error("Failed to delete chore");
    }
  };
  
  return (
    <>
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
            {Object.entries(assignmentsByInstance).map(([instanceId, assignments]) => {
              const choreInstance = assignments[0]?.choreInstance;
              if (!choreInstance) return null;
              return (
                <TableRow key={instanceId}>
                  <TableCell className="font-medium">{choreInstance.title}</TableCell>
                  <TableCell>{choreInstance.pointValue}</TableCell>
                  <TableCell className="capitalize">{choreInstance.recurrence}</TableCell>
                  <TableCell>
                    <div>
  {Array.from(
    new Set(
      assignments
        .map((assignment) => {
          const user = users.find((u) => u.id === assignment.userId);
          return user ? user.name : null;
        })
        .filter(Boolean)
    )
  ).join(", ")}
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
                          onClick={() => {
                          const currentAssignedIds = assignments.map(a => a.userId);
                          // Ensure the instance passed to the dialog conforms to db-types.ChoreInstance (strict Timestamps)
                          const instanceForDialog: ChoreInstance = {
                            ...choreInstance,
                            createdAt: choreInstance.createdAt instanceof Date ? Timestamp.fromDate(choreInstance.createdAt) : choreInstance.createdAt,
                            updatedAt: choreInstance.updatedAt instanceof Date ? Timestamp.fromDate(choreInstance.updatedAt) : choreInstance.updatedAt,
                            dueDate: choreInstance.dueDate ? (choreInstance.dueDate instanceof Date ? Timestamp.fromDate(choreInstance.dueDate) : choreInstance.dueDate) : undefined,
                            completedAt: choreInstance.completedAt ? (choreInstance.completedAt instanceof Date ? Timestamp.fromDate(choreInstance.completedAt) : choreInstance.completedAt) : undefined,
                          };
                          handleOpenEditDialog(instanceForDialog, currentAssignedIds);
                        }}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteChoreInstance(choreInstance.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
            {Object.keys(assignmentsByChore).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400">
                  No chores found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    {/* Add Chore Dialog */}
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Chore</DialogTitle>
          <DialogDescription>Fill in the details to add a new chore.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Label htmlFor="chore-title">Title</Label>
          <Input
            id="chore-title"
            value={newChoreData.title || ""}
            onChange={e => setNewChoreData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter chore title"
          />

          <Label htmlFor="chore-desc">Description</Label>
          <Input
            id="chore-desc"
            value={newChoreData.description || ""}
            onChange={e => setNewChoreData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter description (optional)"
          />

          <Label htmlFor="chore-points">Points</Label>
          <Input
            id="chore-points"
            type="number"
            value={newChoreData.pointValue ?? 0}
            min={0}
            onChange={e => setNewChoreData(prev => ({ ...prev, pointValue: Number(e.target.value) }))}
          />

          <Label htmlFor="chore-recurrence">Recurrence</Label>
          <Select
            value={newChoreData.recurrence || "daily"}
            onValueChange={val => setNewChoreData(prev => ({ ...prev, recurrence: val as "daily" | "weekly" | "one-time" }))}
          >
            <SelectTrigger id="chore-recurrence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="one-time">One-Time</SelectItem>
            </SelectContent>
          </Select>

          <Label>Assign To</Label>
          <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
            {childUsers.map(user => (
              <div key={user.id} className="flex items-center gap-2">
                <Checkbox
                  id={`assign-${user.id}`}
                  checked={newChoreAssignedUserIds.includes(user.id!)}
                  onCheckedChange={checked => {
                    setNewChoreAssignedUserIds(prevIds => {
                      if (checked) {
                        return [...prevIds, user.id!];
                      } else {
                        return prevIds.filter(id => id !== user.id!);
                      }
                    });
                  }}
                />
                <Label htmlFor={`assign-${user.id}`}>{user.name}</Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetChoreForm(); }}>
            Cancel
          </Button>
          <Button onClick={handleAddChoreInstance}>Add Chore</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Chore Dialog */}
    {editingChoreInstance && (
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chore</DialogTitle>
            <DialogDescription>Update the details of this chore.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Label htmlFor="edit-chore-title">Title</Label>
            <Input
              id="edit-chore-title"
              value={editingChoreInstance?.title || ""}
              onChange={e => setEditingChoreInstance(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder="Enter chore title"
            />

            <Label htmlFor="edit-chore-desc">Description</Label>
            <Input
              id="edit-chore-desc"
              value={editingChoreInstance?.description || ""}
              onChange={e => setEditingChoreInstance(prev => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="Enter description (optional)"
            />

            <Label htmlFor="edit-chore-points">Points</Label>
            <Input
              id="edit-chore-points"
              type="number"
              value={editingChoreInstance?.pointValue ?? 0} // Use ?? to allow 0
              min={0} // Allow 0 points
              onChange={e => setEditingChoreInstance(prev => prev ? { ...prev, pointValue: Number(e.target.value) } : null)}
            />

            <Label htmlFor="edit-chore-recurrence">Recurrence</Label>
            <Select
              value={editingChoreInstance?.recurrence || "daily"}
              onValueChange={val => setEditingChoreInstance(prev => prev ? { ...prev, recurrence: val as "daily" | "weekly" | "one-time" } : null)}
            >
              <SelectTrigger id="edit-chore-recurrence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="one-time">One-Time</SelectItem>
              </SelectContent>
            </Select>

            <Label>Assign To</Label>
            <div className="flex flex-col gap-2 max-h-32 overflow-y-auto">
              {childUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`edit-assign-${user.id}`}
                    checked={editingChoreAssignedUserIds.includes(user.id!)}
                    onCheckedChange={checked => {
                      setEditingChoreAssignedUserIds(prevIds => {
                        if (checked) {
                          return [...prevIds, user.id!];
                        } else {
                          return prevIds.filter(id => id !== user.id!);
                        }
                      });
                    }}
                  />
                  <Label htmlFor={`edit-assign-${user.id}`}>{user.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateChoreInstance}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}

