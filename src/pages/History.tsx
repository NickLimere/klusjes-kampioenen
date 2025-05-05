
import MainLayout from "@/components/layout/MainLayout";
import HistoryCalendar from "@/components/history/HistoryCalendar";
import HistoryList from "@/components/history/HistoryList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function History() {
  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Chore History</h1>
        <p className="text-gray-600">
          Track your completed chores and earned points
        </p>
      </div>
      
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <HistoryList />
        </TabsContent>
        
        <TabsContent value="calendar" className="mt-6">
          <HistoryCalendar />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
