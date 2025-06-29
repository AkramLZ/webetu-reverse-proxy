/**
 * Handle incoming requests to accept CORS
 */
export default async function handler(req, res) {
    const { url, method, headers, body } = req;

    const path = req.url.replace(/^\/+/, '');
    const baseUrl = 'https://api-webetu.mesrs.dz/';
    const finalUrl = baseUrl + path;

    try {
        const proxyRes = await fetch(finalUrl, {
            method,
            headers: {
                ...headers,
                host: new URL(baseUrl).host,
            },
            body: ['GET', 'HEAD'].includes(method) ? undefined : req.body,
        });

        res.status(proxyRes.status);
        for (const [key, value] of proxyRes.headers.entries()) {
            res.setHeader(key, value);
        }

        // To bypass CORS, we have to spoof headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');

        const data = await proxyRes.arrayBuffer();
        res.send(Buffer.from(data));
    } catch (err) {
        console.error('Proxy error:', err);
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}