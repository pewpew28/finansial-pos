export async function posGasPost(gasUrl: string, action: string, payload: object): Promise<void> {
  if (!gasUrl) return;
  try {
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
  } catch {
    // silent fail on no-cors
  }
}

export async function uploadImageToGDrive(
  gasUrl: string,
  base64: string,
  filename: string
): Promise<string> {
  if (!gasUrl) throw new Error('GAS URL belum diset');
  const response = await fetch(gasUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'uploadImage', filename, base64 }),
  });
  const data = await response.json();
  if (!data.url) throw new Error('Upload gagal: ' + (data.error || 'Unknown'));
  return data.url as string;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
