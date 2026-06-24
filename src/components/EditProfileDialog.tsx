import { useState, useRef } from "react";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Loader2, Upload, Pencil } from "lucide-react";

import { useUpdateProfile } from "@/queries/useMyProfile";
import { profileService, type Profile } from "@/services/profile.service";

const profileSchema = z.object({
  fullName: z.string().trim().max(80).optional().or(z.literal("")),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
});

interface Props {
  profile: Profile | null;
}

export const EditProfileDialog = ({ profile }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile?.image?.url ?? "");
  const [imageId, setImageId] = useState<string | null>(
    profile?.image?.id ?? null
  );

  const [fullName, setFullName] = useState(profile?.fullName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [location, setLocation] = useState(profile?.location ?? "");

  const updateProfile = useUpdateProfile();

  const initials = (fullName || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);

    try {
      const res = await profileService.uploadFile(file);

      setAvatarUrl(res.data.url);
      setImageId(res.data.id);

      toast.success("Photo uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const parsed = profileSchema.safeParse({
      fullName,
      bio,
      phone,
      location,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    updateProfile.mutate(
      {
        fullName,
        bio,
        phone,
        location,
        image: imageId,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          setOpen(false);
        },
        onError: (err: any) => {
          toast.error(err.message || "Failed to save");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit your profile</DialogTitle>
          <DialogDescription>
            Update your photo, bio, and contact info.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}

                {uploading ? "Uploading..." : "Change photo"}
              </Button>

              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 text-destructive"
                  onClick={() => {
                    setAvatarUrl("");
                    setImageId(null);
                  }}
                >
                  Remove
                </Button>
              )}

              <p className="mt-1 text-xs text-muted-foreground">
                JPG, PNG or GIF, max 5MB
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={80}
              placeholder="Your name"
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="Tell others a bit about yourself..."
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {bio.length}/280
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                placeholder="+92..."
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={80}
                placeholder="Karachi, PK"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            onClick={save}
            disabled={updateProfile.isPending || uploading}
          >
            {updateProfile.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};