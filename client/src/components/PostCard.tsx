import { useState } from "react";
import { Shield, Heart, MessageSquare, MoreHorizontal, Download, Trash, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import CertificatePreview from "./CertificatePreview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Post {
  id: string;
  title: string;
  description: string;
  licenseType: "free" | "paid" | "permission" | "none";
  allowDownload: boolean;
  filePath: string;
  thumbnailPath: string;
  contentType: string;
  contentHash: string;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    avatarUrl?: string;
  };
  likeCount: number;
  commentCount: number;
  price?: number;
  userHasAccess?: boolean;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
}

const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwner = post.owner.id === currentUserId;

  const requestLicenseMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("POST", `/api/posts/${postId}/request-license`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "License requested",
        description: "The owner will review your request soon.",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Request failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}/download`, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("You don't have permission to download this content");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = post.title || "download";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast({
        title: "Download failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });
  
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiRequest("DELETE", `/api/posts/${postId}`);
      
      // If the response is successful but doesn't have a JSON body, return a simple success object
      if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
        return { success: true };
      }
      
      try {
        return await response.json();
      } catch (error) {
        // If we can't parse JSON, return the success status based on HTTP status
        return { success: response.ok };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been permanently deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const getLicenseBadgeClass = () => {
    switch (post.licenseType) {
      case "free":
        return "license-badge-free";
      case "paid":
        return "license-badge-paid";
      case "permission":
        return "license-badge-permission";
      case "none":
        return "license-badge-none";
      default:
        return "license-badge-free";
    }
  };

  const getLicenseText = () => {
    switch (post.licenseType) {
      case "free":
        return "Free License";
      case "paid":
        return "Paid License";
      case "permission":
        return "Permission Required";
      case "none":
        return "No Usage";
      default:
        return "Free License";
    }
  };

  const renderActionButton = () => {
    if (isOwner) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCertificateOpen(true)}
        >
          View Certificate
        </Button>
      );
    }

    if (post.userHasAccess) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadMutation.mutate(post.id)}
          disabled={!post.allowDownload || downloadMutation.isPending}
        >
          {downloadMutation.isPending ? "Downloading..." : "Download"}
        </Button>
      );
    }

    switch (post.licenseType) {
      case "free":
        return (
          <Button
            className="bg-primary hover:bg-primary/90"
            size="sm"
            onClick={() => downloadMutation.mutate(post.id)}
            disabled={!post.allowDownload || downloadMutation.isPending}
          >
            {downloadMutation.isPending ? "Downloading..." : "Download"}
          </Button>
        );
      case "paid":
        return (
          <Button
            className="bg-destructive hover:bg-destructive/90"
            size="sm"
          >
            Purchase • ${post.price || 5.99}
          </Button>
        );
      case "permission":
        return (
          <Button
            className="bg-accent hover:bg-accent/90"
            size="sm"
            onClick={() => requestLicenseMutation.mutate(post.id)}
            disabled={requestLicenseMutation.isPending}
          >
            {requestLicenseMutation.isPending ? "Requesting..." : "Request Permission"}
          </Button>
        );
      case "none":
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            No Usage Allowed
          </Button>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (post.contentType.startsWith("image/")) {
      return (
        <div className="relative">
          <img 
            src={post.thumbnailPath || post.filePath} 
            alt={post.title} 
            className="w-full h-96 object-cover" 
          />
          <div className="absolute bottom-3 right-3 protected-content-badge">
            <Shield className="h-3 w-3 mr-1" />
            <span>Protected Content</span>
          </div>
        </div>
      );
    } else if (post.contentType.startsWith("video/")) {
      return (
        <div className="relative">
          <video 
            src={post.filePath}
            controls
            className="w-full h-96 object-cover"
            poster={post.thumbnailPath}
          >
            Your browser does not support the video tag.
          </video>
          <div className="absolute bottom-3 right-3 protected-content-badge">
            <Shield className="h-3 w-3 mr-1" />
            <span>Protected Content</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative">
          <div className="h-96 bg-gray-200 flex items-center justify-center">
            <div className="text-center px-6">
              <Shield className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg text-gray-700">{post.title}</h3>
              <p className="text-gray-500 mt-1">{post.contentType}</p>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 protected-content-badge">
            <Shield className="h-3 w-3 mr-1" />
            <span>Protected Content</span>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Card className="overflow-hidden mb-6">
        {/* Post Header */}
        <div className="p-4 flex items-center justify-between">
          <Link href={`/profile/${post.owner.id}`}>
            <div className="flex items-center cursor-pointer">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.owner.avatarUrl} alt={post.owner.email} />
                <AvatarFallback>{post.owner.email.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium">{post.owner.email}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </Link>

          <div className="flex items-center">
            <span className={getLicenseBadgeClass()}>{getLicenseText()}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-2 text-gray-400">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={() => setIsCertificateOpen(true)}>
                      View Certificate
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteAlertOpen(true)}
                      className="text-red-500 focus:text-red-500 focus:bg-red-50"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem>Report Content</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post Content */}
        {renderContent()}

        {/* Post Caption */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg">{post.title}</h3>
          <p className="text-gray-600 mt-1">{post.description}</p>
        </CardContent>

        {/* Post Actions */}
        <CardFooter className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary space-x-1">
              <Heart className="h-4 w-4" />
              <span>{post.likeCount || 0}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary space-x-1">
              <MessageSquare className="h-4 w-4" />
              <span>{post.commentCount || 0}</span>
            </Button>
          </div>
          <div>
            {renderActionButton()}
          </div>
        </CardFooter>
      </Card>

      {isCertificateOpen && (
        <CertificatePreview
          post={post}
          isOpen={isCertificateOpen}
          onClose={() => setIsCertificateOpen(false)} 
        />
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePostMutation.mutate(post.id)}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostCard;
