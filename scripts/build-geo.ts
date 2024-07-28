import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import https from 'https';
import zlib from 'zlib';
import tar from 'tar';

if (process.env.VERCEL) {
  console.log('Vercel environment detected. Skipping geo setup.');
  process.exit(0);
}

const db = 'GeoLite2-City';

let url = `https://raw.githubusercontent.com/GitSquared/node-geolite2-redist/master/redist/${db}.tar.gz`;

if (process.env.MAXMIND_LICENSE_KEY) {
  url =
    `https://download.maxmind.com/app/geoip_download` +
    `?edition_id=${db}&license_key=${process.env.MAXMIND_LICENSE_KEY}&suffix=tar.gz`;
}

const dest = path.resolve(process.cwd(), './geo');

if (!fs.existsSync(dest)) {
  fs.mkdirSync(dest);
}

const download = (url: string): Promise<NodeJS.WritableStream> =>
  new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.pipe(zlib.createGunzip({})).pipe(tar.t()));
    });
  });

download(url).then(
  (res) =>
    new Promise<void>((resolve, reject) => {
      res.on('entry', (entry) => {
        if (entry.path.endsWith('.mmdb')) {
          const filename = path.join(dest, path.basename(entry.path));
          entry.pipe(fs.createWriteStream(filename));

          console.log('Saved geo database:', filename);
        }
      });

      res.on('error', (e) => {
        reject(e);
      });
      res.on('finish', () => {
        resolve();
      });
    })
);
