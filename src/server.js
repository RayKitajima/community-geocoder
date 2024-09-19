/*
CSISシンプルジオコーディング実験 コンパチブルインターフェース

# Request:

http://localhost:8000/cgi-bin/simple_geocode.cgi?addr=東京都新宿区西新宿２丁目８−１

# Response:

<results>
<query>東京都新宿区西新宿２丁目８−１</query>
<geodetic>wgs1984</geodetic>
<iConf>4</iConf>
<converted>東京都新宿区西新宿２丁目８−</converted>
<candidate>
<address>東京都/新宿区/西新宿二丁目//</address>
<longitude>139.691774</longitude>
<latitude>35.68945</latitude>
<iLvl>3</iLvl>
</candidate>
</results>

*/

const http = require('http');
const url = require('url');
const { geocodeAddress } = require('./geocoding');

const PORT = process.env.PORT || 8000;

/**
 * Escapes special XML characters in a string.
 *
 * @param {string} unsafe - The string to escape.
 * @returns {string} - The escaped string.
 */
const escapeXml = (unsafe) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    const endpoint = '/cgi-bin/simple_geocode.cgi';

    if (pathname === endpoint && req.method === 'GET') {
        const addrEncoded = query.addr;

        if (!addrEncoded) {
            res.writeHead(400, { 'Content-Type': 'application/xml' });
            const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<results>
  <error>Missing 'addr' query parameter.</error>
</results>`;
            res.end(errorXml);
            return;
        }

        const addr = decodeURIComponent(addrEncoded);

        try {
            const geocodeResult = await geocodeAddress(addr);

            const converted = addr.slice(0, -1);
            const iConf = 4;
            const iLvl = geocodeResult.level;

            const responseXml = `<?xml version="1.0" encoding="UTF-8"?>
<results>
  <query>${escapeXml(addr)}</query>
  <geodetic>wgs1984</geodetic>
  <iConf>${iConf}</iConf>
  <converted>${escapeXml(converted)}</converted>
  <candidate>
    <address>${escapeXml(`${geocodeResult.pref}/${geocodeResult.city}/${geocodeResult.town}/${geocodeResult.chome || ''}/${geocodeResult.banchi || ''}`)}</address>
    <longitude>${geocodeResult.lng}</longitude>
    <latitude>${geocodeResult.lat}</latitude>
    <iLvl>${iLvl}</iLvl>
  </candidate>
</results>`;

            res.writeHead(200, { 'Content-Type': 'application/xml' });
            res.end(responseXml);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/xml' });
            const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<results>
  <error>${escapeXml(error.message)}</error>
</results>`;
            res.end(errorXml);
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/xml' });
        const notFoundXml = `<?xml version="1.0" encoding="UTF-8"?>
<results>
  <error>Not Found</error>
</results>`;
        res.end(notFoundXml);
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
