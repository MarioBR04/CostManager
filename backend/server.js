const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/financials', require('./routes/financials'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('CostManager API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
