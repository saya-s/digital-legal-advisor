//this file starts the server and global middleware
const express = require('express');
const cors = require('cors');//call from frontend
require('dotenv').config(); //load env variables
const apiRoutes = require('./routes/api');

const app = express(); //create application instance
app.use(cors()); 
app.use(express.json()); 

// Status route health check
app.get('/api/status', (req, res) => {
  res.json({ message: "Backend is running on port 5001!" });
});

// use the routes we defined
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server spinning on port ${PORT}`));