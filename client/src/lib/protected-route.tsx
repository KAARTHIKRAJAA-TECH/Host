import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Higher-order function that creates a route with auth protection
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  return (
    <Route
      path={path}
      component={(params) => {
        const { user, isLoading } = useAuth();

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        return <Component {...params} />;
      }}
    />
  );
}

// Higher-order function that creates a route with admin-only protection
export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { toast } = useToast();
  
  return (
    <Route
      path={path}
      component={(params) => {
        const { user, isLoading } = useAuth();

        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        if (user.role !== "admin") {
          toast({
            title: "Access Denied",
            description: "You do not have permission to access this page",
            variant: "destructive",
          });
          return <Redirect to="/" />;
        }

        return <Component {...params} />;
      }}
    />
  );
}