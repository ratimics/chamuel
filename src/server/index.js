import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { JournalService } from '../services/journal/journal.js';
import { promptManager } from '../services/prompts/promptManager.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const journalService = new JournalService();

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// API Routes
app.get('/api/memories', async (req, res) => {
  try {
    const memoryDir = './memories';
    const files = await fs.readdir(memoryDir);
    const memories = [];
    
    for (const file of files) {
      if (file.startsWith('memory_') && file.endsWith('.md')) {
        const content = await fs.readFile(path.join(memoryDir, file), 'utf-8');
        const date = file.replace('memory_', '').replace('.md', '');
        memories.push({
          date,
          content
        });
      }
    }
    
    // Sort by date descending (newest first)
    memories.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(memories);
  } catch (error) {
    console.error('Error loading memories:', error);
    res.status(500).json({ error: 'Failed to load memories' });
  }
});

app.get('/api/journal/latest', async (req, res) => {
  try {
    const journal = await journalService.loadJournal();
    res.json(journal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Prompt management endpoints
app.get('/api/prompts', async (req, res) => {
  try {
    const prompts = await promptManager.loadPrompts();
    const promptsObject = Object.fromEntries(prompts);
    res.json(promptsObject);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prompts/:type', express.json(), async (req, res) => {
  try {
    const { type } = req.params;
    const { content } = req.body;
    await promptManager.savePrompt(type, content);
    res.json({ success: true });
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
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {
      messagesProcessed: await MessageService.getMessageCount(),
      activeUsers: await ChannelManager.getActiveUsersCount(),
      uptime: process.uptime()
    };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/journal/latest', async (req, res) => {
  try {
    const journal = await JournalService.getLatestJournal();
    res.json(journal);
  } catch (error) {
    console.error('Error fetching journal:', error);
    res.status(500).json({ error: 'Failed to fetch journal' });
  }
});

const PORT = process.env.DASHBOARD_PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Dashboard running on http://0.0.0.0:${PORT}`);
});

export { io }; // Export for use in other parts of the application