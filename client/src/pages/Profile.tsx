import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import Navbar from "@/components/Navbar";
import UserProfile from "@/components/UserProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Grid, ListFilter, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import CertificatePreview from "@/components/CertificatePreview";

const Profile = () => {
  const { id } = useParams();
  const [viewType, setViewType] = useState("grid");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ["/api/users/me"],
  });

  const { data: userPosts, isLoading: isPostsLoading } = useQuery({
    queryKey: id ? [`/api/users/${id}/posts`] : ["/api/users/me/posts"],
  });

  const filteredPosts = userPosts?.filter((post) => {
    if (licenseFilter === "all") return true;
    return post.licenseType === licenseFilter;
  });

  const getLicenseBadgeClass = (licenseType) => {
    switch (licenseType) {
      case "free":
        return "bg-secondary text-white";
      case "paid":
        return "bg-destructive text-white";
      case "permission":
        return "bg-accent text-white";
      case "none":
        return "bg-gray-500 text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getLicenseText = (licenseType) => {
    switch (licenseType) {
      case "free":
        return "Free";
      case "paid":
        return "Paid";
      case "permission":
        return "Permission";
      case "none":
        return "No Use";
      default:
        return "Free";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-1 md:col-span-4">
            <UserProfile userId={id} />
            
            <Card className="mt-6">
              <CardContent className="p-5">
                <h3 className="font-bold text-lg mb-3">License Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Content Files</p>
                    <p className="text-xl font-bold">{userPosts?.length || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Licenses Granted</p>
                    <p className="text-xl font-bold">{currentUser?.licenseCount || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Free Content</p>
                    <p className="text-xl font-bold">
                      {userPosts?.filter(post => post.licenseType === "free").length || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Protected Content</p>
                    <p className="text-xl font-bold">
                      {userPosts?.filter(post => post.licenseType !== "free").length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="col-span-1 md:col-span-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Content Library</h2>
                  <div className="flex items-center space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <ListFilter className="h-4 w-4 mr-2" />
                          <span>Filter</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLicenseFilter("all")}>
                          All Types
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLicenseFilter("free")}>
                          Free License
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLicenseFilter("paid")}>
                          Paid License
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLicenseFilter("permission")}>
                          Permission Required
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLicenseFilter("none")}>
                          No Usage
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="flex rounded-md shadow-sm">
                      <Button
                        variant={viewType === "grid" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewType("grid")}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewType === "list" ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewType("list")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <line x1="8" y1="6" x2="21" y2="6" />
                          <line x1="8" y1="12" x2="21" y2="12" />
                          <line x1="8" y1="18" x2="21" y2="18" />
                          <line x1="3" y1="6" x2="3.01" y2="6" />
                          <line x1="3" y1="12" x2="3.01" y2="12" />
                          <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
                
                <Tabs defaultValue="content">
                  <TabsList className="mb-4">
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="licenses">Licenses</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="content">
                    {isPostsLoading ? (
                      viewType === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton key={index} className="w-full h-40 rounded-md" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                              <Skeleton className="h-12 w-12 rounded-md" />
                              <div className="ml-3 flex-1">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2 mt-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : filteredPosts && filteredPosts.length > 0 ? (
                      viewType === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {filteredPosts.map((post) => (
                            <div 
                              key={post.id} 
                              className="relative group rounded-md overflow-hidden cursor-pointer"
                              onClick={() => setSelectedPost(post)}
                            >
                              <div className="aspect-square bg-gray-200">
                                {post.thumbnailPath && (
                                  <img 
                                    src={post.thumbnailPath} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 flex flex-col items-center transition-all duration-200">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-white border-white"
                                  >
                                    <Shield className="h-4 w-4 mr-1" />
                                    Certificate
                                  </Button>
                                </div>
                              </div>
                              <div className="absolute bottom-2 right-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getLicenseBadgeClass(post.licenseType)}`}>
                                  {getLicenseText(post.licenseType)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredPosts.map((post) => (
                            <div 
                              key={post.id} 
                              className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => setSelectedPost(post)}
                            >
                              <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                                {post.thumbnailPath && (
                                  <img 
                                    src={post.thumbnailPath} 
                                    alt={post.title} 
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium">{post.title}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${getLicenseBadgeClass(post.licenseType)}`}>
                                    {getLicenseText(post.licenseType)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Created {new Date(post.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No content found with the selected filter.</p>
                        {licenseFilter !== "all" && (
                          <Button 
                            variant="link" 
                            onClick={() => setLicenseFilter("all")}
                          >
                            Show all content
                          </Button>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="licenses">
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p>License details will appear here.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {selectedPost && (
        <CertificatePreview
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Profile;
