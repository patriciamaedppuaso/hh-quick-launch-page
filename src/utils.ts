export function domainOf(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

export function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return trimmed.slice(0, 2);
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function brandLogoSources(url: string): string[] {
  try {
    const domain = new URL(normalizeUrl(url)).hostname;
    if (!domain) return [];
    return [
      `https://logo.clearbit.com/${domain}?size=128`,
      `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
    ];
  } catch {
    return [];
  }
}

export function openTarget(url: string, isFile?: boolean, fileName?: string): void {
  if (!url) return;
  if (isFile) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
