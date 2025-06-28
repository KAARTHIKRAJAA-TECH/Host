import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import type { Post } from "./PostCard";

const TrendingContent = () => {
  const { data: trendingPosts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts/trending"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trending Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                <div className="ml-3">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getLicenseBadge = (licenseType: string) => {
    switch (licenseType) {
      case "free":
        return <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full mt-1 inline-block">Free</span>;
      case "paid":
        return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full mt-1 inline-block">Paid</span>;
      case "permission":
        return <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full mt-1 inline-block">Permission</span>;
      default:
        return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">Protected</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Trending Content</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trendingPosts && trendingPosts.length > 0 ? (
            trendingPosts.map((post) => (
              <div key={post.id} className="flex items-center">
                <Link href={`/posts/${post.id}`}>
                  <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden cursor-pointer">
                    {post.thumbnailPath && (
                      <img 
                        src={post.thumbnailPath} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </Link>
                <div className="ml-3">
                  <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                  <p className="text-xs text-gray-500">
                    by {post.owner.email.split('@')[0]} • {post.likeCount || 0} likes
                  </p>
                  {getLicenseBadge(post.licenseType)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No trending content yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingContent;
