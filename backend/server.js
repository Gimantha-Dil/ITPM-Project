const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const kuppiRoutes = require('./routes/kuppiRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const fileRoutes = require('./routes/fileRoutes');

const Note = require('./models/Note');
const KuppiSession = require('./models/KuppiSession');
const User = require('./models/User');

const app = express();

// Middleware — allow file:// and localhost
app.use(cors({
  origin: (origin, callback) => callback(null, true), // allow ALL origins including file://
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/kuppi', kuppiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/files', fileRoutes);

// Live Viewer — set token from URL param (for cross-origin use)
app.get('/api/live-token', (req, res) => {
  // Returns current valid users list for Live Viewer auth
  res.json({ message: 'Use your login token in Authorization header' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SLIIT Learning Platform API is running' });
});

// ══════════════════════════════════════════
// REST snapshot — all DB data
// ══════════════════════════════════════════
app.get('/api/db-snapshot', async (req, res) => {
  try {
    const [notes, sessions, users] = await Promise.all([
      Note.find({ isActive: true }).populate('seller', 'fullName').select('title category price views downloads createdAt seller subject description').lean(),
      KuppiSession.find({ isActive: true }).populate('host', 'fullName').select('title category price sessionType date enrollments host createdAt').lean(),
      User.find().select('fullName email role createdAt bankName').lean()
    ]);
    res.json({ notes, sessions, users, fetchedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ message: 'Snapshot failed', error: e.message });
  }
});

// ══════════════════════════════════════════
// SSE — MongoDB Real-Time Change Stream
// ══════════════════════════════════════════
app.get('/api/changes', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Initial snapshot
  try {
    const [notes, sessions, users] = await Promise.all([
      Note.find({ isActive: true }).populate('seller', 'fullName').select('title category price views downloads createdAt seller subject').lean(),
      KuppiSession.find({ isActive: true }).populate('host', 'fullName').select('title category price sessionType date enrollments host createdAt').lean(),
      User.find().select('fullName email role createdAt bankName').lean()
    ]);
    sendEvent({ type: 'snapshot', timestamp: new Date().toISOString(), data: { notes, sessions, users } });
  } catch (e) { console.error('Snapshot error:', e); }

  // Watch collections
  const noteStream    = Note.watch([], { fullDocument: 'updateLookup' });
  const sessionStream = KuppiSession.watch([], { fullDocument: 'updateLookup' });
  const userStream    = User.watch([], { fullDocument: 'updateLookup' });

  const opMap = { insert: 'CREATE', update: 'UPDATE', replace: 'UPDATE', delete: 'DELETE' };

  const handleChange = (collection) => (change) => {
    sendEvent({
      type: 'change',
      collection,
      operation: opMap[change.operationType] || change.operationType,
      timestamp: new Date().toISOString(),
      documentId: change.documentKey?._id,
      document: change.fullDocument || null
    });
  };

  noteStream.on('change',    handleChange('notes'));
  sessionStream.on('change', handleChange('sessions'));
  userStream.on('change',    handleChange('users'));

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    noteStream.close();
    sessionStream.close();
    userStream.close();
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
console.log(' Connecting to MongoDB...');

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  family: 4
})
  .then(() => {
    console.log(' MongoDB connected successfully');
    app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;