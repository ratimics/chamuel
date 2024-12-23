import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

// Initialize OpenAI Client
const openai = new OpenAI({
  baseURL: process.env.OPENAI_API_URL,
  apiKey: process.env.OPENAI_API_KEY
});

// Helper to clean and extract DSL from LLM response
function extractDSL(response) {
  // Match content enclosed in backticks
  const match = response.match(/```[\s\S]*?```/);
  if (match) {
    // Remove the backticks and return the clean DSL content
    return match[0].replace(/```/g, '').trim();
  }
  // Fallback: Return the entire response if no backticks are found
  return response.trim();
}

// Function to generate KG script from markdown content
async function generateKGScript(markdownContent) {
  const prompt = `
You are an AI assistant skilled in generating Knowledge Graph (KG) scripts.
Given the following markdown content, extract the key entities (nodes) and relationships.
Only output the DSL script in the following structure (no additional commentary):

NODE <type> "<name>" {
  description: "<description>"
}

RELATIONSHIP "<source>" -> "<target>" [<attributes>] {
  context: "<context>"
}

Markdown Content:
${markdownContent}

Generate the KG script:
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });

  // Extract clean DSL from the response
  return extractDSL(response.choices[0].message.content);
}

// Function to process a single markdown file
async function processMarkdownFile(filePath) {
  try {
    const markdownContent = await fs.readFile(filePath, 'utf-8');
    const kgScript = await generateKGScript(markdownContent);

    // Define output file path
    const outputFilePath = filePath.replace(/\.md$/, '.kg.dsl');

    // Save the cleaned DSL content to the output file
    await fs.writeFile(outputFilePath, kgScript);
    console.log(`Generated KG script: ${outputFilePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

// Function to process all markdown files in a directory
async function processMarkdownDirectory(directoryPath) {
  try {
    const files = await fs.readdir(directoryPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));

    for (const file of markdownFiles) {
      const filePath = path.join(directoryPath, file);
      await processMarkdownFile(filePath);
    }
    console.log('KG script generation complete for all files.');
  } catch (error) {
    console.error('Error processing markdown directory:', error);
  }
}

// Main Script Execution
(async () => {
  const markdownDirectory = './memories'; // Path to your markdown dataset directory
  await processMarkdownDirectory(markdownDirectory);
})();
