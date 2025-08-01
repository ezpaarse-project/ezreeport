export function b64toBlob(
  b64Data: string,
  contentType = '',
  sliceSize = 512
): Blob {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = Array.from(slice).map(
      (char) => char.codePointAt(0) ?? 0
    );

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement('a');
  link.style.display = 'none';

  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;

  link.addEventListener('click', () => {
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      link.remove();
    }, 1000);
  });

  document.body.append(link);
  link.click();
}
