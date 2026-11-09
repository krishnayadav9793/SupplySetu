const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message?: string }> {
  const token = localStorage.getItem('supplysetu-auth-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token is invalid or expired - trigger unauthorized redirect to login
      localStorage.removeItem('supplysetu-auth-token');
      localStorage.removeItem('supplysetu-auth-user');
      window.dispatchEvent(new CustomEvent('supplysetu:unauthorized'));
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${response.statusText}`);
  }

  return response.json();
}
