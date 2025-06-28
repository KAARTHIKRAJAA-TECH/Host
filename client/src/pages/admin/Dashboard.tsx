import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, FileText, Trash, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: userData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users/count"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users/count");
      if (!res.ok) throw new Error("Failed to fetch user count");
      return res.json();
    }
  });

  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["/api/admin/posts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    }
  });

  const { data: deleteRequests, isLoading: isLoadingDeleteRequests } = useQuery({
    queryKey: ["/api/admin/delete-requests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/delete-requests");
      if (!res.ok) throw new Error("Failed to fetch delete requests");
      return res.json();
    }
  });

  const totalUsers = userData?.count || 0;
  const totalPosts = posts?.length || 0;
  const totalDeleteRequests = deleteRequests?.length || 0;
  const pendingDeleteRequests = deleteRequests?.filter(
    (req: any) => req.status === "pending"
  ).length || 0;

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Registered platform users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingPosts ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalPosts}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Protected content items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delete Requests</CardTitle>
            <Trash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDeleteRequests ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{totalDeleteRequests}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total deletion requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingDeleteRequests ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{pendingDeleteRequests}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Awaiting administrator review
            </p>
          </CardContent>
        </Card>
      </div>

      {!isLoadingDeleteRequests && deleteRequests && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Deletion Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Pending</div>
                  <div className="text-sm font-medium">
                    {pendingDeleteRequests} of {totalDeleteRequests} ({Math.round((pendingDeleteRequests / totalDeleteRequests) * 100) || 0}%)
                  </div>
                </div>
                <Progress value={(pendingDeleteRequests / totalDeleteRequests) * 100 || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Approved</div>
                  <div className="text-sm font-medium">
                    {deleteRequests.filter((req: any) => req.status === "approved").length} of {totalDeleteRequests} ({Math.round((deleteRequests.filter((req: any) => req.status === "approved").length / totalDeleteRequests) * 100) || 0}%)
                  </div>
                </div>
                <Progress value={(deleteRequests.filter((req: any) => req.status === "approved").length / totalDeleteRequests) * 100 || 0} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Rejected</div>
                  <div className="text-sm font-medium">
                    {deleteRequests.filter((req: any) => req.status === "rejected").length} of {totalDeleteRequests} ({Math.round((deleteRequests.filter((req: any) => req.status === "rejected").length / totalDeleteRequests) * 100) || 0}%)
                  </div>
                </div>
                <Progress value={(deleteRequests.filter((req: any) => req.status === "rejected").length / totalDeleteRequests) * 100 || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}