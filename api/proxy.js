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
        const fetchHeaders = { ...headers };
        delete fetchHeaders['host'];

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
            res.setHeader(key, value);
        });

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        // Pipe response body directly to client
        if (proxyRes.body) {
            proxyRes.body.pipe(res);
        } else {
            // If body is empty, just close the resource
            res.end();
        }
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}
