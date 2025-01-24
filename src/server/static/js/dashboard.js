const socket = io();
const statusElement = document.getElementById('status');
const journalContent = document.querySelector('#journal .journal-content');
const statsContent = document.querySelector('#stats .stats-content');
const messageFeed = document.querySelector('#messages .feed-content');

// Socket event handlers
socket.on('connect', () => {
  statusElement.textContent = 'Connected';
  statusElement.style.backgroundColor = '#27ae60';
});

socket.on('disconnect', () => {
  statusElement.textContent = 'Disconnected';
  statusElement.style.backgroundColor = '#c0392b';
});

socket.on('message', (message) => {
  appendToFeed(messageFeed, message);
});

// API calls
async function fetchJournal() {
  try {
    const response = await fetch('/api/journal/latest');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const journal = await response.json();
    displayJournal(journal);
  } catch (error) {
    console.error('Error fetching journal:', error);
    journalContent.innerHTML = '<p class="error">Failed to load journal data</p>';
  }
}

async function fetchStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const stats = await response.json();
    displayStats(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    statsContent.innerHTML = '<p class="error">Failed to load stats data</p>';
  }
}

// Display functions
function displayJournal(journal) {
  journalContent.innerHTML = `
    <div class="journal-entry">
      <p>Last Updated: ${new Date(journal.timestamp).toLocaleString()}</p>
      <p>Entries: ${journal.entries.length}</p>
      ${journal.entries.slice(-5).map(entry => `
        <div class="entry">
          <small>${new Date(entry.timestamp).toLocaleString()}</small>
          <p>${entry.content}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function displayStats(stats) {
  statsContent.innerHTML = `
    <div class="stat-item">
      <label>Messages Processed:</label>
      <span>${stats.messagesProcessed}</span>
    </div>
    <div class="stat-item">
      <label>Active Users:</label>
      <span>${stats.activeUsers}</span>
    </div>
    <div class="stat-item">
      <label>Uptime:</label>
      <span>${formatUptime(stats.uptime)}</span>
    </div>
  `;
}

function appendToFeed(feedElement, message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'feed-item';
  messageDiv.innerHTML = `
    <small>${new Date(message.timestamp).toLocaleString()}</small>
    <p><strong>${message.user}:</strong> ${message.text}</p>
  `;
  feedElement.insertBefore(messageDiv, feedElement.firstChild);
  
  // Keep only last 50 messages
  while (feedElement.children.length > 50) {
    feedElement.removeChild(feedElement.lastChild);
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

// Initial load
fetchJournal();
fetchStats();

// Refresh data periodically
setInterval(fetchStats, 30000);
setInterval(fetchJournal, 60000);