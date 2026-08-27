// SERVER-SIDE ONLY — never import this in client components or pages

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Ensure .env.local is configured.`);
  }
  return value;
}

function getApiBase(): string {
  return `${requireEnv('WORDPRESS_URL').replace(/\/$/, '')}/wp-json/wc/v3`;
}

function getWpBase(): string {
  return `${requireEnv('WORDPRESS_URL').replace(/\/$/, '')}/wp-json/wp/v2`;
}

function buildAuthHeader(): string {
  const key = requireEnv('WC_CONSUMER_KEY');
  const secret = requireEnv('WC_CONSUMER_SECRET');
  return `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`;
}

function buildWpAuthHeader(): string {
  const username = requireEnv('WP_USERNAME');
  const appPassword = requireEnv('WP_APPLICATION_PASSWORD');
  return `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`;
}

export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export interface WCApiError {
  status: number;
  body: { code?: string; message?: string; data?: { status?: number } };
}

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  let url = `${base}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    const qstr = qs.toString();
    if (qstr) url += `?${qstr}`;
  }
  return url;
}

async function doFetch(url: string, options: FetchOptions): Promise<Response> {
  const { method = 'GET', body } = options;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorBody: WCApiError['body'] = { code: 'UNKNOWN', message: response.statusText };
    try {
      errorBody = await response.json();
    } catch {
      // keep default
    }
    throw { status: response.status, body: errorBody } as WCApiError;
  }

  return response;
}

// Returns parsed JSON — use for all standard calls
export async function wcFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = buildUrl(getApiBase(), path, options.params);
  const response = await doFetch(url, options);
  return response.json() as Promise<T>;
}

// Returns raw Response — use when you need X-WP-Total / X-WP-TotalPages headers
export async function wcFetchRaw(path: string, options: FetchOptions = {}): Promise<Response> {
  const url = buildUrl(getApiBase(), path, options.params);
  return doFetch(url, options);
}

// WordPress REST API (wp/v2) — used for Media Library uploads
// Uses WordPress Application Password (WC API keys don't work with wp/v2)
export async function wpFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const url = buildUrl(getWpBase(), path, options.params);

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: buildWpAuthHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorBody: WCApiError['body'] = { code: 'UNKNOWN', message: response.statusText };
    try {
      errorBody = await response.json();
    } catch {
      // keep default
    }
    throw { status: response.status, body: errorBody } as WCApiError;
  }

  return response.json() as Promise<T>;
}

// WordPress REST API raw response — used for binary media uploads
// Uses WordPress Application Password (WC API keys don't work with wp/v2)
export async function wpFetchRaw(
  path: string,
  options: {
    method?: string;
    rawBody: BodyInit;
    contentType: string;
    filename?: string;
    params?: Record<string, string | number | boolean | undefined | null>;
  },
): Promise<Response> {
  const { method = 'POST', rawBody, contentType, filename } = options;
  const url = buildUrl(getWpBase(), path, options.params);

  const headers: Record<string, string> = {
    Authorization: buildWpAuthHeader(),
    'Content-Type': contentType,
    Accept: 'application/json',
  };

  if (filename) {
    // Sanitise filename before sending in header
    const safe = filename.replace(/[^\w.\-]/g, '-').substring(0, 100);
    headers['Content-Disposition'] = `attachment; filename="${safe}"`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: rawBody,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorBody: WCApiError['body'] = { code: 'UNKNOWN', message: response.statusText };
    try {
      errorBody = await response.json();
    } catch {
      // keep default
    }
    throw { status: response.status, body: errorBody } as WCApiError;
  }

  return response;
}
