
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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { users, setCurrentUser } = useUser();
  const navigate = useNavigate();
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, this would validate against a database
    // For this demo, we'll just check if the user exists and is an admin
    
    const adminUsers = users.filter(user => user.role === "admin");
    
    if (email.includes("admin") && password.length >= 4) {
      // Set the first admin user as current
      if (adminUsers.length > 0) {
        setCurrentUser(adminUsers[0]);
        toast.success("Welcome back!");
        navigate("/admin");
      }
    } else {
      toast.error("Invalid credentials", {
        description: "Please check your email and password.",
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
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="text-sm text-joy-primary hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.info("For demo purposes, any password with at least 4 characters will work with an email containing 'admin'");
                      }}
                    >
                      Forgot password?
                    </a>
                  </div>
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
              For demo: use any email with "admin" and a password of at least 4 characters
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
