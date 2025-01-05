export interface HttpClientPort {
  get<T>(url: string, params?: unknown): Promise<T>

  put<T>(url: string, data?: unknown): Promise<T>
}

class Http implements HttpClientPort {
  async apiRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    url: string,
    params: Record<string, string>
  ): Promise<T> {
    const searchParams = new URLSearchParams(params)

    const fullUrl = Object.keys(params).length ? `${url}?${searchParams.toString()}` : url

    const response = await fetch(fullUrl, { method })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const { data } = await response.json()
    return data
  }

  async get<T>(url: string, params: Record<string, string> = {}): Promise<T> {
    return this.apiRequest('GET', url, params)
  }

  async put<T>(url: string, data: Record<string, string>): Promise<T> {
    return this.apiRequest('PUT', url, data)
  }
}

export const http = new Http()
