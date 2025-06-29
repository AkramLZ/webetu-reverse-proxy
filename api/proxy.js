/**
 * Handle incoming requests to accept CORS
 */
export const config = {
    api: {
        bodyParser: false
    },
};

export default async function handler(req, res) {
    const { method, headers } = req;

    // Handle CORS preflight in case of OPTIONS request
    if (method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        return res.status(204).end();
    }

    const path = req.url.replace(/^\/+/, '');
    const baseUrl = 'https://api-webetu.mesrs.dz/';
    const finalUrl = baseUrl + path;

    try {
        const blockedHeaders = [
            'host',
            'content-length',
            'content-encoding',
            'transfer-encoding',
            'connection',
        ];

        const fetchHeaders = Object.fromEntries(
            Object.entries(headers).filter(
                ([key]) => !blockedHeaders.includes(key.toLowerCase())
            )
        );

        const proxyRes = await fetch(finalUrl, {
            method,
            headers: fetchHeaders,
            body: ['GET', 'HEAD'].includes(method)
                ? undefined
                : req,
            duplex: 'half'
        });

        res.status(proxyRes.status);
        proxyRes.headers.forEach((value, key) => {
            if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'transfer-encoding') {
                res.setHeader(key, value);
            }
        });

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        const buffer = Buffer.from(await proxyRes.arrayBuffer());
        res.end(buffer);
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}
