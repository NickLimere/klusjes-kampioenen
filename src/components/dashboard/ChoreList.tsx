
import { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { useChore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
import { Chore } from "@/contexts/ChoreContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ChoreList() {
  const { getUserChores, completeChore, completedChores } = useChore();
  const { currentUser, updateUser } = useUser();
  const [completedToday, setCompletedToday] = useState<string[]>([]);

  if (!currentUser) return null;

  const userChores = getUserChores(currentUser.id);
  const today = new Date().toLocaleDateString();

  // Filter chores based on recurrence and completion
  const availableChores = userChores.filter(chore => {
    // For one-time chores, only show if never completed
    if (chore.recurrence === 'one-time') {
      return !completedChores.some(cc => cc.choreId === chore.id);
    }
    
    // For daily chores, only show if not completed today
    if (chore.recurrence === 'daily') {
      return !completedChores.some(cc => 
        cc.choreId === chore.id && 
        new Date(cc.completedAt).toLocaleDateString() === today
      );
    }
    
    // For weekly chores, only show if not completed this week
    if (chore.recurrence === 'weekly') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      return !completedChores.some(cc => 
        cc.choreId === chore.id && 
        new Date(cc.completedAt) >= startOfWeek
      );
    }
    
    return true;
  });

  // Check which chores were completed today
  const userCompletedToday = completedChores.filter(
    (cc) => 
      cc.userId === currentUser.id && 
      new Date(cc.completedAt).toLocaleDateString() === today
  ).map(cc => cc.choreId);

  const handleCompleteChore = async (chore: Chore) => {
    // Add to local state for immediate feedback
    setCompletedToday([...completedToday, chore.id]);
    
    try {
      // Record the completion
      await completeChore(chore.id, currentUser.id);
      
      // Update user points
      if (currentUser) {
        await updateUser({
          ...currentUser,
          points: currentUser.points + chore.pointValue
        });
      }
    } catch (error) {
      console.error('Error completing chore:', error);
      // Remove from local state if there was an error
      setCompletedToday(prev => prev.filter(id => id !== chore.id));
    }
  };

  // Check if chore is completed today
  const isChoreCompleted = (choreId: string) => {
    return userCompletedToday.includes(choreId) || completedToday.includes(choreId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-card p-4 mb-6">
      <h2 className="text-xl font-bold mb-4">Today's Chores</h2>
      
      {availableChores.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No chores assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableChores.map((chore) => {
            const completed = isChoreCompleted(chore.id);
            
            return (
              <div 
                key={chore.id}
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
                      if (!completed) handleCompleteChore(chore);
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
                      {chore.title}
                    </h3>
                    {chore.description && (
                      <p className="text-sm text-gray-500">{chore.description}</p>
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
                    {chore.pointValue} points
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
