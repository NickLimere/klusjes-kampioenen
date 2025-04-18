
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Gift, User, Settings } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const location = useLocation();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === "admin";

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "History", path: "/history", icon: Calendar },
    { name: "Rewards", path: "/rewards", icon: Gift },
    { name: "Profile", path: "/profile", icon: User },
  ];

  if (isAdmin) {
    navItems.push({ name: "Admin", path: "/admin", icon: Settings });
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-14 z-30">
      <div className="container mx-auto px-4">
        <div className="flex justify-between overflow-x-auto py-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center py-2 px-4 text-sm rounded-lg transition-colors",
                location.pathname === item.path
                  ? "text-joy-primary font-medium"
                  : "text-gray-600 hover:text-joy-primary"
              )}
              aria-current={location.pathname === item.path ? "page" : undefined}
            >
              <item.icon size={20} className="mb-1" />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
