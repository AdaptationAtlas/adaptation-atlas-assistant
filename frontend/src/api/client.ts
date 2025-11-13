const TOKEN_STORAGE_KEY = 'atlas_assistant_token';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || '//localhost:8000') {
    this.baseUrl = baseUrl;
    this.token = this.getStoredToken();
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private storeToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.token = token;
  }

  private removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.token = null;
  }

  setToken(token: string): void {
    this.storeToken(token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken(): void {
    this.removeToken();
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  async fetch<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized by clearing token
    if (response.status === 401) {
      this.clearToken();
      throw new Error('Unauthorized - please login again');
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage: string;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.detail || errorJson.message || response.statusText;
      } catch {
        errorMessage = errorText || response.statusText;
      }
      throw new Error(`API Error (${response.status}): ${errorMessage}`);
    }

    // Return response for streaming endpoints
    return response as T;
  }


  async fetchJSON<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.fetch<Response>(endpoint, options);
    return response.json();
  }


  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: RequestInit = {},
  ): Promise<T> {
    return this.fetchJSON<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }


  async get<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    return this.fetchJSON<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * Make a form data POST request (for OAuth2 login)
   */
  async postForm<T = unknown>(
    endpoint: string,
    formData: Record<string, string>,
    options: RequestInit = {},
  ): Promise<T> {
    const body = new URLSearchParams(formData);
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/x-www-form-urlencoded');

    return this.fetchJSON<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: body.toString(),
    });
  }
}

// Create a default client instance
export const apiClient = new ApiClient();
