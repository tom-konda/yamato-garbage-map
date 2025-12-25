import './style.css'
import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Popup } from 'maplibre-gl';
import risaikurusutesyonURL from '../public/risaikurusutesyon.geojson?url';
import cityDesignatedStoreURL from '../public/cityDesignatedStore.geojson?url';
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
        data: risaikurusutesyonURL,
        attribution: `
          <a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">
            大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)
          </a>を一部改変（<a href="https://github.com/tom-konda/yamato-garbage-map">変更の詳細</a>）`
      },
      cityDesignatedStore: {
        type: 'geojson',
        data: cityDesignatedStoreURL,
        attribution: `
          <a href="https://www.city.yamato.lg.jp/gyosei/soshik/11/digitalservice/opendata/5154.html">
            大和市公開型地図情報サービスに掲載されている地点情報データ一覧(オープンデータ)
          </a>を一部改変（<a href="https://github.com/tom-konda/yamato-garbage-map">変更の詳細</a>）`
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
        id: 'cityDesignatedStore',
        source: 'cityDesignatedStore',
        type: 'circle',
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
        }
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
              'risaikurusutesyon',
              'cityDesignatedStore',
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
          const template = document.querySelector<HTMLTemplateElement>('#popup-store')?.content.cloneNode(true) as DocumentFragment;
          const ruby = template?.querySelector('ruby')  as HTMLElement;

          ruby.prepend(feature.properties['名称']);
          const rt = ruby?.querySelector('rt');
          if (rt) {
            rt.textContent = feature.properties['ふりがな'];
          }

          const table = template.querySelector('table') as HTMLTableElement
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
          const table = template.querySelector('table') as HTMLTableElement

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
  }
)