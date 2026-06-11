import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Share2,
  MessageCircle,
  Facebook,
  Twitter,
  Mail,
  Link as LinkIcon,
  Check,
} from "lucide-react";

interface ShareProfileDialogProps {
  userId: string;
  userName?: string | null;
}

const getShareUrl = (userId: string) => {
  return `${window.location.origin}/seller/${userId}`;
};

export const ShareProfileDialog = ({
  userId,
  userName,
}: ShareProfileDialogProps) => {
  const [copied, setCopied] = useState(false);
  const profileUrl = getShareUrl(userId);
  const displayName = userName || "My";
  const shareText = `Check out ${displayName}'s profile on Sunday:`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(profileUrl);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareOptions = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      color: "hover:bg-green-50 hover:text-green-600",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-blue-50 hover:text-blue-600",
    },
    {
      label: "X (Twitter)",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      color: "hover:bg-slate-50 hover:text-slate-900",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(
        `${displayName}'s Sunday Profile`
      )}&body=${encodedText}%20${encodedUrl}`,
      color: "hover:bg-orange-50 hover:text-orange-600",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" /> Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Share your profile</DialogTitle>
          <DialogDescription>
            Share your public profile with friends and on social media.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Copy link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground truncate">
              {profileUrl}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0 gap-1"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          {/* Social share buttons */}
          <div className="grid grid-cols-2 gap-3">
            {shareOptions.map((option) => (
              <a
                key={option.label}
                href={option.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-colors ${option.color}`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
