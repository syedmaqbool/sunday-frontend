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
      <DialogContent className="w-[calc(100%-2rem)] max-w-[440px] overflow-hidden">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-center">Share your profile</DialogTitle>
          <DialogDescription className="text-center">
            Send your public profile to friends or share it on social media.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Social share buttons */}
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Share via
            </p>
            <div className="grid grid-cols-4 gap-2">
              {shareOptions.map((option) => (
                <a
                  key={option.label}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${option.iconBg}`}
                  >
                    <option.icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-foreground">
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
            <div className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/40 p-1.5">
              <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden px-2">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="block min-w-0 flex-1 truncate text-sm text-muted-foreground">
                  {profileUrl}
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0 gap-1"
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
      </DialogContent>
    </Dialog>
  );
};
