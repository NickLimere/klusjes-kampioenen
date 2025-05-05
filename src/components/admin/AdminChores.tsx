import { useState, useEffect } from "react";
import { useChore, Chore, ChoreAssignmentWithInstance } from "@/contexts/ChoreContext";
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
  const { chores, addChore, updateChore, deleteChore, getAssignmentsGroupedByChore, completeAssignment } = useChore();
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
  
  // Group assignments by chore for admin view
  const [assignmentsByChore, setAssignmentsByChore] = useState<Record<string, ChoreAssignmentWithInstance[]>>({});
  useEffect(() => {
    (async () => {
      const grouped = await getAssignmentsGroupedByChore();
      setAssignmentsByChore(grouped);
    })();
  }, [chores]);

  // --- NEW: Group assignments by choreInstanceId for correct table rendering ---
  const allAssignments = Object.values(assignmentsByChore).flat();
  const assignmentsByInstance = allAssignments.reduce((acc, assignment) => {
    const instanceId = assignment.choreInstanceId;
    if (!acc[instanceId]) acc[instanceId] = [];
    acc[instanceId].push(assignment);
    return acc;
  }, {} as Record<string, ChoreAssignmentWithInstance[]>);

  
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
      const result = await addChore(choreToAdd, validAssignedTo);
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
  handleOpenEditDialog({
    ...choreInstance,
    assignedTo: assignments.map(a => a.userId),
    createdAt: choreInstance.createdAt instanceof Timestamp ? choreInstance.createdAt.toDate() : choreInstance.createdAt,
    updatedAt: choreInstance.updatedAt instanceof Timestamp ? choreInstance.updatedAt.toDate() : choreInstance.updatedAt,
  });
}}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteChore(choreInstance.id)}
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
            value={newChore.title || ""}
            onChange={e => setNewChore({ ...newChore, title: e.target.value })}
            placeholder="Enter chore title"
          />

          <Label htmlFor="chore-desc">Description</Label>
          <Input
            id="chore-desc"
            value={newChore.description || ""}
            onChange={e => setNewChore({ ...newChore, description: e.target.value })}
            placeholder="Enter description (optional)"
          />

          <Label htmlFor="chore-points">Points</Label>
          <Input
            id="chore-points"
            type="number"
            value={newChore.pointValue || 5}
            min={1}
            onChange={e => setNewChore({ ...newChore, pointValue: Number(e.target.value) })}
          />

          <Label htmlFor="chore-recurrence">Recurrence</Label>
          <Select
            value={newChore.recurrence || "daily"}
            onValueChange={val => setNewChore({ ...newChore, recurrence: val as "daily" | "weekly" | "one-time" })}
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
                  checked={Array.isArray(newChore.assignedTo) && newChore.assignedTo.includes(user.id)}
                  onCheckedChange={checked => {
                    if (checked) {
                      setNewChore({
                        ...newChore,
                        assignedTo: [...(newChore.assignedTo || []), user.id],
                      });
                    } else {
                      setNewChore({
                        ...newChore,
                        assignedTo: (newChore.assignedTo || []).filter(id => id !== user.id),
                      });
                    }
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
          <Button onClick={handleAddChore}>Add Chore</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}

