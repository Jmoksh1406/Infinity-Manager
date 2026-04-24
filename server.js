const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.resolve(__dirname, 'public');
const ADMIN_KEY = process.env.ADMIN_KEY || 'infinityturningxc32026';

app.use(express.json());
app.use(cors());
app.use(express.static(PUBLIC_DIR)); // Serve frontend

// Serve admin page at /admin (requires ?key=ADMIN_KEY)
app.get('/admin', (req, res) => {
    if (req.query.key !== ADMIN_KEY) {
        return res.status(403).send('<h1>Access Denied</h1><p>Invalid or missing admin key.</p><a href="/">Go Back</a>');
    }
    const adminPath = path.resolve(PUBLIC_DIR, 'admin.html');
    fs.readFile(adminPath, 'utf8', (err, html) => {
        if (err) {
            console.error('Error serving admin.html:', err.message);
            return res.status(500).send('Error loading admin page.');
        }
        res.type('html').send(html);
    });
});

// Get rounds data
app.get('/api/rounds', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

// Redirect safely
app.get('/api/go/:id', (req, res) => {
    const id = parseInt(req.params.id);
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read data' });
        try {
            const rounds = JSON.parse(data);
            const round = rounds.find(r => r.id === id);
            if (!round) return res.status(404).send('Round not found.');
            if (round.locked) return res.status(403).send('<h1>Access Denied</h1><p>This round is currently locked. Please wait for the admin to unlock it.</p><a href="/">Go Back</a>');
            res.redirect(round.url);
        } catch (e) {
            res.status(500).json({ error: 'Invalid data format' });
        }
    });
});

const LOG_FILE = path.join(__dirname, 'logs.json');

// Log student access
app.post('/api/log-access', (req, res) => {
    const { name, email, roundId } = req.body;
    const logEntry = { name, email, roundId, time: new Date().toISOString() };
    
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
        let logs = [];
        if (!err && data) {
            try { logs = JSON.parse(data); } catch (e) {}
        }
        logs.push(logEntry);
        fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), () => {
            res.json({ success: true });
        });
    });
});

// Update rounds (requires admin key)
app.post('/api/update', (req, res) => {
    if (req.headers['x-admin-key'] !== ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid or missing admin key.' });
    }
    const { rounds } = req.body;
    
    fs.writeFile(DATA_FILE, JSON.stringify(rounds, null, 2), (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save data' });
        res.json({ success: true });
    });
});

// Global error handler — prevents server crashes
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Only listen when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;

