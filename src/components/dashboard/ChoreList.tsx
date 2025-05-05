import React, { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useChore, ChoreAssignmentWithInstance, ChoreInstance } from "@/contexts/ChoreContext";

import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChoreList() {
  const { getUserAssignments, completeAssignment } = useChore();
  const { currentUser, updateUser } = useUser();
  const [assignments, setAssignments] = useState<ChoreAssignmentWithInstance[]>([]);
  const [completing, setCompleting] = useState<string[]>([]);

  if (!currentUser) return null;

  // Load user assignments on mount
  React.useEffect(() => {
    (async () => {
      const data = await getUserAssignments(currentUser.id);
      console.log('[ChoreList useEffect] Loaded assignments:', data);
      setAssignments(data);
    })();
  }, [currentUser.id, getUserAssignments]);

  const today = new Date();
  const todayStr = today.toLocaleDateString();

  // Filter assignments for active (incomplete) chores
  const availableAssignments = assignments.filter(a => {
    if (!a.choreInstance) return false;
    if (a.completed) return false;
    // For one-time chores, only show if not completed
    if (a.choreInstance.recurrence === 'one-time') return !a.completed;
    // For daily chores, only show if not completed today
    if (a.choreInstance.recurrence === 'daily') {
      return !a.completedAt || new Date(a.completedAt).toLocaleDateString() !== todayStr;
    }
    // For weekly chores, only show if not completed this week
    if (a.choreInstance.recurrence === 'weekly') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return !a.completedAt || new Date(a.completedAt) < startOfWeek;
    }
    return true;
  });

  const handleCompleteAssignment = async (assignment: ChoreAssignmentWithInstance) => {
    setCompleting(prev => [...prev, assignment.id]);
    try {
      await completeAssignment(assignment.id, assignment.choreInstance?.pointValue);
      // Optionally update user points
      if (currentUser && assignment.choreInstance) {
        await updateUser({
          ...currentUser,
          points: currentUser.points + assignment.choreInstance.pointValue
        });
      }
      // Refresh assignments
      const data = await getUserAssignments(currentUser.id);
      console.log('[ChoreList useEffect] Loaded assignments:', data);
      setAssignments(data);
    } catch (error) {
      console.error('Error completing assignment:', error);
    } finally {
      setCompleting(prev => prev.filter(id => id !== assignment.id));
    }
  };

  const isAssignmentCompleted = (assignment: ChoreAssignmentWithInstance) => {
    return assignment.completed || completing.includes(assignment.id);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Today's Chores</h2>
      
      {availableAssignments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No chores assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableAssignments.map((assignment) => {
            const choreInstance: ChoreInstance | null = assignment.choreInstance;
            if (!choreInstance) return null;
            const completed = isAssignmentCompleted(assignment);
            return (
              <div 
                key={assignment.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  completed 
                    ? "bg-green-50 border border-green-100" 
                    : "bg-gray-50 border border-gray-100 hover:bg-gray-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-full h-8 w-8",
                      completed && "text-green-500"
                    )}
                    onClick={() => {
                      if (!completed) handleCompleteAssignment(assignment);
                    }}
                    disabled={completed}
                    aria-label={completed ? "Chore completed" : "Mark chore as complete"}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-6 w-6 animate-bounce-slight" />
                    ) : (
                      <Circle className="h-6 w-6" />
                    )}
                  </Button>
                  
                  <div>
                    <h3 className={cn(
                      "font-medium",
                      completed && "line-through text-gray-500"
                    )}>
                      {choreInstance.title}
                    </h3>
                    {choreInstance.description && (
                      <p className="text-sm text-gray-500">{choreInstance.description}</p>
                    )}
                    
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                    completed 
                      ? "bg-green-100 text-green-800" 
                      : "bg-joy-primary/10 text-joy-primary"
                  )}>
                    {choreInstance.pointValue} points
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
