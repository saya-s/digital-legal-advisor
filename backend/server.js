// Main backend entry point: creates the Express app, registers global middleware,
// mounts API routes, serves the built frontend when available, and starts listening.
const express = require('express');
// Allow the frontend to call this backend from a different origin during development/use.
const cors = require('cors');
// File-system checks are used to see whether a production frontend build exists.
const fs = require('fs');
const path = require('path');
// Load environment variables from .env before reading PORT, HOST, API keys, etc.
require('dotenv').config();
// Central API router containing the app's backend endpoints.
const apiRoutes = require('./routes/api');

// Create the Express application instance used for all middleware and routes.
const app = express();
// Expected location of the compiled React frontend build.
const frontendBuildPath = path.join(__dirname, '../frontend/build');
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

// Enable cross-origin requests and JSON request-body parsing for API routes.
app.use(cors());
app.use(express.json());

// Simple health-check route used to confirm the backend is up and responding.
app.get('/api/status', (req, res) => {
  res.json({ message: `Backend is running on port ${process.env.PORT || 5001}!` });
});

// Mount the application's main API endpoints under /api.
app.use('/api', apiRoutes);

// If a production frontend build exists, serve it from the same Express server.
if (fs.existsSync(frontendBuildPath)) {
  // Serve static JS/CSS/assets from the frontend build folder.
  app.use(express.static(frontendBuildPath));

  // For non-API routes, return index.html so client-side routing works after refresh.
  app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  // In development or incomplete deployments, warn instead of crashing if no build exists.
  console.warn(`Frontend build not found at ${frontendBuildPath}`);
}

// Read host/port from env with local defaults so the app can run in different environments.
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

// Start the HTTP server and log the address for quick confirmation.
app.listen(PORT, HOST, () => {
  console.log(`Server spinning on http://${HOST}:${PORT}`);
});
