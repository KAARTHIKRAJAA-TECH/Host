import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DeleteRequest {
  id: number;
  postId: number;
  userId: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  post: {
    title: string;
  };
  user: {
    email: string;
  };
}

export default function AdminDeleteRequests() {
  const { toast } = useToast();
  
  const { data: deleteRequests, isLoading } = useQuery<DeleteRequest[]>({
    queryKey: ["/api/admin/delete-requests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/delete-requests");
      if (!res.ok) throw new Error("Failed to fetch delete requests");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "rejected" }) => {
      const res = await apiRequest("PATCH", `/api/admin/delete-requests/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delete-requests"] });
      toast({
        title: "Status updated",
        description: "The delete request status has been updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: number) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: number) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  return (
    <AdminLayout title="Delete Requests">
      <Card>
        <CardHeader>
          <CardTitle>Content Deletion Requests</CardTitle>
          <CardDescription>
            Review and process requests from users to delete their content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deleteRequests?.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.post?.title || `Post #${request.postId}`}</TableCell>
                    <TableCell>{request.user?.email || `User #${request.userId}`}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason || "No reason provided"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === "pending"
                            ? "outline"
                            : request.status === "approved"
                            ? "default" 
                            : "destructive"
                        }
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2 h-8 px-2"
                            onClick={() => handleApprove(request.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => handleReject(request.id)}
                            disabled={updateStatusMutation.isPending}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!deleteRequests || deleteRequests.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No delete requests found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}