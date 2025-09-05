
// Enhanced API error handling with rich error information
export class ApiError extends Error {
  status: number;
  url: string;
  data?: unknown;
  
  constructor(message: string, options: { status: number; url: string; data?: unknown }) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.url = options.url;
    this.data = options.data;
  }
}

export async function safeFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  // Handle 204 No Content
  let body: any = null;
  if (response.status !== 204) {
    try {
      body = isJson ? await response.json() : await response.text();
    } catch (parseError) {
      // If JSON parsing fails, get raw text
      body = { raw: await response.text() };
    }
  }

  if (!response.ok) {
    // Preserve backend error details for debugging/UI
    throw new ApiError(`HTTP ${response.status} on ${url}`, { 
      status: response.status, 
      url, 
      data: body 
    });
  }

  return (body ?? ({} as any)) as T;
}

// Global error handler for unhandled rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason: any = event.reason;
    console.error('UNHANDLED REJECTION', {
      name: reason?.name,
      message: reason?.message,
      status: reason?.status,
      url: reason?.url,
      data: reason?.data,
      cause: reason?.cause,
      stack: reason?.stack
    });
  });
}
