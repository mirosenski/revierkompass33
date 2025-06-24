export async function typedFetch<T>(input: RequestInfo, init?: RequestInit, timeout = 8000): Promise<T> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeout);
  const res = await fetch(input, { ...init, signal: ctrl.signal });
  clearTimeout(to);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
} 