/**
 * Fetch wrapper dengan Authorization header untuk authenticated requests
 * Menggunakan localStorage untuk token storage
 */
export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Get token dari localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  
  console.log(`[fetchWithAuth] ${url} - Token: ${token ? 'YES' : 'NO'}`)

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options?.headers,
    },
  })
}
