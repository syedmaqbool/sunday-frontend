import type { UploadedFile } from '@/types/profile.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function getUploadedFileUrl(uploadedFile: UploadedFile): string {
  if ('url' in uploadedFile)
    return uploadedFile.url;

  throw new Error('The uploaded file response did not include a URL.');
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return authInstance
    .post('/api/upload-file', { body: formData })
    .json<Response<UploadedFile>>();
}
