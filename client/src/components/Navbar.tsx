import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Shield, Home, PlusCircle, Bell, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreatePostModal from "./CreatePostModal";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const [location, navigate] = useLocation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/users/me"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.clear();
      navigate("/login");
      toast({
        title: "Logged out successfully",
        variant: "info",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Content Shield
                  </span>
                </div>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex justify-center flex-1 px-6">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <Input
                  type="text"
                  className="pl-10 pr-3 py-2 rounded-lg bg-gray-100 border-transparent focus:border-primary focus:ring-0 focus:bg-white"
                  placeholder="Search content..."
                />
              </div>
            </div>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Home"
                className="text-dark hover:text-primary"
                asChild
              >
                <Link href="/">
                  <Home className="h-5 w-5" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Create Post"
                className="text-dark hover:text-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <PlusCircle className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="Notifications"
                className="text-dark hover:text-primary relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform translate-x-1 -translate-y-1">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatarUrl} alt={user?.email} />
                      <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/licenses">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>License Requests</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Admin Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </>
  );
};

export default Navbar;
