import './style.css'
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Popup } from 'maplibre-gl';
import type { LngLatLike } from 'maplibre-gl';

const map = new Map({
  container: 'map',
  center: [139.461389, 35.47],
  maxBounds: [
    // South West
    {lat: 35.415, lng: 139.42},
    // North East
    {lat: 35.530, lng: 139.49},
  ],
  zoom: 15,
  style: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org">OpenStreetMap contributors</a>',
      },
      risaikurusutesyon: {
        type: 'geojson',
        data: './public/risaikurusutesyon.geojson',
        attribution: '<a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)</a>を一部改変'
      },
      siteigimitoriatukai: {
        type: 'geojson',
        data: './public/siteigimitoriatukai.geojson',
        attribution: '<a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)</a>を一部改変'
      },
      sodaigomisyousitoriatukaiten: {
        type: 'geojson',
        data: './public/sodaigomisyousitoriatukaiten.geojson',
        attribution: '<a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)</a>を一部改変'
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
      {
        id: 'risaikurusutesyon',
        source: 'risaikurusutesyon',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', '種類'], '使用済み小型家電回収ボックス'], 'navy',
            ['==', ['get', 'isAbandoned'], '0'], 'skyblue',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            'black',
          ],
        }
      },
      {
        id: 'siteigimitoriatukai',
        source: 'siteigimitoriatukai',
        type: 'circle',
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '0'], 'yellow',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            'black',
          ],
          'circle-radius': 7,
        }
      },
      {
        id: 'sodaigomisyousitoriatukaiten',
        source: 'sodaigomisyousitoriatukaiten',
        type: 'circle',
        paint: {
          'circle-color': 'green',
          'circle-radius': 7,
        }
      },
    ],
  }
})


const createRow = (item: string, content: string) => {
  const row = document.querySelector<HTMLTemplateElement>('#table-row')?.content.cloneNode(true)as DocumentFragment;
  const firstRow = row.querySelector('th') as HTMLTableCellElement;
  firstRow.textContent = item;
  const lastRow = row.querySelector<HTMLTableCellElement>('td') as HTMLTableCellElement;
  lastRow.textContent = content;
  row.append(firstRow, lastRow);
  return row;
}

map.on(
  'load',
  () => {
    map.on(
      'click',
      (e) => {
        const features = map.queryRenderedFeatures(
          e.point,
          {
            layers: [
              'risaikurusutesyon',
              'siteigimitoriatukai',
              'sodaigomisyousitoriatukaiten',
            ],
          }
        );
        const feature = features?.[0];
        if (!feature) {
          return;
        }
        console.log(feature)
        const popup = new Popup()
          .setLngLat((<GeoJSON.Point>feature.geometry).coordinates as LngLatLike);

        if (feature.source !== 'risaikurusutesyon') {
          const template = document.querySelector<HTMLTemplateElement>('#popup-shop')?.content.cloneNode(true) as DocumentFragment;
          const ruby = template?.querySelector('ruby');
          if (template && ruby) {
            ruby.prepend(feature.properties['名称']);
            const rt = ruby?.querySelector('rt');
            if (rt) {
              rt.textContent = feature.properties['ふりがな'];
            }
            if ((feature.properties['その他情報'] as string).length) {
              const misc = document.createElement('div');
              misc.insertAdjacentHTML('beforeend', feature.properties['その他情報']);
              template?.firstElementChild?.append(misc);
            }
            popup.setDOMContent(template)
              .addTo(map);
          }
        }
        else {
          const template = document.querySelector<HTMLTemplateElement>('#popup-recycle')?.content.cloneNode(true) as DocumentFragment;
          const caption = template?.querySelector('caption');
          if (template && caption) {
            caption.textContent = feature.properties['名称'];
            const table = template.querySelector('table') as HTMLTableElement
            table.append(createRow('回収品目', feature.properties['回収品目']));
            table.append(createRow('回収日', feature.properties['回収日']));
            let otherText = '';
            if (feature.properties['その他情報'].length) {
              otherText = feature.properties['その他情報'];
            }
            if (!/^\d{3}-.+?-\d+$/.test(feature.properties['コメント'])) {
              otherText += '\n';
              let comment = (<string>feature.properties['コメント']).replace(/^\d{3}-.+?-\d+/, '');
              if (comment.startsWith('、')) {
                comment = comment.substring(1);
              }
              otherText += comment.trim();
            }
            if (otherText.length) {
              table.append(createRow('その他', otherText.trim()));
            }
            popup.setDOMContent(template)
              .addTo(map);
          }
        }
      }
    )
  }
)