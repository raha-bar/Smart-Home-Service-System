const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
// In future steps, add these:
// const serviceRoutes = require('./routes/serviceRoutes');
// const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Connect user API routes
app.use('/api/users', userRoutes);
// For later steps, uncomment when files exist:
// app.use('/api/services', serviceRoutes);
// app.use('/api/bookings', bookingRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

module.exports = app;