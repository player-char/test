// Just trying to fix this ffmpeg-binaries installation bug:
// npm ERR! enoent ENOENT: no such file or directory, chmod '/opt/app-root/src/node_modules/ffmpeg-binaries/bin/ffmpeg'
// npm ERR! enoent ENOENT: no such file or directory, chmod '/opt/app-root/src/node_modules/ffmpeg-binaries/bin/ffmpeg'


const zlib = require('zlib');
const tar = require('tar');
const http = require('https');

function callback(res) {
  res
    .pipe(zlib.createGunzip())
    .pipe(tar.Extract({ path: '/opt/app-root/src/node_modules/.bin/'}));
}

if (process.platform === 'win32') {
  http.get('https://raw.githubusercontent.com/Hackzzila/node-ffmpeg-binaries/master/windows.tar.gz', callback);
} else if (process.platform === 'linux') {
  http.get('https://raw.githubusercontent.com/Hackzzila/node-ffmpeg-binaries/master/linux.tar.gz', callback);
} else if (process.platform === 'darwin') {
  http.get('https://raw.githubusercontent.com/Hackzzila/node-ffmpeg-binaries/master/darwin.tar.gz', callback);
} else {
  throw new Error('unsupported platform');
}
