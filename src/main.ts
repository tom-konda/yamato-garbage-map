import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css'
import { Map, Popup } from 'maplibre-gl';
import risaikurusutesyonURL from '../public/risaikurusutesyon.geojson?url';
import cityDesignatedStoreURL from '../public/cityDesignatedStore.geojson?url';
import type { LngLatLike } from 'maplibre-gl';
import { MapGeoJSONFeature } from 'maplibre-gl';
import { StoreRecycleControl } from './store_recycle_control';

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
        data: risaikurusutesyonURL,
        attribution: `
          <a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">
            大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)
          </a>を一部改変（<a href="https://github.com/tom-konda/yamato-garbage-map?tab=readme-ov-file#%E5%A4%A7%E5%92%8C%E5%B8%82%E3%81%AE%E3%82%AA%E3%83%BC%E3%83%97%E3%83%B3%E3%83%87%E3%83%BC%E3%82%BF%E3%81%AE-attribution">変更の詳細</a>）`
      },
      cityDesignatedStore: {
        type: 'geojson',
        data: cityDesignatedStoreURL,
        attribution: `
          <a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">
            大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)
          </a>を一部改変（<a href="https://github.com/tom-konda/yamato-garbage-map?tab=readme-ov-file#%E5%A4%A7%E5%92%8C%E5%B8%82%E3%81%AE%E3%82%AA%E3%83%BC%E3%83%97%E3%83%B3%E3%83%87%E3%83%BC%E3%82%BF%E3%81%AE-attribution">変更の詳細</a>）`
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
      },
      {
        id: 'recycle_default',
        source: 'risaikurusutesyon',
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            ['==', ['get', '種類'], '使用済み小型家電回収ボックス'], 'blue',
            ['==', ['get', 'isPrivate'], '1'], 'skyblue',
            ['==', ['get', 'isAbandoned'], '0'], 'royalblue',
            'black',
          ],
          'circle-radius': [
            'case',
            ['==', ['get', '種類'], '拠点回収'], 7,
            ['==', ['get', '種類'], '使用済み小型家電回収ボックス'], 6,
            ['==', ['get', 'isPrivate'], '1'], 5,
            5,
          ],
        }
      },
      {
        id: 'recycle_except_private',
        source: 'risaikurusutesyon',
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        filter: [
          '!=', ['get', 'isPrivate'], '1',
        ],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            ['==', ['get', '種類'], '使用済み小型家電回収ボックス'], 'blue',
            ['==', ['get', 'isAbandoned'], '0'], 'royalblue',
            'black',
          ],
          'circle-radius': [
            'case',
            ['==', ['get', '種類'], '拠点回収'], 7,
            ['==', ['get', '種類'], '使用済み小型家電回収ボックス'], 6,
            ['==', ['get', 'isPrivate'], '1'], 5,
            5,
          ],
        }
      },
      {
        id: 'recycle_district',
        source: 'risaikurusutesyon',
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        filter: [
          '!=', '回収地区', '',
        ],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            ['==', ['get', '回収地区'], '回収地区1'], 'palevioletred',
            ['==', ['get', '回収地区'], '回収地区2'], 'firebrick',
            ['==', ['get', '回収地区'], '回収地区3'], 'coral',
            ['==', ['get', '回収地区'], '回収地区4'], 'gold',
            ['==', ['get', '回収地区'], '回収地区5'], 'chocolate',
            ['==', ['get', '回収地区'], '回収地区6'], 'mediumseagreen',
            ['==', ['get', '回収地区'], '回収地区7'], 'teal',
            ['==', ['get', '回収地区'], '回収地区8'], 'royalblue',
            ['==', ['get', '回収地区'], '回収地区9'], 'orchid',
            ['==', ['get', '回収地区'], '回収地区10'], 'hotpink',
            'black',
          ],
          'circle-radius': [
            'case',
            ['==', ['get', 'isPrivate'], '1'], 5,
            5,
          ],
        }
      },
      {
        id: 'garbage_default',
        source: 'cityDesignatedStore',
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            ['==', ['get', 'type'], '1'], 'green',
            ['==', ['get', 'type'], '2'], 'yellow',
            ['==', ['get', 'type'], '3'], 'limegreen',
            'black',
          ],
          'circle-radius': 7,
        },
      },
      {
        id: 'garbage_sitei_only',
        source: 'cityDesignatedStore',
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        filter: [
          '!=', ['get', 'type'], '1',
        ],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            ['==', ['get', 'type'], '2'], 'yellow',
            ['==', ['get', 'type'], '3'], 'limegreen',
            'black',
          ],
          'circle-radius': 7,
        },
      },
      {
        id: 'garbage_sodai_only',
        source: 'cityDesignatedStore',
        type: 'circle',
        layout: {
          visibility: 'none',
        },
        filter: [
          '!=', ['get', 'type'], '2',
        ],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'isAbandoned'], '1'], 'gray',
            ['==', ['get', 'type'], '1'], 'green',
            ['==', ['get', 'type'], '3'], 'limegreen',
            'black',
          ],
          'circle-radius': 7,
        },
      },
    ],
  }
})


const createRow = (item: string, content: Array<string|HTMLElement>) => {
  const row = document.querySelector<HTMLTemplateElement>('#table-row')?.content.cloneNode(true) as DocumentFragment;
  const headerCol = row.querySelector('th') as HTMLTableCellElement;
  headerCol.textContent = item;
  const dataCol = row.querySelector<HTMLTableCellElement>('td') as HTMLTableCellElement;
  dataCol.append(...content);
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
              'recycle_default',
              'recycle_except_private',
              'recycle_district',
              'garbage_default',
              'garbage_sitei_only',
              'garbage_sodai_only',
            ],
          }
        );
        const feature: MapGeoJSONFeature = features?.[0];
        if (!feature) {
          return;
        }
        console.log(feature)
        const popup = new Popup()
          .setLngLat((<GeoJSON.Point>feature.geometry).coordinates as LngLatLike);

        if (feature.source === 'cityDesignatedStore') {
          const template = document.querySelector<HTMLTemplateElement>('#popup-store')?.content.cloneNode(true) as DocumentFragment;
          const ruby = template?.querySelector('ruby')  as HTMLElement;

          ruby.prepend(feature.properties['名称']);
          const rt = ruby?.querySelector('rt');
          if (rt) {
            rt.textContent = feature.properties['ふりがな'];
          }

          const table = template.querySelector('table tbody') as HTMLTableSectionElement;
          let sellingProduct = '';
          switch (feature.properties['type']) {
            case '1':
              sellingProduct = '粗大ゴミ証紙';
              break;
            case '2':
              sellingProduct = '市指定ゴミ袋';
              break;
            case '3':
              sellingProduct = '市指定ゴミ袋、粗大ゴミ証紙';
              break;
          }

          const otherInfo: Array<string|HTMLElement> = [];
          if (feature.properties['type'] !== '2') {
            const link = document.createElement('a');
            link.textContent = '市のホームページ';
            link.href = `https://www.city.yamato.lg.jp/gyosei/soshik/75/gomi_recycle/kateikaraderugomi/5233.html`;
            link.target = '_blank'
            const note = document.createElement('p');
            note.append(...['し尿証紙の取り扱いに関しては、', link, 'を確認してください'])
            otherInfo.push(note);
          }
          table.append(createRow('取扱品目', [sellingProduct]));
          if ((feature.properties['その他情報'] as string).length) {
            otherInfo.push(feature.properties['その他情報']);
          }
          if (otherInfo.length) {
            table.append(createRow('その他情報', otherInfo));
          }
          popup.setDOMContent(template)
            .addTo(map);
        }
        else {
          const template = document.querySelector<HTMLTemplateElement>('#popup-recycle')?.content.cloneNode(true) as DocumentFragment;
          const caption = template?.querySelector('caption') as HTMLTableCaptionElement;
          caption.textContent = feature.properties['名称'];
          const table = template.querySelector('table tbody') as HTMLTableSectionElement;

          if (feature.properties['種類'] === '使用済み小型家電回収ボックス') {
            table.append(createRow('種類', feature.properties['種類']));
            const link = document.createElement('a');
            link.textContent = '市のホームページ';
            link.href = `https://www.city.yamato.lg.jp/gyosei/soshik/75/gomi_recycle/shigen_recycle/6759.html`;
            link.target = '_blank'
            const note = document.createElement('p');
            note.append(...[link, 'を確認してください'])
            table.append(createRow('回収品目', [note]));
          } 
          else {
            if (feature.properties['種類'] === '拠点回収') {
              table.append(createRow('種類', feature.properties['種類']));
            }
            table.append(createRow('回収品目', feature.properties['回収品目']));
            table.append(createRow('回収日', feature.properties['回収日']));
          }

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
            table.append(createRow('その他', [otherText.trim()]));
          }
          popup.setDOMContent(template)
            .addTo(map);
        }
      }
    )
    const storeRecycleControll = new StoreRecycleControl();
    map.addControl(storeRecycleControll, 'top-right');

  }
)