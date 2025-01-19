
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

window.addEventListener('load', loadPrompts);
