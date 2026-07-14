export function getContentTypeFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'mp4') return 'video/mp4';
  if (ext === 'mov') return 'video/quicktime';
  if (ext === 'avi') return 'video/x-msvideo';
  if (ext === 'webm') return 'video/webm';
  
  return 'application/octet-stream';
}
