import type { SubmitHandler } from 'react-hook-form';
import type { Profile } from '@/types/profile.type';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { toast } from 'sonner';

import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';

import { Textarea } from '@/components/ui/textarea';
import { useUpdateProfileMutation } from '@/queries/myProfile.query';
import { uploadProfileFile } from '@/services/profile.service';

const profileSchema = z.object({
  bio: z.string().trim().max(280).optional().or(z.literal('')),
  fullName: z.string().trim().max(80).optional().or(z.literal('')),
  location: z.string().trim().max(80).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface Props {
  profile: Profile | null;
}

export function EditProfileDialog({ profile }: Props) {
  const fileInputReference = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile?.image?.url ?? '');
  const [imageId, setImageId] = useState<string | null>(
    profile?.image?.id ?? null,
  );

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      bio: profile?.bio ?? '',
      fullName: profile?.fullName ?? '',
      location: profile?.location ?? '',
      phone: profile?.phone ?? '',
    },
    mode: 'all',
    resolver: zodResolver(profileSchema),
  });
  const { control, formState: { errors }, handleSubmit, reset, watch } = form;
  const fullName = watch('fullName') ?? '';
  const bio = watch('bio') ?? '';

  const updateProfile = useUpdateProfileMutation();

  useEffect(() => {
    if (!open)
      return;

    reset({
      bio: profile?.bio ?? '',
      fullName: profile?.fullName ?? '',
      location: profile?.location ?? '',
      phone: profile?.phone ?? '',
    });
    setAvatarUrl(profile?.image?.url ?? '');
    setImageId(profile?.image?.id ?? null);
  }, [open, profile, reset]);

  const initials = (fullName || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file)
      return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);

    try {
      const response = await uploadProfileFile(file);

      setAvatarUrl(response.data.url);
      setImageId(response.data.id);

      toast.success('Photo uploaded');
    }
    catch (error: any) {
      toast.error(error.message || 'Upload failed');
    }
    finally {
      setUploading(false);
    }
  };

  const save: SubmitHandler<ProfileFormValues> = (values) => {
    updateProfile.mutate(
      {
        bio: values.bio,
        fullName: values.fullName,
        image: imageId,
        location: values.location,
        phone: values.phone,
      },
      {
        onError: (error: any) => {
          toast.error(error.message || 'Failed to save');
        },
        onSuccess: () => {
          toast.success('Profile updated');
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
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
                onChange={handleAvatarUpload}
                ref={fileInputReference}
                accept="image/*"
                type="file"
                className="hidden"
              />

              <Button
                onClick={() => fileInputReference.current?.click()}
                disabled={uploading}
                size="sm"
                type="button"
                variant="outline"
                className="gap-1"
              >
                {uploading
                  ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )
                  : (
                      <Upload className="h-4 w-4" />
                    )}

                {uploading ? 'Uploading...' : 'Change photo'}
              </Button>

              {avatarUrl && (
                <Button
                  onClick={() => {
                    setAvatarUrl('');
                    setImageId(null);
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                  className="ml-1 text-destructive"
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
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <Input
                  id="fullName"
                  maxLength={80}
                  placeholder="Your name"
                  {...field}
                />
              )}
            />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="bio"
                  maxLength={280}
                  placeholder="Tell others a bit about yourself..."
                  rows={3}
                  {...field}
                />
              )}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {bio.length}
              /280
            </p>
            {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    id="phone"
                    maxLength={30}
                    placeholder="+92..."
                    {...field}
                  />
                )}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <Input
                    id="location"
                    maxLength={80}
                    placeholder="Karachi, PK"
                    {...field}
                  />
                )}
              />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>

          <Button
            onClick={handleSubmit(save, errors_ => toast.error(Object.values(errors_)[0]?.message || 'Check input'))}
            disabled={updateProfile.isPending || uploading}
          >
            {updateProfile.isPending
              ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )
              : (
                  'Save'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
