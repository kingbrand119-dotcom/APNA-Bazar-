
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new Error(errorData.error || 'Server error');
  }

  return response.json();
}
