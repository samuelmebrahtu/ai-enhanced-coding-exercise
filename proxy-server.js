const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Proxy all requests to LMStudio
const lmStudioProxy = createProxyMiddleware({
  target: 'http://localhost:1234',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '', // Remove /api prefix when forwarding
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Proxying request to LMStudio:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received response from LMStudio:', proxyRes.statusCode);
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy Error: ' + err.message);
  }
});

app.use('/api', lmStudioProxy);

// Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Forwarding requests from http://localhost:${PORT}/api to http://localhost:1234`);
});
