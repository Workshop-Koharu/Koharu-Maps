/**
 * @koharu/maps - Standalone TypeScript/JavaScript SDK
 * Official SDK for Koharu Maps (https://map.koharu.live)
 */

export interface KoharuMapOptions {
  container: HTMLElement | string;
  center?: [number, number];
  zoom?: number;
  theme?: 'light' | 'dark';
  apiKey?: string;
  baseUrl?: string;
  autoload?: boolean;
}

export interface SearchOptions {
  limit?: number;
  center?: [number, number];
}

export interface RouteResult {
  distanceM: number;
  durationSec: number;
  durationMin: number;
  coordinates: [number, number][];
  instructions: {
    type: string;
    message: string;
    roadName: string;
    distanceM: number;
    location: [number, number];
  }[];
}

export class KoharuClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(options: { baseUrl?: string; apiKey?: string } = {}) {
    this.baseUrl = options.baseUrl || 'https://map.koharu.live';
    this.apiKey = options.apiKey || '';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    return headers;
  }

  async search(query: string, options: SearchOptions = {}) {
    let url = `${this.baseUrl}/api/v1/search?q=${encodeURIComponent(query)}`;
    if (options.limit) url += `&limit=${options.limit}`;
    if (options.center) url += `&center_lon=${options.center[0]}&center_lat=${options.center[1]}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  async reverseGeocode(lon: number, lat: number, maxDistM: number = 5000) {
    const url = `${this.baseUrl}/api/v1/reverse-geocode?lon=${lon}&lat=${lat}&max_dist_m=${maxDistM}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }

  async calculateRoute(start: [number, number] | string, target: [number, number] | string): Promise<{ status: string; route: RouteResult }> {
    const s = Array.isArray(start) ? `${start[0]},${start[1]}` : start;
    const t = Array.isArray(target) ? `${target[0]},${target[1]}` : target;
    const url = `${this.baseUrl}/api/v1/route?start=${s}&target=${t}`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return res.json();
  }
}
