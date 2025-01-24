
async function loadPrompts() {
  const response = await fetch('/api/prompts');
  const prompts = await response.json();
  
  Object.entries(prompts).forEach(([type, content]) => {
    const textarea = document.getElementById(`${type}Prompt`);
    if (textarea) {
      textarea.value = content;
    }
  });
}

async function savePrompt(type) {
  const textarea = document.getElementById(`${type}Prompt`);
  const content = textarea.value;

  try {
    const response = await fetch(`/api/prompts/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content })
    });
    
    const result = await response.json();
    if (result.success) {
      alert(`${type} prompt saved successfully!`);
    }
  } catch (error) {
    alert(`Error saving ${type} prompt: ${error.message}`);
  }
}

async function loadMemories() {
  try {
    const response = await fetch('/api/memories');
    const memories = await response.json();
    
    const memoriesList = document.getElementById('memoriesList');
    memoriesList.innerHTML = memories.map(memory => `
      <div class="memory-item">
        <div class="memory-date">${memory.date}</div>
        ${memory.content}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading memories:', error);
  }
}

window.addEventListener('load', () => {
  loadPrompts();
  loadMemories();
});
