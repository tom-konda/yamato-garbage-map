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
        minzoom: 16,
        paint: {
          'circle-color': 'skyblue',
        }
      },
      {
        id: 'siteigimitoriatukai',
        source: 'siteigimitoriatukai',
        type: 'circle',
        paint: {
          'circle-color': 'yellow',
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
          popup.setHTML(`<p>${feature.properties['名称']}</p>`)
          .addTo(map);
        }
      }
    )
  }
)