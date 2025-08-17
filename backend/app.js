import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import providerRoutes from './routes/providerRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// app.get('/health', (_req, res) => res.json({ ok: true, service: 'home-service-api' }));
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'home-service-api' });
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/providers', providerRoutes);

// 404
// app.use((req, res) => res.status(404).json({ message: 'Not Found' }));
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});


// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});


export default app;