
import { useState } from "react";
import { useChore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
import { CompletedChore, Chore } from "@/contexts/ChoreContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckCircle } from "lucide-react";

export default function HistoryList() {
  const { completedChores, chores } = useChore();
  const { currentUser } = useUser();
  const [timeFilter, setTimeFilter] = useState<"all" | "week" | "month">("week");
  
  if (!currentUser) return null;

  // Get completed chores for this user
  let userCompletedChores = completedChores.filter(
    cc => cc.userId === currentUser.id
  );
  
  // Apply time filter
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  if (timeFilter === "week") {
    userCompletedChores = userCompletedChores.filter(
      cc => new Date(cc.completedAt) >= oneWeekAgo
    );
  } else if (timeFilter === "month") {
    userCompletedChores = userCompletedChores.filter(
      cc => new Date(cc.completedAt) >= oneMonthAgo
    );
  }
  
  // Sort by most recent first
  userCompletedChores.sort((a, b) => 
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
  
  // Group by date
  const choresByDate: Record<string, (CompletedChore & { choreDetails: Chore | undefined })[]> = {};
  
  userCompletedChores.forEach(cc => {
    const dateStr = new Date(cc.completedAt).toLocaleDateString();
    
    if (!choresByDate[dateStr]) {
      choresByDate[dateStr] = [];
    }
    
    const choreDetails = chores.find(c => c.id === cc.choreId);
    
    choresByDate[dateStr].push({
      ...cc,
      choreDetails
    });
  });
  
  // Calculate total points for each day
  const pointsByDate: Record<string, number> = {};
  
  Object.entries(choresByDate).forEach(([date, dailyChores]) => {
    pointsByDate[date] = dailyChores.reduce((sum, cc) => sum + cc.pointsEarned, 0);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-joy-primary" />
              <span>Chore History</span>
            </CardTitle>
            <CardDescription>
              {userCompletedChores.length} chores completed
            </CardDescription>
          </div>
          
          <Select
            value={timeFilter}
            onValueChange={(value) => 
              setTimeFilter(value as "all" | "week" | "month")
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(choresByDate).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No chores completed in this time period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(choresByDate).map(([date, dailyChores]) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-700">{date}</h3>
                  <span className="text-sm text-joy-primary font-semibold">
                    +{pointsByDate[date]} points
                  </span>
                </div>
                
                <div className="space-y-2">
                  {dailyChores.map((cc) => (
                    <div 
                      key={cc.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div className="flex-grow">
                        <h4 className="font-medium">
                          {cc.choreDetails?.title || "Unknown Chore"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(cc.completedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        +{cc.pointsEarned}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
