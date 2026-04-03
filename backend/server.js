const express = require('express');
const cors = require('cors');
require('dotenv').config();
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors()); 
app.use(express.json()); 

// Status route stays here for quick health checks
app.get('/api/status', (req, res) => {
  res.json({ message: "Backend is running on port 5001!" });
});

// Use the routes we defined
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server spinning on port ${PORT}`));