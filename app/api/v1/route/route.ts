import { NextRequest, NextResponse } from 'next/server';
import { getMasterData } from '@/lib/global-data';
import { verifyApiKey } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  verifyApiKey(req);

  const startStr = req.nextUrl.searchParams.get('start');
  const targetStr = req.nextUrl.searchParams.get('target');

  if (!startStr || !targetStr) {
    return NextResponse.json({ status: 'error', message: '출발지(start)와 도착지(target) 좌표를 전달해주세요.' }, { status: 400 });
  }

  const [sLon, sLat] = startStr.split(',').map(Number);
  const [tLon, tLat] = targetStr.split(',').map(Number);

  if (isNaN(sLon) || isNaN(sLat) || isNaN(tLon) || isNaN(tLat)) {
    return NextResponse.json({ status: 'error', message: '좌표는 lon,lat 형식의 숫자여야 합니다.' }, { status: 400 });
  }

  const { roadGraph } = getMasterData();
  const startSnap = roadGraph.findNearestNode(sLon, sLat);
  const targetSnap = roadGraph.findNearestNode(tLon, tLat);

  if (!startSnap.nodeId || !targetSnap.nodeId || startSnap.nodeId === -1 || targetSnap.nodeId === -1) {
    return NextResponse.json({ status: 'error', message: '연결 가능한 도로망 노드를 찾을 수 없습니다.' }, { status: 404 });
  }

  const routeRes = roadGraph.aStarRoute(startSnap.nodeId, targetSnap.nodeId, true);

  if (!routeRes) {
    return NextResponse.json({ status: 'error', message: '두 지점 사이의 연결 도로 경로를 찾을 수 없습니다.' }, { status: 404 });
  }

  const startNode = roadGraph.nodes.get(startSnap.nodeId)!;
  const targetNode = roadGraph.nodes.get(targetSnap.nodeId)!;

  return NextResponse.json({
    status: 'success',
    algorithm: 'a_star',
    start: {
      query: [sLon, sLat],
      snappedNodeId: startSnap.nodeId,
      snappedNodeName: startNode.name,
      snapDistanceM: Math.round(startSnap.distM),
    },
    target: {
      query: [tLon, tLat],
      snappedNodeId: targetSnap.nodeId,
      snappedNodeName: targetNode.name,
      snapDistanceM: Math.round(targetSnap.distM),
    },
    route: routeRes,
  });
}
