/**
 * Fetch wrapper dengan credentials untuk authenticated requests
 * Automatically includes cookies dalam setiap request
 */
export async function fetchWithAuth(
  url: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
}
