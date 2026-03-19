export interface NominatimConfig {
  endpoint: string
  userAgent: string
}

export interface NominatimClient {
  search(query: string, countryCode: string): Promise<any[]>
  reverse(lat: number, lon: number): Promise<any>
}

export function createNominatimClient(config: NominatimConfig): NominatimClient {
  const { endpoint, userAgent } = config

  async function request(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  return {
    async search(query: string, countryCode: string): Promise<any[]> {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: countryCode,
      })
      return request(`${endpoint}/search?${params}`)
    },

    async reverse(lat: number, lon: number): Promise<any> {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'json',
        addressdetails: '1',
      })
      return request(`${endpoint}/reverse?${params}`)
    },
  }
}
