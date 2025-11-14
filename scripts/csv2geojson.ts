import { globSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { parse as CSVParse } from 'csv-parse/sync';
import { resolve, parse } from 'node:path';
import proj4 from 'proj4'

const paths = globSync('./resources/*.csv').sort().reverse();

/**
 * @see https://qiita.com/takahi/items/85732f577820d8f76b3e
 */
proj4.defs([
  [
    'EPSG:4301',
    '+proj=longlat +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +no_defs'
  ]
]);

let cityDesignatedStoreList:Array<Record<string, any>> = [];
let sodaiList:Array<string> = [];

const createDesignatedStoreList = (name:string, row:Record<string, string>) => {
  /*
  * 名寄せアルゴリズム
  * 1. ふりがなを正規化する（スペース、有限会社、株式会社）
  * 2. 粗大ゴミ証紙店の読みと項番を記録
  * 3. 指定ゴミ袋取扱店の読みと粗大ゴミ証紙店の読みを比較し同じなら、同一店舗として扱う
  * 4. 同一扱いの時、名前は指定ゴミ袋、緯度経度は粗大ゴミで扱う。コメントはマージ
  * 5. 粗大ゴミで登録したデータを上書きする
  */
  const {緯度: lat, 経度: lng, ...metaData} = row;
  metaData['isAbandoned'] = '0';

  const latLng = {
    lat,
    lng,
  }
  const epsg4326LonLat = proj4(
    'EPSG:4301',
    'EPSG:4326',
    [
        Number(latLng.lng),
        Number(latLng.lat),
    ]
  );
  metaData['normalizedKana'] = metaData['ふりがな'];
  metaData['normalizedKana'] = metaData['normalizedKana'].replaceAll(/[　| ]/g, '');
  metaData['normalizedKana'] = metaData['normalizedKana'].replaceAll(/(ゆうげん|かぶしき)がいしゃ/g, '');
  if (name === 'sodaigomisyousitoriatukaiten') {
    if (metaData['その他情報'].includes('廃業')) {
      metaData['isAbandoned'] = '1';
    }
    metaData['type'] = '1';
    sodaiList.push(metaData['normalizedKana']);

    cityDesignatedStoreList.push({
      'type': 'Feature',
      'properties': {
        ...metaData,
      },
      'geometry': {
        'type': 'Point',
        'coordinates': epsg4326LonLat,
      },
    });
  }
  else {
    if (sodaiList.includes(metaData['normalizedKana'])) {
      const sameKanaIndex = sodaiList.indexOf(metaData['normalizedKana']);
      const sodaiRow = cityDesignatedStoreList.at(sameKanaIndex);
      if (sodaiRow) {
        sodaiRow['properties']['type'] = '3';
        sodaiRow['properties']['名称'] = metaData['名称'];
        if (metaData['その他情報'].includes('廃業') && sodaiRow['properties']['isAbandoned'] !== '1') {
          sodaiRow['properties']['isAbandoned'] = '1';
        }
        if (sodaiRow['properties']['その他情報'].length) {
          sodaiRow['properties']['その他情報'] += ('\n' + metaData['その他情報']).trim();
        }
        else {
          sodaiRow['properties']['その他情報'] = (metaData['その他情報']).trim();
        }
        cityDesignatedStoreList.with(sameKanaIndex, sodaiRow);
      }
    }
    else {
      metaData['type'] = '2';
      if (metaData['その他情報'].includes('廃業')) {
        metaData['isAbandoned'] = '1';
      }

      cityDesignatedStoreList.push({
        'type': 'Feature',
        'properties': {
          ...metaData,
        },
        'geometry': {
          'type': 'Point',
          'coordinates': epsg4326LonLat,
        },
      });
    }
  }
}

await Promise.all(
  paths.map(
    async path => {
      const fullPath = resolve(path);
      const { name } = parse(fullPath);
      const file = await readFile(fullPath);
      
      const decoder = new TextDecoder('shift_jis');
      const decodedText = decoder.decode(file);

      const geoJSON: {type: string, features: unknown[], name: string} = {
        'type': 'FeatureCollection',
        name,
        'features': [],
      };
      
      const result = CSVParse<Record<string, string>>(
        decodedText,
        {
          columns: true,
          group_columns_by_name: true,
        },
      );

      result.forEach(row => {
        const {緯度: lat, 経度: lng, ...metaData} = row;

        if (name === 'risaikurusutesyon') {
          metaData['回収日'] = metaData['回収日'].replaceAll(/<br>/ig, '\n');
          metaData['その他情報'] = metaData['その他情報'].replaceAll(/<br>/ig, '\n');
          metaData['コメント'] = metaData['コメント'].replaceAll(/<br>/ig, '\n');
          metaData['isAbandoned'] = '0';
          if (metaData['その他情報'].includes('廃止')) {
            metaData['isAbandoned'] = '1';
          }
          else if (metaData['コメント'].includes('廃止')) {
            metaData['isAbandoned'] = '1';
          }
          metaData['isPrivate'] = '0';
          if (/の専用。?$/.test(metaData['その他情報'])) {
            metaData['isPrivate'] = '1';
          }
          const latLng = {
            lat,
            lng,
          }
          const epsg4326LonLat = proj4(
            'EPSG:4301',
            'EPSG:4326',
            [
                Number(latLng.lng),
                Number(latLng.lat),
            ]
          );
          const point = {
            'type': 'Feature',
            'properties': {
              ...metaData,
            },
            'geometry': {
              'type': 'Point',
              'coordinates': epsg4326LonLat,
            },
          };
          geoJSON.features.push(point);
        }
        else {
          createDesignatedStoreList(name, row);
        }
      });
      // console.log(decoder.decode(file));
      if (name === 'risaikurusutesyon') {
        const outputFullPath = resolve(`./public/${name}.geojson`);
        return writeFile(outputFullPath, JSON.stringify(geoJSON, null, 2));
      }
    }
  )
)

await writeFile(
  resolve(`./public/cityDesignatedStore.geojson`),
  JSON.stringify(
    {
        'type': 'FeatureCollection',
        'name': 'cityDesignatedStoreList',
        'features': cityDesignatedStoreList,
    }, null, 2
  )
)