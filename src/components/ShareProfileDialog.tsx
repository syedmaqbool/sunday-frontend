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

const getShareUrl = (userId: string) =>
  `${window.location.origin}/seller/${userId}`;

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
      iconBg: "bg-[#25D366]/10 text-[#25D366]",
    },
    {
      label: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      iconBg: "bg-[#1877F2]/10 text-[#1877F2]",
    },
    {
      label: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      iconBg: "bg-foreground/10 text-foreground",
    },
    {
      label: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(
        `${displayName}'s Sunday Profile`
      )}&body=${encodedText}%20${encodedUrl}`,
      iconBg: "bg-primary/10 text-primary",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Share2 className="h-4 w-4" /> Share Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden p-0">
        <div className="min-w-0 p-5 sm:p-6">
        <DialogHeader className="min-w-0 pr-6 text-left sm:text-left">
          <div className="mb-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Share2 className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <DialogTitle className="text-xl leading-tight">Share your profile</DialogTitle>
          <DialogDescription className="max-w-sm">
            Send your public profile to friends or share it on social media.
          </DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-5 pt-5">
          {/* Social share buttons */}
          <div className="min-w-0">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Share via
            </p>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              {shareOptions.map((option) => (
                <a
                  key={option.label}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${option.iconBg}`}
                  >
                    <option.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Copy link */}
          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Or copy link
            </p>
            <div className="min-w-0 space-y-3 rounded-lg border border-border bg-muted/40 p-3">
              <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="block min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {profileUrl}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="w-full gap-1"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>Copy</>
                )}
              </Button>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
