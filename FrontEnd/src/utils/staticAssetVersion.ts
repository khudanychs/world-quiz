declare const __STATIC_DATA_VERSION__: string;

function getStaticDataVersion(): string {
  const configured = import.meta.env.VITE_STATIC_DATA_VERSION;
  if (typeof configured === "string" && configured.trim()) {
    return configured.trim();
  }
  return __STATIC_DATA_VERSION__;
}

export function withStaticDataVersion(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}v=${encodeURIComponent(getStaticDataVersion())}`;
}

export async function fetchStaticJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(withStaticDataVersion(path), {
    cache: "no-store",
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path} (HTTP ${response.status})`);
  }

  return (await response.json()) as T;
}
