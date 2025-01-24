
const socket = io();
let currentChannel = 'x';

// DOM Elements
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const channels = document.querySelectorAll('.channel');
const currentChannelLabel = document.querySelector('.current-channel');

// Channel switching
channels.forEach(channel => {
    channel.addEventListener('click', () => {
        // Update active channel
        channels.forEach(c => c.classList.remove('active'));
        channel.classList.add('active');
        
        // Update current channel
        currentChannel = channel.dataset.channel;
        currentChannelLabel.textContent = currentChannel.charAt(0).toUpperCase() + currentChannel.slice(1);
        
        // Clear messages and load channel messages
        messagesContainer.innerHTML = '';
        loadChannelMessages(currentChannel);
    });
});

// Send message
function sendMessage() {
    const content = messageInput.value.trim();
    if (content) {
        socket.emit('chat message', {
            channel: currentChannel,
            content,
            timestamp: new Date(),
            author: 'User'
        });
        messageInput.value = '';
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Receive message
socket.on('chat message', (msg) => {
    if (msg.channel === currentChannel) {
        appendMessage(msg);
    }
});

function appendMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div class="author">${msg.author}</div>
        <div class="content">${msg.content}</div>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function loadChannelMessages(channel) {
    // Fetch channel messages from server
    socket.emit('get channel messages', channel);
}

socket.on('channel messages', (messages) => {
    messagesContainer.innerHTML = '';
    messages.forEach(appendMessage);
});

// Connect event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    loadChannelMessages(currentChannel);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
