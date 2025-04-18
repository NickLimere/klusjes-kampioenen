
import { useState } from "react";
import { useUser, User } from "@/contexts/UserContext";
import { ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserSwitcher() {
  const { users, currentUser, setCurrentUser } = useUser();
  const [open, setOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-full border bg-white hover:bg-gray-50 transition-colors"
          aria-label="Switch users"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 bg-joy-primary/10 text-lg">
              <AvatarFallback>{currentUser.avatar}</AvatarFallback>
            </Avatar>
            <span className="font-medium hidden sm:inline">{currentUser.name}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Family Members</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {users.map((user) => (
          <DropdownMenuItem
            key={user.id}
            className="cursor-pointer"
            onClick={() => {
              setCurrentUser(user);
              setOpen(false);
            }}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 bg-joy-primary/10 text-lg">
                <AvatarFallback>{user.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span>{user.name}</span>
                <span className="text-xs text-gray-500">
                  {user.role === "admin" ? "Parent" : `${user.points} points`}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
