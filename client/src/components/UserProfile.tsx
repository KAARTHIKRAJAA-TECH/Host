import { useQuery } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileProps {
  userId?: string; // Optional - if not provided, shows current user's profile
}

const UserProfile = ({ userId }: UserProfileProps) => {
  const { data: currentUser, isLoading: isCurrentUserLoading } = useQuery({
    queryKey: ["/api/users/me"],
  });

  const { data: profileUser, isLoading: isProfileUserLoading } = useQuery({
    queryKey: userId ? [`/api/users/${userId}`] : [null],
    enabled: !!userId,
  });

  const user = userId ? profileUser : currentUser;
  const isLoading = userId ? isProfileUserLoading : isCurrentUserLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="ml-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48 mb-1" />
              <div className="flex mt-1">
                <Skeleton className="h-3 w-16 mr-3" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl} alt={user.email} />
            <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <h3 className="font-bold text-xl">{user.email?.split('@')[0] || "User"}</h3>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <div className="flex mt-1">
              <span className="text-xs text-gray-500 mr-3">
                <strong>{user.postCount || 0}</strong> Posts
              </span>
              <span className="text-xs text-gray-500">
                <strong>{user.licenseCount || 0}</strong> Licenses
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4">
          {userId ? (
            <Button className="w-full" variant="outline">
              Request Content License
            </Button>
          ) : (
            <Button className="w-full" asChild>
              <Link href="/profile">
                View My Profile
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
