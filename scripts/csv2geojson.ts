import { globSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { parse as CSVParse } from 'csv-parse/sync';
import { resolve, parse } from 'node:path';
import proj4 from 'proj4'

const paths = globSync('./resources/*.csv');
proj4.defs([
    ["EPSG:4301",
        "+proj=longlat +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +no_defs"
    ]
]);

Promise.all(
  paths.map(
    async path => {
      const fullPath = resolve(path);
      const { name } = parse(fullPath);
      const file = await readFile(fullPath);
      
      const decoder = new TextDecoder('shift_jis');
      const decodedText = decoder.decode(file);

      const geoJSON: {type: string, features: any[], name: string} = {
        "type": "FeatureCollection",
        name,
        "features": [],
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

        if (name === 'siteigimitoriatukai') {
          metaData['isAbandoned'] = '0';
          if (metaData['その他情報'].includes('廃業')) {
            metaData['isAbandoned'] = '1';
          }
        }
        else if (name === 'risaikurusutesyon') {
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
          "type": "Feature",
          "properties": {
            ...metaData,
          },
          "geometry": {
            "type": "Point",
            "coordinates": epsg4326LonLat,
          },
        };
        geoJSON.features.push(point);
      });
      // console.log(decoder.decode(file));
      const outputFullPath = resolve(`./public/${name}.geojson`);
      return writeFile(outputFullPath, JSON.stringify(geoJSON, null, 2));
    }
  )
)