import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import UserProfile from "@/components/UserProfile";
import LicenseRequests from "@/components/LicenseRequests";
import TrendingContent from "@/components/TrendingContent";
import PostCard from "@/components/PostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const Home = () => {
  const [activeTab, setActiveTab] = useState("feed");

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/me"],
  });

  const { data: posts, isLoading: isPostsLoading } = useQuery({
    queryKey: ["/api/posts"],
  });

  const { data: userPosts, isLoading: isUserPostsLoading } = useQuery({
    queryKey: ["/api/users/me/posts"],
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <Tabs defaultValue="feed" className="mb-6" onValueChange={setActiveTab}>
          <div className="flex items-center justify-center border-b">
            <TabsList className="bg-transparent">
              <TabsTrigger value="feed" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                Feed
              </TabsTrigger>
              <TabsTrigger value="myContent" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                My Content
              </TabsTrigger>
              <TabsTrigger value="licenses" className="data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">
                License Requests
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Feed */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Feed */}
            <div className="col-span-1 md:col-span-8">
              <TabsContent value="feed">
                {isPostsLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="mb-6">
                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center mb-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24 mt-1" />
                          </div>
                        </div>
                        <Skeleton className="h-64 w-full rounded-md" />
                        <div className="mt-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full mt-2" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : posts && posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUserId={currentUser?.id} 
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500">No posts available yet.</p>
                    <p className="text-gray-500 mt-2">Be the first to share protected content!</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="myContent">
                {isUserPostsLoading ? (
                  Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="mb-6">
                      <div className="bg-white rounded-lg shadow-sm p-4">
                        <div className="flex items-center mb-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-3">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24 mt-1" />
                          </div>
                        </div>
                        <Skeleton className="h-64 w-full rounded-md" />
                        <div className="mt-4">
                          <Skeleton className="h-6 w-3/4" />
                          <Skeleton className="h-4 w-full mt-2" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : userPosts && userPosts.length > 0 ? (
                  userPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      currentUserId={currentUser?.id} 
                    />
                  ))
                ) : (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-500">You haven't posted any content yet.</p>
                    <p className="text-sm text-gray-400 mt-2">Click the + icon to create your first post.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="licenses">
                <LicenseRequests showViewAll={false} limit={10} />
              </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="col-span-1 md:col-span-4 space-y-6">
              <UserProfile />
              
              {activeTab === "feed" && (
                <>
                  <LicenseRequests />
                  <TrendingContent />
                </>
              )}
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  );
};

export default Home;
