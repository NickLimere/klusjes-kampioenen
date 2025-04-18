
import { useUser } from "@/contexts/UserContext";

export default function GreetingBanner() {
  const { currentUser } = useUser();
  
  if (!currentUser) return null;
  
  // Determine greeting based on time of day
  const hour = new Date().getHours();
  let greeting = "Hello";
  
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }

  return (
    <div className="bg-gradient-to-r from-joy-primary to-joy-secondary rounded-3xl p-6 text-white shadow-lg mb-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        {greeting}, {currentUser.name}! 
        <span className="ml-2 text-3xl">
          {hour < 12 ? "🌞" : hour < 18 ? "☀️" : "🌙"}
        </span>
      </h1>
      <p className="text-white/90">
        {currentUser.role === "admin" 
          ? "Welcome to your family dashboard" 
          : `You currently have ${currentUser.points} points`}
      </p>
    </div>
  );
}
