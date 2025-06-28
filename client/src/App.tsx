import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import LicenseManagement from "@/pages/LicenseManagement";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPosts from "./pages/admin/Posts";
import AdminDeleteRequests from "./pages/admin/DeleteRequests";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/profile" component={Profile} />
      <ProtectedRoute path="/profile/:id" component={Profile} />
      <ProtectedRoute path="/licenses" component={LicenseManagement} />
      
      {/* Admin Routes */}
      <AdminProtectedRoute path="/admin" component={AdminDashboard} />
      <AdminProtectedRoute path="/admin/users" component={AdminUsers} />
      <AdminProtectedRoute path="/admin/posts" component={AdminPosts} />
      <AdminProtectedRoute path="/admin/delete-requests" component={AdminDeleteRequests} />
      
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={() => <AuthPage />} />
      <Route path="/register" component={() => <AuthPage />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
