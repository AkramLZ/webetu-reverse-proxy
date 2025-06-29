/**
 * Handle incoming requests to accept CORS
 */
import getRawBody from 'raw-body';

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
        // Filter out problematic headers
        const blockedHeaders = [
            'host',
            'content-length',
            'content-encoding',
            'transfer-encoding',
            'connection',
            'accept-encoding'
        ];

        const fetchHeaders = Object.fromEntries(
            Object.entries(headers).filter(
                ([key]) => !blockedHeaders.includes(key.toLowerCase())
            )
        );

        // Read request body (for POST/PUT/etc.)
        const requestBody = ['GET', 'HEAD'].includes(method)
            ? undefined
            : await getRawBody(req);

        // Perform the proxy fetch
        const proxyRes = await fetch(finalUrl, {
            method,
            headers: fetchHeaders,
            body: requestBody,
        });

        // Forward status and headers
        res.status(proxyRes.status);
        proxyRes.headers.forEach((value, key) => {
            if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
                res.setHeader(key, value);
            }
        });

        // Add CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        // Buffer the full response and send it
        const responseBuffer = Buffer.from(await proxyRes.arrayBuffer());
        res.setHeader('Content-Length', responseBuffer.length);
        res.end(responseBuffer);
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}
