import AdminLayout from "@/components/admin/AdminLayout";
import { useQuery } from "@tanstack/react-query";
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
import { formatDate, getLicenseTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Post {
  id: number;
  title: string;
  licenseType: string;
  contentType: string;
  createdAt: string;
  owner: {
    id: number;
    email: string;
  };
}

export default function AdminPosts() {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["/api/admin/posts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      return res.json();
    },
  });

  return (
    <AdminLayout title="Content Management">
      <Card>
        <CardHeader>
          <CardTitle>All Content</CardTitle>
          <CardDescription>
            Manage content published on the Content Shield platform
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
                  <TableHead>Title</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.id}</TableCell>
                    <TableCell>{post.title}</TableCell>
                    <TableCell>{post.owner?.email || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getLicenseTypeLabel(post.licenseType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.contentType}</TableCell>
                    <TableCell>{formatDate(post.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {posts?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No content found
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