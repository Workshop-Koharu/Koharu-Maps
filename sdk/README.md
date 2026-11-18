# @koharu/maps SDK

Zero-Dependency Standalone Vector Map & Navigation Client SDK.  
공식 엔드포인트: `https://map.koharu.live`

## 1. 브라우저 스크립트 방식 (HTML)

```html
<div id="map" style="width: 100%; height: 500px;"></div>

<!-- Koharu Maps Standalone SDK 로드 -->
<script src="https://map.koharu.live/sdk/koharu-maps.js"></script>
<script>
  const map = new KoharuMap({
    container: 'map',
    center: [126.9784, 37.5663], // 서울 중심
    zoom: 13,
    theme: 'light',
    apiKey: 'YOUR_FREE_API_KEY' // 발급처: https://map.koharu.live/developer
  });

  // 핀 마커 추가
  map.addMarker({ lon: 126.9784, lat: 37.5663, title: '서울시청', color: '#2563eb' });

  // 검색
  map.client.search('강남역').then(res => console.log(res.results));
</script>
```

## 2. 모듈 번들러 방식 (React / Next.js / Node.js)

```typescript
import { KoharuClient } from '@koharu/maps';

const client = new KoharuClient({
  baseUrl: 'https://map.koharu.live',
  apiKey: 'kmap_live_...'
});

// A* 최단 경로 탐색
const route = await client.calculateRoute([126.9768, 37.5750], [127.0280, 37.4980]);
console.log(route.route.instructions);
```
