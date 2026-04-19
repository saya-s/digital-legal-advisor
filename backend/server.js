//this file starts the server and global middleware
const express = require('express');
const cors = require('cors');//call from frontend
const fs = require('fs');
const path = require('path');
require('dotenv').config(); //load env variables
const apiRoutes = require('./routes/api');

const app = express(); //create application instance
const frontendBuildPath = path.join(__dirname, '../frontend/build');
const frontendIndexPath = path.join(frontendBuildPath, 'index.html');

app.use(cors()); 
app.use(express.json()); 

// Status route health check
app.get('/api/status', (req, res) => {
  res.json({ message: `Backend is running on port ${process.env.PORT || 5001}!` });
});

// use the routes we defined
app.use('/api', apiRoutes);

if (fs.existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));

  app.get(/^(?!\/api(?:\/|$)).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
} else {
  console.warn(`Frontend build not found at ${frontendBuildPath}`);
}


const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server spinning on http://${HOST}:${PORT}`);
});
