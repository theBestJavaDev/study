// State management
let sources = [];

const sourceTextInput = document.getElementById('sourceTextInput');
const addSourceBtn = document.getElementById('addSourceBtn');
const sourcesList = document.getElementById('sourcesList');
const fileInput = document.getElementById('fileInput');
const outputContainer = document.getElementById('outputContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const apiKeyInput = document.getElementById('apiKeyInput');

// Add text source
addSourceBtn.addEventListener('click', () => {
    const text = sourceTextInput.value.trim();
    if (!text) return;
    
    sources.push({ name: `Note Source ${sources.length + 1}`, content: text });
    sourceTextInput.value = '';
    renderSources();
});

// Handle file uploads
fileInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    for (let file of files) {
        const text = await file.text();
        sources.push({ name: file.name, content: text });
    }
    renderSources();
});

function renderSources() {
    sourcesList.innerHTML = '';
    sources.forEach((source, index) => {
        const div = document.createElement('div');
        div.className = 'source-item';
        div.innerHTML = `
            <span>📄 ${source.name}</span>
            <small>${source.content.length} chars</small>
        `;
        sourcesList.appendChild(div);
    });
}

// AI Synthesis Actions
document.querySelectorAll('.synth-btn').forEach(button => {
    button.addEventListener('click', async () => {
        const action = button.getAttribute('data-action');
        if (sources.length === 0) {
            alert('Please add at least one source note or file first!');
            return;
        }

        const combinedContext = sources.map(s => `Source (${s.name}):\n${s.content}`).join('\n\n');
        const apiKey = apiKeyInput.value.trim();

        loadingIndicator.classList.remove('hidden');
        outputContainer.innerHTML = '';

        try {
            let resultText = '';
            
            if (apiKey) {
                // Call Gemini API directly from browser if API key provided
                resultText = await callGeminiAPI(apiKey, action, combinedContext);
            } else {
                // Simulated fallback if no API key entered yet
                await new Promise(resolve => setTimeout(resolve, 1200));
                resultText = generateMockSynthesis(action, combinedContext);
            }

            outputContainer.innerHTML = `<h3>Generated ${action.toUpperCase()}</h3><br>` + formatOutput(resultText);
        } catch (error) {
            outputContainer.innerHTML = `<p style="color: red;">Error generating response: ${error.message}</p>`;
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    });
});

async function callGeminiAPI(apiKey, action, context) {
    const promptMap = {
        summary: "Synthesize a comprehensive, clean study guide with bullet points based on the following sources:",
        flashcards: "Create 5-10 study flashcards (Question & Answer pairs) based on the following sources:",
        quiz: "Create a 5-question multiple choice quiz with answer keys based on the following sources:"
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${promptMap[action]}\n\n${context}` }]
            }]
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.candidates[0].content.parts[0].text;
}

function generateMockSynthesis(action, context) {
    if (action === 'summary') {
        return `**Mock Study Guide (Tip: Enter your Gemini API key above for live AI synthesis!):**\n\n- Key themes extracted from your ${sources.length} source(s).\n- Total characters analyzed: ${context.length}.\n- Core concepts emphasize structured learning and revision.`;
    } else if (action === 'flashcards') {
        return `**Mock Flashcards:**\n\n1. **Q:** What is the primary topic of the uploaded notes?\n   **A:** Custom study workflow sources.\n2. **Q:** How is this hosted?\n   **A:** Via GitHub Pages!`;
    } else {
        return `**Mock Quiz:**\n\n1. Which platform hosts this static web app?\n   - A) GitHub Pages (Correct)\n   - B) Local server only`;
    }
}

function formatOutput(text) {
    return `<div style="white-space: pre-wrap; font-size: 0.95rem;">${text}</div>`;
}
