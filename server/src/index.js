// Local development server (Vercel uses /api/index.js instead).
const path = require('path');
const express = require('express');
const app = require('./app');
const env = require('./config/env');

const dist = path.join(__dirname, '../../client/dist');
app.use(express.static(dist));
app.get('*', (req, res, next) => (req.path.startsWith('/api') ? next() : res.sendFile(path.join(dist, 'index.html'))));

app.listen(env.port, () => console.log(`API listening on http://localhost:${env.port}`));
