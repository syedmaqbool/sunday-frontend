import { authInstance } from '@/services/ky.instance';

export interface UploadedFile {
  id: string;
  filename: string;
  mimetype: string;
  size: string;
  url: string;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const data = await authInstance
    .post('/api/upload-file', { body: formData })
    .json<{ data: UploadedFile }>();
  return data.data as UploadedFile;
}
