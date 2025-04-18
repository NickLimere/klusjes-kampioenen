
import { useChore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ProfileStats() {
  const { completedChores, chores } = useChore();
  const { currentUser } = useUser();
  
  if (!currentUser) return null;
  
  // Get user's completed chores
  const userCompletedChores = completedChores.filter(
    cc => cc.userId === currentUser.id
  );
  
  // Get user's assigned chores
  const userChores = chores.filter(
    chore => chore.assignedTo.includes(currentUser.id)
  );
  
  // Calculate completion rate for this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const completedThisWeek = userCompletedChores.filter(
    cc => new Date(cc.completedAt) >= startOfWeek
  );
  
  // Count daily chores * days elapsed this week + weekly chores
  const daysElapsed = Math.min(now.getDay() + 1, 7);
  
  const dailyChores = userChores.filter(c => c.recurrence === "daily");
  const weeklyChores = userChores.filter(c => c.recurrence === "weekly");
  
  const totalExpectedThisWeek = (dailyChores.length * daysElapsed) + weeklyChores.length;
  
  const completionRate = totalExpectedThisWeek > 0
    ? Math.round((completedThisWeek.length / totalExpectedThisWeek) * 100)
    : 100;
  
  // Calculate points earned this week
  const pointsThisWeek = completedThisWeek.reduce(
    (sum, cc) => sum + cc.pointsEarned, 0
  );
  
  // Calculate streak (simplified - just counting consecutive days with at least one chore)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) { // Check up to 30 days
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    
    const hasCompletedChore = userCompletedChores.some(cc => {
      const choreDate = new Date(cc.completedAt);
      choreDate.setHours(0, 0, 0, 0);
      return choreDate.getTime() === checkDate.getTime();
    });
    
    if (hasCompletedChore) {
      streak++;
    } else if (i > 0) { // Don't break on the first day (today) if nothing completed yet
      break;
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>This Week's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">
                  Completion Rate
                </span>
                <span className="text-sm font-medium">
                  {completionRate}%
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-sm text-gray-500 mt-1">
                {completedThisWeek.length} of {totalExpectedThisWeek} chores completed
              </p>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Weekly Breakdown</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-joy-card-1 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Daily Chores</p>
                  <p className="text-xl font-bold">{dailyChores.length}</p>
                </div>
                <div className="bg-joy-card-5 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Weekly Chores</p>
                  <p className="text-xl font-bold">{weeklyChores.length}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-joy-card-2 rounded-lg p-3">
                <p className="text-sm text-gray-600">Points This Week</p>
                <p className="text-xl font-bold">{pointsThisWeek}</p>
              </div>
              <div className="bg-joy-card-3 rounded-lg p-3">
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-xl font-bold">{streak} day{streak !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Most Valuable Chores</h3>
              <div className="space-y-2">
                {[...userChores]
                  .sort((a, b) => b.pointValue - a.pointValue)
                  .slice(0, 3)
                  .map(chore => (
                    <div 
                      key={chore.id}
                      className="flex justify-between items-center bg-gray-50 p-2 rounded-lg"
                    >
                      <span className="text-sm">{chore.title}</span>
                      <span className="text-xs font-medium text-joy-primary">
                        {chore.pointValue} points
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
