import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface LicenseRequest {
  id: string;
  postId: string;
  postTitle: string;
  requesterId: string;
  requesterEmail: string;
  requesterAvatarUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface LicenseRequestsProps {
  limit?: number;
  showViewAll?: boolean;
}

const LicenseRequests = ({ limit = 5, showViewAll = true }: LicenseRequestsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery<LicenseRequest[]>({
    queryKey: ["/api/license-requests"],
    select: (data) => data.slice(0, limit),
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "approved" | "rejected" }) => {
      const response = await apiRequest("PATCH", `/api/license-requests/${requestId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/license-requests"] });
      toast({
        title: "Request updated",
        description: "The license request has been updated.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent License Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse flex items-start p-3 bg-gray-50 rounded-lg">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-3 w-36 bg-gray-200 rounded mt-1"></div>
                    </div>
                    <div className="h-3 w-10 bg-gray-200 rounded"></div>
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent License Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests && requests.length > 0 ? (
            requests.map((request) => (
              <div key={request.id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={request.requesterAvatarUrl} alt={request.requesterEmail} />
                  <AvatarFallback>{request.requesterEmail.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">{request.requesterEmail}</p>
                      <p className="text-xs text-gray-500">
                        Requested permission for "{request.postTitle}"
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {request.status === "pending" && (
                    <div className="mt-2 flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-secondary text-white text-xs"
                        onClick={() => 
                          updateRequestMutation.mutate({ requestId: request.id, status: "approved" })
                        }
                        disabled={updateRequestMutation.isPending}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-gray-200 text-gray-700 text-xs"
                        onClick={() => 
                          updateRequestMutation.mutate({ requestId: request.id, status: "rejected" })
                        }
                        disabled={updateRequestMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  {request.status === "approved" && (
                    <p className="mt-2 text-xs text-secondary font-medium">
                      You approved this request
                    </p>
                  )}
                  {request.status === "rejected" && (
                    <p className="mt-2 text-xs text-destructive font-medium">
                      You declined this request
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No license requests yet</p>
            </div>
          )}

          {showViewAll && (
            <Button
              variant="link"
              className="w-full text-primary text-sm font-medium mt-3"
              asChild
            >
              <Link href="/licenses">View All Requests</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LicenseRequests;
