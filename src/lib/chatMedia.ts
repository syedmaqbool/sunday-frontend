export const CHAT_MEDIA_ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime';
export const CHAT_MEDIA_MAX_ATTACHMENTS = 4;

const CHAT_IMAGE_MINIMUM_SIZE = 1024;
const CHAT_IMAGE_MAXIMUM_SIZE = 10 * 1024 * 1024;
const CHAT_VIDEO_MINIMUM_SIZE = 10 * 1024;
const CHAT_VIDEO_MAXIMUM_SIZE = 50 * 1024 * 1024;
const CHAT_MEDIA_TYPES = new Set(CHAT_MEDIA_ACCEPT.split(','));

export function getChatMediaValidationError(file: File): string | null {
  if (!CHAT_MEDIA_TYPES.has(file.type)) {
    return `${file.name}: choose a JPEG, PNG, WebP, MP4, or MOV file.`;
  }

  const isVideo = file.type.startsWith('video/');
  const minimumSize = isVideo ? CHAT_VIDEO_MINIMUM_SIZE : CHAT_IMAGE_MINIMUM_SIZE;
  const maximumSize = isVideo ? CHAT_VIDEO_MAXIMUM_SIZE : CHAT_IMAGE_MAXIMUM_SIZE;
  const mediaKind = isVideo ? 'Video' : 'Image';
  const minimumLabel = isVideo ? '10 KiB' : '1 KiB';
  const maximumLabel = isVideo ? '50 MiB' : '10 MiB';

  if (file.size < minimumSize) {
    return `${file.name}: ${mediaKind.toLowerCase()} files must be at least ${minimumLabel}.`;
  }

  if (file.size > maximumSize) {
    return `${file.name}: ${mediaKind.toLowerCase()} files must be no larger than ${maximumLabel}.`;
  }

  return null;
}
