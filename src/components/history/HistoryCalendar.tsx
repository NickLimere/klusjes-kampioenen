
import { useState } from "react";
import { useChore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
import { Calendar } from "@/components/ui/calendar";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HistoryCalendar() {
  const { completedChores, chores } = useChore();
  const { currentUser } = useUser();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  if (!currentUser) return null;

  // Get all completed chores for this user
  const userCompletedChores = completedChores.filter(
    cc => cc.userId === currentUser.id
  );
  
  // Create a map of dates to completed chore counts
  const completedDatesMap = userCompletedChores.reduce((acc, cc) => {
    const dateStr = new Date(cc.completedAt).toDateString();
    if (!acc[dateStr]) {
      acc[dateStr] = {
        count: 0,
        points: 0,
        chores: [],
      };
    }
    acc[dateStr].count += 1;
    acc[dateStr].points += cc.pointsEarned;
    
    // Find the chore details
    const choreDetails = chores.find(c => c.id === cc.choreId);
    if (choreDetails) {
      acc[dateStr].chores.push({
        ...cc,
        title: choreDetails.title,
      });
    }
    
    return acc;
  }, {} as Record<string, { count: number; points: number; chores: any[] }>);
  
  // Function to highlight dates with completed chores
  const isDayWithCompletedChores = (date: Date) => {
    const dateStr = date.toDateString();
    return completedDatesMap[dateStr] !== undefined;
  };
  
  // Get selected day's completed chores
  const selectedDateStr = selectedDate?.toDateString() || '';
  const selectedDayChores = completedDatesMap[selectedDateStr]?.chores || [];
  const selectedDayPoints = completedDatesMap[selectedDateStr]?.points || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>Select a date to see completed chores</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              completed: (date) => isDayWithCompletedChores(date),
            }}
            modifiersStyles={{
              completed: {
                backgroundColor: "rgba(155, 135, 245, 0.1)",
                fontWeight: "bold",
                borderRadius: "0.25rem",
              },
            }}
            components={{
              DayContent: (props) => {
                const dateStr = props.date.toDateString();
                const hasCompleted = completedDatesMap[dateStr];
                
                return (
                  <div className="relative h-full w-full p-1">
                    <span>{props.date.getDate()}</span>
                    {hasCompleted && (
                      <span className="absolute bottom-0 right-0 flex h-2 w-2 rounded-full bg-joy-secondary" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? (
              <span>
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ) : (
              <span>Select a date</span>
            )}
          </CardTitle>
          <CardDescription>
            {selectedDayChores.length > 0
              ? `${selectedDayChores.length} chores completed (${selectedDayPoints} points)`
              : "No chores completed on this day"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDayChores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No activity on this day</p>
              <p className="text-sm mt-2">Select a day with the dot indicator to view chores</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayChores.map((chore) => (
                <div 
                  key={chore.id}
                  className="bg-gray-50 border border-gray-100 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{chore.title}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(chore.completedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-joy-secondary/10 text-joy-secondary border-joy-secondary/20">
                    +{chore.pointsEarned} points
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
