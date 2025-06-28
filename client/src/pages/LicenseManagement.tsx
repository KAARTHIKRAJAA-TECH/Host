import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const LicenseManagement = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: receivedRequests, isLoading: isReceivedLoading } = useQuery({
    queryKey: ["/api/license-requests/received"],
  });

  const { data: sentRequests, isLoading: isSentLoading } = useQuery({
    queryKey: ["/api/license-requests/sent"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: "approved" | "rejected" }) => {
      const response = await apiRequest("PATCH", `/api/license-requests/${requestId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/license-requests/received"] });
      queryClient.invalidateQueries({ queryKey: ["/api/license-requests/sent"] });
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

  const filteredReceivedRequests = receivedRequests?.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  const filteredSentRequests = sentRequests?.filter((request) => {
    if (statusFilter === "all") return true;
    return request.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">License Management</h1>
          <p className="text-gray-500">Manage incoming and outgoing content license requests</p>
        </div>
        
        <Card>
          <CardHeader className="pb-0">
            <div className="flex justify-between items-center">
              <CardTitle>License Requests</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Filter className="h-4 w-4 mr-2" />
                    <span>
                      {statusFilter === "all" 
                        ? "All Statuses" 
                        : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("approved")}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("rejected")}>
                    Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="received" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="received">Received Requests</TabsTrigger>
                <TabsTrigger value="sent">Sent Requests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="received">
                {isReceivedLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="py-2">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredReceivedRequests && filteredReceivedRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceivedRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.requesterEmail}</TableCell>
                          <TableCell>{request.postTitle}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(request.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(request.status)}
                              <span>{getStatusBadge(request.status)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {request.status === "pending" && (
                              <div className="flex space-x-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-secondary hover:bg-secondary/90 h-8"
                                  onClick={() => 
                                    updateRequestMutation.mutate({ requestId: request.id, status: "approved" })
                                  }
                                  disabled={updateRequestMutation.isPending}
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => 
                                    updateRequestMutation.mutate({ requestId: request.id, status: "rejected" })
                                  }
                                  disabled={updateRequestMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                            {request.status !== "pending" && (
                              <span className="text-xs text-gray-500">
                                {request.status === "approved" ? "Approved" : "Rejected"} on {format(new Date(request.updatedAt || request.createdAt), "MMM d, yyyy")}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No incoming license requests found.</p>
                    {statusFilter !== "all" && (
                      <Button 
                        variant="link" 
                        onClick={() => setStatusFilter("all")}
                      >
                        View all requests
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sent">
                {isSentLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="py-2">
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ))}
                  </div>
                ) : filteredSentRequests && filteredSentRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content Owner</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSentRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.ownerEmail}</TableCell>
                          <TableCell>{request.postTitle}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                              </span>
                              <span className="text-xs text-gray-400">
                                {format(new Date(request.createdAt), "MMM d, yyyy")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(request.status)}
                              <span>{getStatusBadge(request.status)}</span>
                            </div>
                            {request.status === "approved" && (
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="p-0 h-auto text-xs mt-1"
                              >
                                View/Download Content
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500">You haven't sent any license requests yet.</p>
                    {statusFilter !== "all" && (
                      <Button 
                        variant="link" 
                        onClick={() => setStatusFilter("all")}
                      >
                        View all requests
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LicenseManagement;
