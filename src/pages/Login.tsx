import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { loginAdmin } from "@/lib/auth-service";

export default function Login() {
  const [password, setPassword] = useState("");
  const { setCurrentUser } = useUser();
  const navigate = useNavigate();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isAuthenticated = await loginAdmin(password);
    
    if (isAuthenticated) {
      // Set a temporary admin user
      setCurrentUser({
        id: "admin",
        name: "Admin",
        role: "admin",
        points: 0,
        avatar: "👨‍💼"
      });
      toast.success("Welcome back!");
      navigate("/admin");
    } else {
      toast.error("Invalid password", {
        description: "Please check your password and try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-joy-primary/5 to-joy-secondary/5">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-joy-primary to-joy-secondary flex items-center justify-center">
                <span className="text-2xl text-white">🏠</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="text-center">
            <p className="text-sm text-gray-500 w-full">
              Enter the admin password to access the dashboard
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
