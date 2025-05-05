import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useChore, ChoreAssignmentWithInstance, ChoreInstance } from "@/contexts/ChoreContext";

import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChoreList() {
  const { getUserAssignments, completeAssignment, getUserCompletedChores } = useChore();
  const { currentUser, updateUser } = useUser();
  const [assignments, setAssignments] = useState<ChoreAssignmentWithInstance[]>([]);
  const [completing, setCompleting] = useState<string[]>([]);
  const [completedChores, setCompletedChores] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const data = await getUserAssignments(currentUser.id);
      setAssignments(data);
      const completions = await getUserCompletedChores(currentUser.id);
      setCompletedChores(completions);
    })();
  }, [currentUser, getUserAssignments, getUserCompletedChores]);

  if (!currentUser) return null;

  const today = new Date();
  const todayStr = today.toLocaleDateString();

  // Helper to check if a chore assignment is completed for the relevant period
  const isAssignmentCompleted = (assignment: ChoreAssignmentWithInstance) => {
    if (!assignment.choreInstance) return false;
    const instance = assignment.choreInstance;
    // Find a completedChore for this user/choreInstance and relevant period
    const completions = completedChores.filter(cc => cc.choreInstanceId === assignment.choreInstanceId && cc.userId === assignment.userId);
    if (instance.recurrence === 'one-time') {
      return completions.length > 0 || completing.includes(assignment.id);
    }
    if (instance.recurrence === 'daily') {
      return completions.some(cc => new Date(cc.completedAt).toLocaleDateString() === todayStr) || completing.includes(assignment.id);
    }
    if (instance.recurrence === 'weekly') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return completions.some(cc => new Date(cc.completedAt) >= startOfWeek) || completing.includes(assignment.id);
    }
    return false;
  };

  // Filter assignments for active (incomplete) chores
  const availableAssignments = assignments.filter(a => {
    if (!a.choreInstance) return false;
    return !isAssignmentCompleted(a);
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
