import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export interface UploadedFile {
  id: string;
  filename: string;
  mimetype: string;
  size: string;
  url: string;
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return authInstance
    .post('/api/upload-file', { body: formData })
    .json<Response<UploadedFile>>();
}
