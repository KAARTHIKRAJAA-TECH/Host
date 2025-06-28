import { useState } from "react";
import { Shield, X, Download, Printer } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Post } from "./PostCard";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface CertificatePreviewProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}

const CertificatePreview = ({ post, isOpen, onClose }: CertificatePreviewProps) => {
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const { toast } = useToast();

  const printCertificateMutation = useMutation({
    mutationFn: async () => {
      window.print();
    },
  });

  const downloadPdfMutation = useMutation({
    mutationFn: async () => {
      setIsPdfGenerating(true);
      try {
        const response = await fetch(`/api/posts/${post.id}/certificate`, {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to generate certificate");
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificate-${post.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        return true;
      } finally {
        setIsPdfGenerating(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to download certificate",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const getLicenseType = () => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bold text-lg flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Certificate of Ownership
          </DialogTitle>
        </DialogHeader>
        
        <div className="border-4 border-double border-gray-300 p-6 bg-gray-50 print:border-0 print:bg-white" id="certificate-content">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white">
                <Shield className="h-6 w-6" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1">Certificate of Ownership</h2>
            <p className="text-gray-500 text-sm mb-4">Content Shield Blockchain Verification</p>
            
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-4"></div>
            
            <h3 className="text-xl font-bold mb-4 text-gray-800">"{post.title}"</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left">
              <div>
                <p className="text-gray-500 text-xs">Owner</p>
                <p className="font-medium">{post.owner.email.split('@')[0]}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium">{post.owner.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Creation Date</p>
                <p className="font-medium">{formatDate(post.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">License Type</p>
                <p className="font-medium">{getLicenseType()}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-3 rounded-md mb-6">
              <p className="text-gray-500 text-xs mb-1">Content Hash</p>
              <p className="font-mono text-xs break-all">{post.contentHash}</p>
            </div>
            
            <div className="text-center text-gray-500 text-xs">
              <p>This certificate verifies ownership of the content as registered on Content Shield.</p>
              <p>Verify at: contentshield.io/verify</p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => downloadPdfMutation.mutate()}
            disabled={isPdfGenerating}
            className="space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>{isPdfGenerating ? "Generating..." : "Download PDF"}</span>
          </Button>
          <Button
            onClick={() => printCertificateMutation.mutate()}
            disabled={printCertificateMutation.isPending}
            className="space-x-1"
          >
            <Printer className="h-4 w-4" />
            <span>Print Certificate</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CertificatePreview;
