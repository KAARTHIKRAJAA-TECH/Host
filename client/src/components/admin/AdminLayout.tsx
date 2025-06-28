import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Users, FileText, Trash, Home, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();

  // Check if user is admin, if not redirect to home
  if (!user || user.role !== "admin") {
    toast({
      title: "Access Denied",
      description: "You do not have permission to access this page",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

  const isActive = (path: string) => {
    return location === path;
  };

  const navItems = [
    { name: "Dashboard", path: "/admin", icon: <LayoutDashboard className="mr-2 h-4 w-4" /> },
    { name: "Users", path: "/admin/users", icon: <Users className="mr-2 h-4 w-4" /> },
    { name: "Posts", path: "/admin/posts", icon: <FileText className="mr-2 h-4 w-4" /> },
    { name: "Delete Requests", path: "/admin/delete-requests", icon: <Trash className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/">
            <a className="mr-6 flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <span className="font-bold">Content Shield Admin</span>
            </a>
          </Link>
          <nav className="flex flex-1 items-center justify-between">
            <div className="flex">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  asChild
                  className="mr-1"
                >
                  <Link href={item.path}>
                    <a className="flex items-center">
                      {item.icon}
                      {item.name}
                    </a>
                  </Link>
                </Button>
              ))}
            </div>
            <div className="flex items-center">
              <Button variant="outline" asChild className="mr-2">
                <Link href="/">
                  <a className="flex items-center">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Site
                  </a>
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>
      <div className="container flex-1 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-6">{title}</h1>
        {children}
      </div>
      <footer className="border-t py-4">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Content Shield. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}