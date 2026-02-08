/**
 * Fetch wrapper dengan Authorization header untuk authenticated requests
 * Menggunakan localStorage untuk token storage
 * Automatically handles Content-Type - skips it for FormData
 */
export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  // Get token dari localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  
  console.log(`[fetchWithAuth] ${url} - Token: ${token ? 'YES' : 'NO'}`)

  // Check if body is FormData (don't set Content-Type for FormData, let browser handle it)
  const isFormData = options?.body instanceof FormData
  console.log(`[fetchWithAuth] ${url} - FormData: ${isFormData}`)

  const headers: Record<string, string> = {}

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Only set Content-Type if NOT FormData
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  // Merge with custom headers from options
  if (options?.headers) {
    const customHeaders = options.headers as Record<string, string>
    Object.assign(headers, customHeaders)
  }

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })
}
