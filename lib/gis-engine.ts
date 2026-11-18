/**
 * Koharu Maps - Standalone GIS & Mathematical Cartographic Engine
 * Pure TypeScript implementation of spatial calculations, projection, topological routing and geocoding.
 * Zero external GIS library dependencies.
 */

export const WGS84_A = 6378137.0; // semi-major axis in meters
export const MERCATOR_MAX_LAT = 85.0511287798066;
export const ORIGIN_SHIFT = Math.PI * WGS84_A;
export const TILE_SIZE = 256;

export function clampLat(lat: number): number {
  return Math.max(-MERCATOR_MAX_LAT, Math.min(MERCATOR_MAX_LAT, lat));
}

export function wrapLon(lon: number): number {
  while (lon > 180.0) lon -= 360.0;
  while (lon < -180.0) lon += 360.0;
  return lon;
}

export function wgs84ToWebMercator(lon: number, lat: number): [number, number] {
  lon = wrapLon(lon);
  lat = clampLat(lat);
  const x = (lon * ORIGIN_SHIFT) / 180.0;
  const latRad = (lat * Math.PI) / 180.0;
  const y = Math.log(Math.tan(Math.PI / 4.0 + latRad / 2.0)) * WGS84_A;
  return [x, y];
}

export function webMercatorToWgs84(x: number, y: number): [number, number] {
  const lon = (x / ORIGIN_SHIFT) * 180.0;
  const latRad = 2.0 * Math.atan(Math.exp(y / WGS84_A)) - Math.PI / 2.0;
  const lat = (latRad * 180.0) / Math.PI;
  return [wrapLon(lon), clampLat(lat)];
}

export function lonLatToPixel(lon: number, lat: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const x = ((wrapLon(lon) + 180.0) / 360.0) * n * TILE_SIZE;
  const latRad = (clampLat(lat) * Math.PI) / 180.0;
  const y = (1.0 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2.0 * n * TILE_SIZE;
  return [x, y];
}

export function pixelToLonLat(px: number, py: number, zoom: number): [number, number] {
  const n = Math.pow(2, zoom);
  const totalPx = n * TILE_SIZE;
  const lon = (px / totalPx) * 360.0 - 180.0;
  const latRad = Math.atan(Math.sinh(Math.PI * (1.0 - (2.0 * py) / totalPx)));
  const lat = (latRad * 180.0) / Math.PI;
  return [wrapLon(lon), clampLat(lat)];
}

export function haversineDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const phi1 = (lat1 * Math.PI) / 180.0;
  const phi2 = (lat2 * Math.PI) / 180.0;
  const dphi = ((lat2 - lat1) * Math.PI) / 180.0;
  const dlam = ((lon2 - lon1) * Math.PI) / 180.0;

  const a = Math.sin(dphi / 2.0) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2.0) ** 2;
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return WGS84_A * c;
}

export function initialBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const phi1 = (lat1 * Math.PI) / 180.0;
  const phi2 = (lat2 * Math.PI) / 180.0;
  const dlam = ((lon2 - lon1) * Math.PI) / 180.0;

  const y = Math.sin(dlam) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dlam);
  const bearingRad = Math.atan2(y, x);
  return ((bearingRad * 180.0) / Math.PI + 360.0) % 360.0;
}

export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}

export interface MapFeature {
  id: string | number;
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
  layer: 'water' | 'green' | 'road' | 'building' | 'place' | 'boundary' | 'continent';
  coordinates: any;
  properties: Record<string, any>;
  minZoom?: number;
  maxZoom?: number;
}

// Road Graph for A* Navigation
export interface RoadNode {
  id: number;
  lon: number;
  lat: number;
  name: string;
}

export interface RoadEdge {
  id: number;
  fromNode: number;
  toNode: number;
  distanceM: number;
  travelTimeSec: number;
  roadName: string;
  roadType: string;
  speedKmh: number;
  oneway: boolean;
  geometry: [number, number][];
}

export class RoadGraph {
  nodes: Map<number, RoadNode> = new Map();
  adj: Map<number, RoadEdge[]> = new Map();
  edgeCounter = 0;

  addNode(id: number, lon: number, lat: number, name: string = ''): RoadNode {
    const node = { id, lon, lat, name };
    this.nodes.set(id, node);
    if (!this.adj.has(id)) this.adj.set(id, []);
    return node;
  }

  addEdge(
    fromNode: number,
    toNode: number,
    roadName: string,
    roadType: string = 'primary',
    speedKmh: number = 60,
    oneway: boolean = false,
    geometry?: [number, number][]
  ): void {
    const n1 = this.nodes.get(fromNode);
    const n2 = this.nodes.get(toNode);
    if (!n1 || !n2) return;

    const dist = haversineDistance(n1.lon, n1.lat, n2.lon, n2.lat);
    const timeSec = (dist / 1000.0) / (speedKmh / 3600.0);
    const geom: [number, number][] = geometry || [[n1.lon, n1.lat], [n2.lon, n2.lat]];

    this.edgeCounter++;
    const edge: RoadEdge = {
      id: this.edgeCounter,
      fromNode,
      toNode,
      distanceM: dist,
      travelTimeSec: timeSec,
      roadName,
      roadType,
      speedKmh,
      oneway,
      geometry: geom,
    };
    this.adj.get(fromNode)!.push(edge);

    if (!oneway) {
      this.edgeCounter++;
      this.adj.get(toNode)!.push({
        id: this.edgeCounter,
        fromNode: toNode,
        toNode: fromNode,
        distanceM: dist,
        travelTimeSec: timeSec,
        roadName,
        roadType,
        speedKmh,
        oneway,
        geometry: [...geom].reverse(),
      });
    }
  }

  findNearestNode(lon: number, lat: number): { nodeId: number; distM: number } {
    let bestId = -1;
    let minDist = Infinity;
    this.nodes.forEach(node => {
      const d = haversineDistance(lon, lat, node.lon, node.lat);
      if (d < minDist) {
        minDist = d;
        bestId = node.id;
      }
    });
    return { nodeId: bestId, distM: minDist };
  }

  aStarRoute(startId: number, targetId: number, weightByTime: boolean = true) {
    if (!this.nodes.has(startId) || !this.nodes.has(targetId)) return null;
    const targetNode = this.nodes.get(targetId)!;

    const gScore = new Map<number, number>();
    const cameFrom = new Map<number, { prevId: number; edge: RoadEdge }>();
    const openSet = new Set<number>([startId]);

    this.nodes.forEach(n => gScore.set(n.id, Infinity));
    gScore.set(startId, 0);

    const fScore = (id: number) => {
      const g = gScore.get(id) || Infinity;
      const n = this.nodes.get(id)!;
      const hDist = haversineDistance(n.lon, n.lat, targetNode.lon, targetNode.lat);
      const h = weightByTime ? hDist / 30.5 : hDist;
      return g + h;
    };

    while (openSet.size > 0) {
      let current = -1;
      let lowestF = Infinity;
      openSet.forEach(id => {
        const f = fScore(id);
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      });

      if (current === targetId) {
        // Reconstruct path
        const pathEdges: RoadEdge[] = [];
        let curr = targetId;
        while (curr !== startId) {
          const step = cameFrom.get(curr);
          if (!step) break;
          pathEdges.push(step.edge);
          curr = step.prevId;
        }
        pathEdges.reverse();

        let totalDist = 0;
        let totalTime = 0;
        const coords: [number, number][] = [];

        pathEdges.forEach((edge, idx) => {
          totalDist += edge.distanceM;
          totalTime += edge.travelTimeSec;
          if (idx === 0) coords.push(...edge.geometry);
          else coords.push(...edge.geometry.slice(1));
        });

        // Generate Turn instructions
        const instructions = this._generateInstructions(pathEdges);

        return {
          distanceM: Math.round(totalDist),
          durationSec: Math.round(totalTime),
          durationMin: Math.max(1, Math.round(totalTime / 60.0)),
          coordinates: coords,
          instructions,
        };
      }

      openSet.delete(current);

      const edges = this.adj.get(current) || [];
      for (const edge of edges) {
        const neighbor = edge.toNode;
        const cost = weightByTime ? edge.travelTimeSec : edge.distanceM;
        const tentativeG = (gScore.get(current) || 0) + cost;

        if (tentativeG < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, { prevId: current, edge });
          gScore.set(neighbor, tentativeG);
          openSet.add(neighbor);
        }
      }
    }

    return null;
  }

  private _generateInstructions(edges: RoadEdge[]) {
    if (edges.length === 0) return [];
    const instructions = [];
    const firstNode = this.nodes.get(edges[0].fromNode)!;

    instructions.push({
      type: 'depart',
      message: `${edges[0].roadName} 방면으로 출발합니다.`,
      roadName: edges[0].roadName,
      distanceM: Math.round(edges[0].distanceM),
      location: [firstNode.lon, firstNode.lat],
    });

    let currentRoad = edges[0].roadName;

    for (let i = 0; i < edges.length - 1; i++) {
      const e1 = edges[i];
      const e2 = edges[i + 1];
      const nPrev = this.nodes.get(e1.fromNode)!;
      const nMid = this.nodes.get(e1.toNode)!;
      const nNext = this.nodes.get(e2.toNode)!;

      const b1 = initialBearing(nPrev.lon, nPrev.lat, nMid.lon, nMid.lat);
      const b2 = initialBearing(nMid.lon, nMid.lat, nNext.lon, nNext.lat);
      const diff = (b2 - b1 + 360.0) % 360.0;

      let action = 'straight';
      let msg = `${e2.roadName} 방면으로 계속 직진하세요.`;

      if (diff >= 30 && diff < 140) {
        action = 'turn-right';
        msg = `${e2.roadName} 방면으로 우회전입니다.`;
      } else if (diff >= 220 && diff <= 330) {
        action = 'turn-left';
        msg = `${e2.roadName} 방면으로 좌회전입니다.`;
      } else if (diff >= 140 && diff < 220) {
        action = 'u-turn';
        msg = '유턴입니다.';
      }

      if (action !== 'straight' || e2.roadName !== currentRoad) {
        instructions.push({
          type: action,
          message: msg,
          roadName: e2.roadName,
          distanceM: Math.round(e2.distanceM),
          location: [nMid.lon, nMid.lat],
        });
        currentRoad = e2.roadName;
      }
    }

    const lastNode = this.nodes.get(edges[edges.length - 1].toNode)!;
    instructions.push({
      type: 'arrive',
      message: '목적지에 도착했습니다.',
      roadName: edges[edges.length - 1].roadName,
      distanceM: 0,
      location: [lastNode.lon, lastNode.lat],
    });

    return instructions;
  }
}
