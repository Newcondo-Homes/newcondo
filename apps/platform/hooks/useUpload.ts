'use client';

import { useCallback } from 'react';

export function useUpload() {
  const uploadFile = useCallback(async (formData: FormData): Promise<string> => {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    return data.url as string;
  }, []);

  return { uploadFile };
}