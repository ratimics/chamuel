import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { JournalService } from '../services/journal/journal.js';
import { CONFIG } from '../config/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const journalService = new JournalService();

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// API Routes
app.get('/api/journal/latest', async (req, res) => {
  try {
    const journal = await journalService.loadJournal();
    res.json(journal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    // Implement stats collection
    const stats = {
      messagesProcessed: 0,
      activeUsers: 0,
      uptime: process.uptime(),
      lastUpdate: new Date().toISOString()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.DASHBOARD_PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});

export { io }; // Export for use in other parts of the application