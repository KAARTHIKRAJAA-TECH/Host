import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, X, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define form schema with validation
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  licenseType: z.enum(["free", "paid", "permission", "none"], {
    required_error: "Please select a license type",
  }),
  allowDownload: z.boolean().default(false),
  file: z.instanceof(File, { message: "Please upload a file" }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePostModal = ({ isOpen, onClose }: CreatePostModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      licenseType: "free",
      allowDownload: false,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      form.setValue("file", file);
      
      // Create preview for image files
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/posts", undefined, {
        formData: data,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/posts"] });
      toast({
        title: "Post created successfully!",
        description: "Your content is now protected.",
        variant: "success",
      });
      onClose();
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to create post",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!selectedFile) {
      toast({
        title: "File required",
        description: "Please upload a file to continue.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("licenseType", values.licenseType);
    formData.append("allowDownload", values.allowDownload.toString());
    formData.append("file", selectedFile);

    createPostMutation.mutate(formData);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      form.setValue("file", file);
      
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleReset = () => {
    form.reset();
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Create New Post
          </DialogTitle>
          <DialogDescription>
            Upload content and set license conditions
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                selectedFile ? "border-primary" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              />

              {previewUrl ? (
                <div className="relative mb-4">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-60 mx-auto rounded"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      form.setValue("file", undefined as any);
                    }}
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto" />
                  <p className="text-gray-600">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="text-gray-400 text-sm">
                    Supports: Images, Videos, Documents, Audio
                  </p>
                </div>
              )}

              {selectedFile && !previewUrl && (
                <div className="mt-2 py-2 px-4 bg-gray-100 rounded-md inline-flex items-center">
                  <span className="text-sm font-medium">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-5 w-5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      form.setValue("file", undefined as any);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {form.formState.errors.file && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.file.message}
                </p>
              )}
            </div>

            {/* Post Details */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Give your content a title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-3"
                    >
                      <div className="border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50 transition">
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <RadioGroupItem value="free" id="free" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel htmlFor="free" className="font-medium">Free to Use</FormLabel>
                            <p className="text-xs text-gray-500">Anyone can use without permission</p>
                          </div>
                        </FormItem>
                      </div>
                      
                      <div className="border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50 transition">
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <RadioGroupItem value="paid" id="paid" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel htmlFor="paid" className="font-medium">Paid License</FormLabel>
                            <p className="text-xs text-gray-500">Users must purchase a license</p>
                          </div>
                        </FormItem>
                      </div>
                      
                      <div className="border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50 transition">
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <RadioGroupItem value="permission" id="permission" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel htmlFor="permission" className="font-medium">Request Permission</FormLabel>
                            <p className="text-xs text-gray-500">Users must request your approval</p>
                          </div>
                        </FormItem>
                      </div>
                      
                      <div className="border rounded-md p-3 cursor-pointer hover:border-primary hover:bg-blue-50 transition">
                        <FormItem className="flex items-start space-x-2">
                          <FormControl>
                            <RadioGroupItem value="none" id="none" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel htmlFor="none" className="font-medium">No Usage</FormLabel>
                            <p className="text-xs text-gray-500">Protected content, view only</p>
                          </div>
                        </FormItem>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowDownload"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Allow downloads for authorized users</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={createPostMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createPostMutation.isPending}
              >
                {createPostMutation.isPending ? "Creating..." : "Create Post"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
