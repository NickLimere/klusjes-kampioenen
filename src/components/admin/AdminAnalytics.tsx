
import { useState } from "react";
import { useChore } from "@/contexts/ChoreContext";
import { useUser } from "@/contexts/UserContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

// Define colors for charts
const COLORS = ["#FF9B42", "#9B87F5", "#4ECDC4", "#FFE66D", "#7AE582"];

export default function AdminAnalytics() {
  const { completedChores, choreInstances, allAssignments } = useChore();
  const { users } = useUser();
  const [timeframe, setTimeframe] = useState<"week" | "month" | "year">("week");

  if (!choreInstances || !users || !completedChores || !allAssignments) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-500">Loading analytics data...</p>
      </div>
    );
  }

  const childUsers = users.filter(user => user.role !== "admin");
  
  // Calculate date ranges based on selected timeframe
  const now = new Date();
  const getDateRange = () => {
    switch (timeframe) {
      case "week":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
          end: now,
        };
      case "month":
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
          end: now,
        };
      case "year":
        return {
          start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
          end: now,
        };
    }
  };
  
  const dateRange = getDateRange();
  
  // Filter completed chores based on date range
  const filteredCompletedChores = completedChores.filter(cc => {
    const choreDate = new Date(cc.completedAt);
    return choreDate >= dateRange.start && choreDate <= dateRange.end;
  });
  
  // Prepare data for weekly points bar chart
  const pointsByUser = childUsers.map(user => {
    const userChores = filteredCompletedChores.filter(cc => cc.userId === user.id);
    const totalPoints = userChores.reduce((sum, cc) => sum + cc.pointsEarned, 0);
    
    return {
      name: user.name,
      points: totalPoints,
      avatar: user.avatar,
    };
  });
  
  // Prepare data for chore completion pie chart based on recurrence of completed chores' instances
  const choreCategoriesData: { [key: string]: { name: string; value: number } } = {};

  filteredCompletedChores.forEach(completedChore => {
    const instance = choreInstances.find(ci => ci.id === completedChore.choreInstanceId);
    if (instance) {
      let categoryName = "One-Time Chores"; // Default for 'one-time'
      if (instance.recurrence === "daily") {
        categoryName = "Daily Chores";
      } else if (instance.recurrence === "weekly") {
        categoryName = "Weekly Chores";
      }
      
      if (!choreCategoriesData[categoryName]) {
        choreCategoriesData[categoryName] = { name: categoryName, value: 0 };
      }
      choreCategoriesData[categoryName].value += 1; // Each completedChore is one completion in its category
    }
  });
  const choreCategories = Object.values(choreCategoriesData);
  
  const pieChartData = Object.values(choreCategories);
  
  // Prepare data for CSV export
  const generateCSV = () => {
    const headers = ["User", "Chore", "Completed At", "Points"];
    
    const rows = filteredCompletedChores.map(cc => {
      const user = users.find(u => u.id === cc.userId);
      const chore = chores.find(c => c.id === cc.choreInstanceId);
      
      return [
        user?.name || "Unknown",
        chore?.title || "Unknown",
        new Date(cc.completedAt).toISOString(),
        cc.pointsEarned.toString()
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    return csvContent;
  };
  
  const handleExportCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `chore-data-${timeframe}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Progress & Analytics</h2>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <Tabs defaultValue="week" onValueChange={(value) => setTimeframe(value as any)}>
        <TabsList className="grid w-full md:w-80 grid-cols-3">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Points by Family Member</CardTitle>
              <CardDescription>
                Total points earned by each person
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pointsByUser}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [`${value} points`, name]}
                      labelFormatter={(value) => {
                        const entry = pointsByUser[value as number];
                        return entry ? `${entry.avatar || ""} ${entry.name || ""}` : "";
                      }}
                    />
                    <Bar dataKey="points" fill="#9B87F5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Chore Completion Breakdown</CardTitle>
              <CardDescription>
                Distribution of completed chores by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex justify-center items-center">
                {pieChartData.length === 0 ? (
                  <p className="text-gray-500">No data available for this period</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} chores completed`, ""]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Completion Rate Overview</CardTitle>
            <CardDescription>
              How well each family member is keeping up with their chores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={childUsers.map(user => {
                    // Get user's assigned chores from allAssignments
                    const userAssignments = allAssignments.filter(assignment => 
                      assignment.userId === user.id
                    );
                    
                    // Count number of daily and weekly chores from the user's assignments
                    const dailyChores = userAssignments.filter(a => a.choreInstance?.recurrence === "daily").length;
                    const weeklyChores = userAssignments.filter(a => a.choreInstance?.recurrence === "weekly").length;
                    
                    // Calculate expected completions based on timeframe
                    let expectedCompletions = 0;
                    
                    if (timeframe === "week") {
                      expectedCompletions = (dailyChores * 7) + weeklyChores;
                    } else if (timeframe === "month") {
                      expectedCompletions = (dailyChores * 30) + (weeklyChores * 4);
                    } else {
                      expectedCompletions = (dailyChores * 365) + (weeklyChores * 52);
                    }
                    
                    // Count actual completions
                    const actualCompletions = filteredCompletedChores.filter(
                      cc => cc.userId === user.id
                    ).length;
                    
                    // Calculate completion rate (capped at 100%)
                    const completionRate = expectedCompletions > 0
                      ? Math.min(Math.round((actualCompletions / expectedCompletions) * 100), 100)
                      : 0;
                    
                    return {
                      name: user.name,
                      avatar: user.avatar,
                      completionRate,
                      expected: expectedCompletions,
                      actual: actualCompletions,
                    };
                  })}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 40,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, "Completion Rate"]}
                    labelFormatter={(label) => {
                      // Fixed the error: properly handle when no data is available
                      if (typeof label !== 'number' || !Array.isArray(childUsers) || childUsers.length === 0) {
                        return "";
                      }
                      
                      const userData = childUsers[label];
                      if (!userData) return "";
                      
                      const userCompletionData = childUsers.map(user => {
                        // Get user's assigned chores
                        const assignedChores = chores.filter(chore => 
                          chore.assignedTo.includes(user.id)
                        );
                        
                        // Count number of daily and weekly chores
                        const dailyChores = assignedChores.filter(c => c.recurrence === "daily").length;
                        const weeklyChores = assignedChores.filter(c => c.recurrence === "weekly").length;
                        
                        // Calculate expected completions based on timeframe
                        let expectedCompletions = 0;
                        
                        if (timeframe === "week") {
                          expectedCompletions = (dailyChores * 7) + weeklyChores;
                        } else if (timeframe === "month") {
                          expectedCompletions = (dailyChores * 30) + (weeklyChores * 4);
                        } else {
                          expectedCompletions = (dailyChores * 365) + (weeklyChores * 52);
                        }
                        
                        // Count actual completions
                        const actualCompletions = filteredCompletedChores.filter(
                          cc => cc.userId === user.id
                        ).length;
                        
                        return {
                          name: user.name,
                          avatar: user.avatar,
                          expected: expectedCompletions,
                          actual: actualCompletions,
                        };
                      })[label];
                      
                      if (!userCompletionData) return "";
                      
                      return `${userCompletionData.avatar || ""} ${userCompletionData.name || ""} (${userCompletionData.actual}/${userCompletionData.expected} chores)`;
                    }}
                  />
                  <Bar 
                    dataKey="completionRate" 
                    fill="#4ECDC4"
                    barSize={30}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
