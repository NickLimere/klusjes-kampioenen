
import { Link } from "react-router-dom";
import { Calendar, Gift, User } from "lucide-react";

const links = [
  {
    icon: Calendar,
    title: "View History",
    description: "See your completed chores",
    path: "/history",
    color: "bg-joy-card-1",
  },
  {
    icon: Gift,
    title: "Rewards Shop",
    description: "Redeem your points",
    path: "/rewards",
    color: "bg-joy-card-2",
  },
  {
    icon: User,
    title: "Profile",
    description: "View your stats",
    path: "/profile",
    color: "bg-joy-card-4",
  },
];

export default function QuickLinks() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {links.map((link) => (
        <Link
          key={link.title}
          to={link.path}
          className={`${link.color} rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}
        >
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <link.icon className="h-6 w-6 text-joy-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{link.title}</h3>
            <p className="text-sm text-gray-600">{link.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
