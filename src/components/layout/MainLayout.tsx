
import { ReactNode } from "react";
import Navbar from "./Navbar";
import UserSwitcher from "../user/UserSwitcher";
import { useUser } from "@/contexts/UserContext";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { currentUser } = useUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-joy-primary">
            Chore Champion
          </h1>
          <UserSwitcher />
        </div>
      </div>
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>
    </div>
  );
}
