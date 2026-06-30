import type { SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  Info,
  Loader2,
  Star,
  Upload,
  Video as VideoIcon,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import BankDetailsModal from '@/components/BankDetailsModal';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCategoriesOptions, getSubcategoriesOptions } from '@/hooks/useCategories';
import { trackEvent } from '@/lib/analytics';
import { CONDITIONS, SHOE_SIZES, SIZES, WEIGHT_OPTIONS } from '@/lib/constants';
import { uploadFile } from '@/lib/uploadFile';
import {
  getEditListingOptions,
} from '@/queries/marketplace.query';
import {
  createListing,
  updateMyListing,
} from '@/services/listing.service';
import { getMyProfile } from '@/services/profile.service';

const MAX_PHOTOS = 20;

interface ExistingMediaItem { fileId: string; url: string }

const listingSchema = z.object({
  categoryId: z.string().min(1, 'Category is required.'),
  subcategoryId: z.string().min(1, 'Subcategory is required.'),
  brand: z.string().trim().min(1, 'Brand is required.'),
  condition: z.string().min(1, 'Condition is required.'),
  description: z.string().trim().min(1, 'Description is required.'),
  parentCategory: z.string().min(1, 'Category is required.'),
  price: z.string().refine(value => Number(value) > 0, 'Price must be greater than 0.'),
  size: z.string().min(1, 'Size is required.'),
  subCategory: z.string().min(1, 'Subcategory is required.'),
  title: z.string().trim().min(1, 'Title is required.'),
  weight: z.string().optional(),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const defaultListingValues: ListingFormValues = {
  categoryId: '',
  subcategoryId: '',
  brand: '',
  condition: '',
  description: '',
  parentCategory: '',
  price: '',
  size: '',
  subCategory: '',
  title: '',
  weight: '',
};

function FieldTip({ tip }: { tip: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={event => event.preventDefault()}
            aria-label="Field help"
            type="button"
            className="
              ml-1.5 inline-flex items-center text-muted-foreground transition-colors
              hover:text-primary
            "
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function CreateListing() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { toast } = useToast();
  const { loading: authLoading, user } = useAuth();
  const listingForm = useForm<ListingFormValues>({
    defaultValues: defaultListingValues,
    mode: 'all',
    resolver: zodResolver(listingSchema),
  });
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = listingForm;
  const formValues = watch();
  const sizeFieldError = errors.size;
  const { data: parentCategories = [] } = useQuery(getCategoriesOptions());
  const { data: subCategories = [] } = useQuery(getSubcategoriesOptions(formValues.categoryId));
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingMediaItem[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<ExistingMediaItem | null>(null);
  const [videoMuted, setVideoMuted] = useState(true);

  const [bankModalOpen, setBankModalOpen] = useState(false);

  const { data: existingListing, isLoading: loadingListing } = useQuery(getEditListingOptions(id, user?.id));

  useEffect(() => {
    if (!authLoading && !user)
      navigate('/auth', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!existingListing)
      return;

    if (existingListing.sellerId !== user?.id) {
      navigate('/listings', { replace: true });
      return;
    }

    const parts = (existingListing.categoryValue || '').split('-');
    const closestWeight = (() => {
      if (!existingListing.weight)
        return '';
      const options = WEIGHT_OPTIONS.map(o => ({ ...o, num: Number(o.value) }));
      let closest = options[0];
      let minDistribution = Math.abs(options[0].num - existingListing.weight);
      for (let index = 1; index < options.length; index++) {
        const distribution = Math.abs(options[index].num - existingListing.weight);
        if (distribution < minDistribution) {
          minDistribution = distribution;
          closest = options[index];
        }
      }
      return closest.value;
    })();

    reset({
      categoryId: existingListing.categoryId,
      subcategoryId: existingListing.subcategoryId,
      brand: existingListing.brand || '',
      condition: existingListing.condition,
      description: existingListing.description || '',
      parentCategory: parts[0] || '',
      price: String(existingListing.price),
      size: existingListing.size,
      subCategory: parts[1] || '',
      title: existingListing.title,
      weight: closestWeight,
    });

    const sortedMedia = [...(existingListing.media ?? [])]
      .toSorted((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const images = sortedMedia
      .filter(m => m.type === 'IMAGE')
      .map(m => ({ fileId: m.file?.id ?? '', url: m.file?.url ?? '' }))
      .filter(m => m.fileId && m.url);

    const vid = sortedMedia.find(m => m.type === 'VIDEO');
    setExistingImages(images);
    setExistingVideo(
      vid?.file?.id && vid?.file.url
        ? { fileId: vid.file.id, url: vid.file.url }
        : null,
    );
  }, [existingListing, user, navigate, reset]);

  const handleAddImages = (event_: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...event_.target.files || []];
    const total = imageFiles.length + existingImages.length + files.length;
    if (total > MAX_PHOTOS) {
      toast({ title: `Max ${MAX_PHOTOS} photos allowed`, variant: 'destructive' });
      return;
    }
    setImageFiles(previous => [...previous, ...files]);
  };

  const handleAddVideo = (event_: React.ChangeEvent<HTMLInputElement>) => {
    const file = event_.target.files?.[0];
    if (!file)
      return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: 'Video must be under 50MB', variant: 'destructive' });
      return;
    }
    setVideoFile(file);
    setExistingVideo(null);
  };

  const removeNewImage = (index: number) => {
    setImageFiles(previous => previous.filter((_, index_) => index_ !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(previous => previous.filter((_, index_) => index_ !== index));
  };

  const removeVideo = () => {
    setVideoFile(null);
    setExistingVideo(null);
  };

  const setCoverPhoto = (previewIndex: number) => {
    if (previewIndex === 0)
      return;
    if (previewIndex < existingImages.length) {
      setExistingImages((previous) => {
        const next = [...previous];
        const [cover] = next.splice(previewIndex, 1);
        next.unshift(cover);
        return next;
      });
    }
    else {
      const newIndex = previewIndex - existingImages.length;
      setImageFiles((previous) => {
        const next = [...previous];
        const [cover] = next.splice(newIndex, 1);
        next.unshift(cover);
        return next;
      });
    }
  };

  const totalPhotos = imageFiles.length + existingImages.length;
  const hasVideo = !!videoFile || !!existingVideo;

  async function performSubmit(values: ListingFormValues) {
    setSubmitting(true);

    if (!user) {
      setSubmitting(false);
      return;
    }

    try {
      const newImageItems = await Promise.all(
        imageFiles.map(async (file, index) => {
          const { data } = await uploadFile(file);
          return { fileId: data.id, sortOrder: index };
        }),
      );

      let newVideoFileId: string | null = null;
      if (videoFile) {
        const { data } = await uploadFile(videoFile);
        newVideoFileId = data.id;
      }

      if (isEditing) {
        const existingImageItems = existingImages.map((img, index) => ({
          fileId: img.fileId,
          sortOrder: index,
        }));
        const allImageItems = [
          ...existingImageItems,
          ...newImageItems.map((item, index) => ({
            fileId: item.fileId,
            sortOrder: existingImages.length + index,
          })),
        ];
        const videoFileId = newVideoFileId ?? existingVideo?.fileId ?? null;
        const media = [
          ...allImageItems,
          ...(videoFileId ? [{ fileId: videoFileId, sortOrder: allImageItems.length }] : []),
        ];

        await updateMyListing(id!, {
          categoryId: values.categoryId,
          subcategoryId: values.subcategoryId,
          brand: values.brand,
          condition: values.condition,
          description: values.description,
          media,
          price: Number(values.price),
          size: values.size,
          title: values.title,
          weight: values.weight ? Number(values.weight) : null,
        });

        toast({ description: 'Your changes have been saved.', title: 'Listing updated!' });
        navigate(`/listing/${id}`);
      }
      else {
        const allImageItems = newImageItems.map((item, index) => ({
          fileId: item.fileId,
          sortOrder: index,
        }));
        const media = [
          ...allImageItems,
          ...(newVideoFileId
            ? [{ fileId: newVideoFileId, sortOrder: allImageItems.length }]
            : []),
        ];

        const { data: newListing } = await createListing({
          categoryId: values.categoryId,
          subcategoryId: values.subcategoryId,
          brand: values.brand,
          condition: values.condition,
          description: values.description,
          media,
          price: Number(values.price),
          size: values.size,
          title: values.title,
          weight: values.weight ? Number(values.weight) : null,
        });

        trackEvent('listing_created', {
          brand: values.brand,
          category: `${values.parentCategory}-${values.subCategory}`,
          listing_id: newListing.id,
          price: Number(values.price),
        });
        toast({ description: 'Your item is pending review.', title: 'Listing created!' });
        navigate('/listings');
      }
    }
    catch (error: any) {
      toast({ description: error.message, title: 'Error', variant: 'destructive' });
    }
    finally {
      setSubmitting(false);
    }
  }

  const onSubmit: SubmitHandler<ListingFormValues> = async (values) => {
    if (!user)
      return;

    if (totalPhotos === 0) {
      toast({ title: 'At least 1 photo is required', variant: 'destructive' });
      return;
    }
    if (!hasVideo) {
      toast({
        description: 'Please upload 1 video of the item.',
        title: 'A video is required',
        variant: 'destructive',
      });
      return;
    }

    if (!isEditing) {
      try {
        const { data: profile } = await getMyProfile();
        const hasBankDetails
          = !!profile.bankAccountHolder
            && !!profile.bankName
            && !!profile.bankAccountNumber;
        if (!hasBankDetails) {
          setBankModalOpen(true);
          return;
        }
      }
      catch (error: any) {
        toast({ description: error.message, title: 'Error', variant: 'destructive' });
        return;
      }
    }

    await performSubmit(values);
  };

  const allPreviews = [
    ...existingImages.map(img => ({ type: 'existing' as const, url: img.url })),
    ...imageFiles.map((file, index) => ({
      index,
      type: 'new' as const,
      url: URL.createObjectURL(file),
    })),
  ];

  const videoPreviewUrl = useMemo(
    () => videoFile ? URL.createObjectURL(videoFile) : (existingVideo?.url ?? null),
    [existingVideo, videoFile],
  );

  if (authLoading || loadingListing)
    return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-2xl flex-1 py-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          {isEditing ? 'Edit Listing' : 'Sell an Item'}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isEditing
            ? 'Update your listing details'
            : 'List your pre-loved fashion for sale'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {/* Photo upload */}
          <div>
            <Label>
              Photos (up to
              {' '}
              {MAX_PHOTOS}
              )
              {' '}
              <span className="font-normal text-muted-foreground">
                —
                {' '}
                {totalPhotos}
                /
                {MAX_PHOTOS}
              </span>
              <FieldTip tip="Upload clear, well-lit photos from multiple angles. The first image is your cover — tap the star on any photo to make it the cover. Show any flaws or details up close. Up to 20 images." />
            </Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {allPreviews.map((preview, index) => (
                <div
                  key={preview.url}
                  className={`
                    relative h-24 w-24 overflow-hidden rounded-lg border
                    ${
                index === 0 ? 'border-gold ring-2 ring-gold' : 'border-border'
                }
                  `}
                >
                  <img
                    src={preview.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={() =>
                      preview.type === 'existing'
                        ? removeExistingImage(
                            existingImages.findIndex(img => img.url === preview.url),
                          )
                        : removeNewImage(preview.index!)}
                    type="button"
                    className="
                      absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive
                      hover:bg-background
                    "
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {index === 0
                    ? (
                        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-gold/90 py-0.5 text-center">
                          <Star className="h-2.5 w-2.5 fill-white text-white" />
                          <span className="text-[9px] font-semibold text-white">
                            Cover
                          </span>
                        </div>
                      )
                    : (
                        <button
                          onClick={() => setCoverPhoto(index)}
                          title="Set as cover photo"
                          type="button"
                          className="
                            absolute bottom-1 left-1 rounded-full bg-background/80 p-1 text-muted-foreground transition-colors
                            hover:bg-background hover:text-gold
                          "
                        >
                          <Star className="h-3 w-3" />
                        </button>
                      )}
                </div>
              ))}
              {allPreviews.length < MAX_PHOTOS && (
                <label className="
                  flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground transition
                  hover:border-primary hover:text-primary
                "
                >
                  <input
                    onChange={handleAddImages}
                    accept="image/*"
                    multiple
                    type="file"
                    className="hidden"
                  />
                  {allPreviews.length > 0
                    ? (
                        <Upload className="h-4 w-4" />
                      )
                    : (
                        <Camera className="h-5 w-5" />
                      )}
                  <span className="mt-1 text-[10px]">Add photo</span>
                </label>
              )}
            </div>
          </div>

          {/* Video upload (mandatory) */}
          <div>
            <Label>
              Video
              {' '}
              <span className="text-destructive">*</span>
              {' '}
              <span className="font-normal text-muted-foreground">
                — 1 short video required (max 50MB)
              </span>
              <FieldTip tip="A short 360° video helps buyers trust your listing. Show the item from all sides, zoom in on labels, fabric, and any flaws. Max 50MB." />
            </Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {videoPreviewUrl
                ? (
                    <div className="relative h-32 w-44 overflow-hidden rounded-lg border border-border bg-muted">
                      <video
                        src={videoPreviewUrl}
                        controls
                        muted={videoMuted}
                        className="h-full w-full object-cover"
                      />
                      <button
                        onClick={() => setVideoMuted(m => !m)}
                        title={videoMuted ? 'Unmute' : 'Mute'}
                        type="button"
                        className="
                          absolute left-1 top-1 rounded-full bg-background/80 p-1 text-foreground
                          hover:bg-background
                        "
                      >
                        {videoMuted
                          ? (
                              <VolumeX className="h-3.5 w-3.5" />
                            )
                          : (
                              <Volume2 className="h-3.5 w-3.5" />
                            )}
                      </button>
                      <button
                        onClick={removeVideo}
                        type="button"
                        className="
                          absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive
                          hover:bg-background
                        "
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                : (
                    <label className="
                      flex h-32 w-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted text-muted-foreground transition
                      hover:border-primary hover:text-primary
                    "
                    >
                      <input
                        onChange={handleAddVideo}
                        accept="video/*"
                        type="file"
                        className="hidden"
                      />
                      <VideoIcon className="h-5 w-5" />
                      <span className="mt-1 text-[10px]">Add video</span>
                    </label>
                  )}
            </div>
          </div>

          <div className="
            grid gap-4
            sm:grid-cols-2
          "
          >
            <div className="space-y-2">
              <Label htmlFor="title">
                Title
                <FieldTip tip="A concise, descriptive title shoppers can search for. Include brand, item type, and a key detail (e.g. 'Vintage Levi's 501 high-waist jeans')." />
              </Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    id="title"
                    placeholder="e.g. Vintage Levi's 501 Jeans"
                    {...field}
                  />
                )}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">
                Brand
                <FieldTip tip="The original maker of the item. Use the official brand name as it appears on the label (e.g. Nike, Zara, Gucci)." />
              </Label>
              <Controller
                name="brand"
                control={control}
                render={({ field }) => (
                  <Input
                    id="brand"
                    placeholder="e.g. Levi's"
                    {...field}
                  />
                )}
              />
              {errors.brand && <p className="text-sm text-destructive">{errors.brand.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description
              <FieldTip tip="Describe size fit, materials, measurements, condition, and any flaws or signs of wear. Honest detailed descriptions reduce returns and complaints." />
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="description"
                  placeholder="Describe the item, its condition, and any flaws..."
                  rows={4}
                  {...field}
                />
              )}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="
            grid gap-4
            sm:grid-cols-2
          "
          >
            <div className="space-y-2">
              <Label>
                Category
                <FieldTip tip="Pick the broad category that best matches your item (e.g. Women, Men, Kids, Accessories). Choosing the right one helps the right buyers find it." />
              </Label>
              <Controller
                name="parentCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      const cat = parentCategories.find(c => c.value === v);
                      field.onChange(v);
                      setValue('categoryId', cat?.id ?? '', { shouldDirty: true, shouldValidate: true });
                      setValue('subcategoryId', '', { shouldDirty: true, shouldValidate: true });
                      setValue('subCategory', '', { shouldDirty: true, shouldValidate: true });
                      setValue('size', '', { shouldDirty: true, shouldValidate: true });
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {parentCategories.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.parentCategory && <p className="text-sm text-destructive">{errors.parentCategory.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>
                Subcategory
                <FieldTip tip="Refines your category — e.g. under Women → Dresses, Tops, Shoes. Pick the closest match so your item appears in the correct browse filters." />
              </Label>
              <Controller
                name="subCategory"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      const sub = subCategories.find(c => c.value === v);
                      field.onChange(v);
                      setValue('subcategoryId', sub?.id ?? '', { shouldDirty: true, shouldValidate: true });
                      setValue('size', '', { shouldDirty: true, shouldValidate: true });
                    }}
                    value={field.value}
                    disabled={!formValues.parentCategory}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          formValues.parentCategory
                            ? 'Select type'
                            : 'Choose category first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map(c => (
                        <SelectItem key={c.id} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.subCategory && <p className="text-sm text-destructive">{errors.subCategory.message}</p>}
            </div>
          </div>

          <div className="
            grid gap-4
            sm:grid-cols-2
            lg:grid-cols-3
          "
          >
            <div className="space-y-2">
              <Label htmlFor="price">
                Price (PKR)
                <FieldTip tip="Set a fair selling price in Pakistani Rupees. Buyers can still negotiate via offers — pick a price that leaves a little room to bargain." />
              </Label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    id="price"
                    min="1"
                    placeholder="0"
                    step="0.01"
                    type="number"
                    {...field}
                  />
                )}
              />
              {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>
                Weight
                <FieldTip tip="Approximate packed weight range. Used to estimate shipping cost. Pick the range that best matches your item in its packaging." />
              </Label>
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEIGHT_OPTIONS.map(w => (
                        <SelectItem key={w.value} value={w.value}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Condition
                <FieldTip tip="Honest condition rating: New with tags, Like new, Good (light wear), or Fair (visible wear). Be accurate — buyers can report mismatched listings." />
              </Label>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.condition && <p className="text-sm text-destructive">{errors.condition.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Size
              <FieldTip
                tip={
                  formValues.subCategory === 'shoes'
                    ? 'Select the European shoe size (EU).'
                    : 'Use the size on the garment label. If sizing runs differently from standard, mention it in the description (e.g. \'M but fits like S\').'
                }
              />
            </Label>
            <Controller
              name="size"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!formValues.subCategory}
                >
                  <SelectTrigger className="
                    w-full
                    sm:w-[200px]
                  "
                  >
                    <SelectValue
                      placeholder={
                        formValues.subCategory
                          ? 'Select size'
                          : 'Choose subcategory first'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(formValues.subCategory === 'shoes' ? SHOE_SIZES : SIZES).map(
                      s => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {sizeFieldError && <p className="text-sm text-destructive">{sizeFieldError.message}</p>}
          </div>

          <Button
            disabled={submitting}
            size="lg"
            type="submit"
            className="w-full"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Submit Listing'}
          </Button>
        </form>
      </main>
      <Footer />

      <BankDetailsModal
        onCancel={() => setBankModalOpen(false)}
        onSaved={async () => {
          setBankModalOpen(false);
          await performSubmit(getValues());
        }}
        open={bankModalOpen}
      />
    </div>
  );
}

export default CreateListing;
