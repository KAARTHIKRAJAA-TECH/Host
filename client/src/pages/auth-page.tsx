import { useState } from "react";
import { Shield } from "lucide-react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Login from "./Login";
import Register from "./Register";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user } = useAuth();

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left column - Forms */}
      <div className="w-full md:w-1/2 p-6 flex items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white">
                <Shield className="h-6 w-6" />
              </div>
              <span className="ml-3 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Content Shield
              </span>
            </div>
          </div>

          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Login />
            </TabsContent>
            <TabsContent value="register">
              <Register />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column - Hero section */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 to-accent/90 p-12 flex-col justify-center">
        <div className="max-w-lg mx-auto text-white">
          <h1 className="text-4xl font-bold mb-6">Protect Your Digital Creation</h1>
          <p className="text-lg mb-8">
            Content Shield provides a secure platform for creators to share, protect, and monetize 
            their content with blockchain-based verification and flexible licensing options.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium">Content verification with cryptographic proof</p>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium">Simplified license management for creators</p>
            </div>
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mr-4">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium">Safe sharing with copyright protection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}