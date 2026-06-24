export interface UploadedFile {
  id: string;
  url: string;
  filename: string;
  mimetype: string;
  size: string;
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const token = localStorage.getItem("sunday_access_token");
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:3000/api/upload-file", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? "File upload failed");
  }

  const data = await response.json();
  return data.data as UploadedFile;
}