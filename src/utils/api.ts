/**
 * Centralized API base URL resolver and HTTP helpers for MedMitra.
 * 
 * Rules:
 * 1. Configurable via VITE_API_BASE_URL.
 * 2. In local development, defaults to:
 *    VITE_API_BASE_URL=http://localhost:5000
 * 3. In Google AI Studio / remote preview:
 *    - If an explicit public HTTPS backend URL is configured, uses it.
 *    - If VITE_API_BASE_URL is localhost:5000 (which is unreachable from a public HTTPS page),
 *      uses the publicly reachable deployed container backend on the same origin.
 * 4. Provides checkApiHealth() to verify connection to GET ${VITE_API_BASE_URL}/api/health.
 */

export function isLocalhostEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local')
  );
}

export function isRemotePreviewWithLocalhostConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const isLocal = isLocalhostEnvironment();
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  return !isLocal && Boolean(envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1')));
}

export function getApiBaseUrl(): string {
  const isBrowser = typeof window !== 'undefined' && Boolean(window.location);
  const isLocalhost = isLocalhostEnvironment();

  // Check explicit environment variable (VITE_API_BASE_URL)
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

  // If running in remote browser environment (e.g. Google AI Studio *.run.app)
  if (isBrowser && !isLocalhost) {
    // If an explicit publicly reachable remote backend URL is provided (not localhost), use it
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl.replace(/\/+$/, '');
    }
    // Remote preview: localhost:5000 on user's machine cannot be reached from a public HTTPS webpage.
    // Automatically use the actual publicly reachable backend on the current deployed origin.
    return '';
  }

  // In local development:
  if (envUrl && envUrl.length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  // Local development default: backend runs on port 5000
  if (isBrowser && isLocalhost) {
    return 'http://localhost:5000';
  }

  return '';
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

export interface HealthCheckResult {
  connected: boolean;
  status?: string;
  message?: string;
  url: string;
  isRemotePreview: boolean;
  isLocalhostTargetOnRemote: boolean;
  error?: string;
}

/**
 * Health check verification calling GET ${VITE_API_BASE_URL}/api/health
 */
export async function checkApiHealth(): Promise<HealthCheckResult> {
  const url = getApiUrl('/api/health');
  const isRemote = !isLocalhostEnvironment();
  const isMismatch = isRemotePreviewWithLocalhostConfigured();

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    const rawText = await res.text().catch(() => '');
    let data: any = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }

    if (res.ok && data && (data.success === true || data.status === 'ok')) {
      return {
        connected: true,
        status: 'ok',
        message: data.message || 'MedMitra backend is running',
        url,
        isRemotePreview: isRemote,
        isLocalhostTargetOnRemote: isMismatch,
      };
    }

    return {
      connected: false,
      url,
      isRemotePreview: isRemote,
      isLocalhostTargetOnRemote: isMismatch,
      error: data?.message || `Server returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      connected: false,
      url,
      isRemotePreview: isRemote,
      isLocalhostTargetOnRemote: isMismatch,
      error: err?.message || 'Network connection failed',
    };
  }
}

/**
 * Robust fetch wrapper that safely extracts backend JSON or human-readable HTTP errors.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = getApiUrl(endpoint);

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    credentials: options.credentials || 'include',
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch (netErr: any) {
    const isRemote = !isLocalhostEnvironment();
    const isMismatch = isRemotePreviewWithLocalhostConfigured();
    const errorMsg = isMismatch
      ? `Remote preview (${window.location.origin}) cannot reach http://localhost:5000 on your private computer. Please run the frontend locally or set a public HTTPS backend URL in VITE_API_BASE_URL.`
      : (netErr?.message?.includes('Failed to fetch') || netErr?.name === 'TypeError'
        ? `Unable to connect to server at ${url}. Please ensure the backend is running and CORS is configured.`
        : (netErr?.message || 'Network communication error.'));
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = { message: `Invalid JSON response from server (HTTP ${res.status}).` };
    }
  } else {
    const rawText = await res.text().catch(() => '');
    data = {
      message: `Server returned non-JSON response (HTTP ${res.status} ${res.statusText}).`,
      details: rawText.slice(0, 300),
    };
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}
