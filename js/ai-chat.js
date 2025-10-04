// js/ai-chat.js

function initAiChat() {
    const API_URL = "https://restless-fire-59dc.thehaykal219.workers.dev";
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const submitButton = chatForm.querySelector('button');
    const modelSelector = document.getElementById('model-selector');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmChangeBtn = document.getElementById('confirm-change-btn');
    const cancelChangeBtn = document.getElementById('cancel-change-btn');
    
    // Check if elements exist before proceeding
    if (!chatContainer || !chatForm) return;

    let messages = [];
    let currentModel = modelSelector.value;
    let isFirstMessage = true;

    chatForm.addEventListener('submit', handleFormSubmit);
    modelSelector.addEventListener('change', handleModelChange);
    confirmChangeBtn.addEventListener('click', confirmModelChange);
    cancelChangeBtn.addEventListener('click', cancelModelChange);

    if (isFirstMessage) {
        appendSystemMessage('Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!');
        isFirstMessage = false;
    }

    function handleModelChange() {
        if (messages.length === 0) { confirmModelChange(); return; }
        confirmationModal.style.display = 'flex';
    }

    function confirmModelChange() {
        messages = [];
        chatContainer.innerHTML = '';
        const modelName = modelSelector.options[modelSelector.selectedIndex].text;
        appendSystemMessage(`Model diubah ke ${modelName}. Percakapan dimulai ulang.`);
        userInput.focus();
        currentModel = modelSelector.value;
        confirmationModal.style.display = 'none';
    }

    function cancelModelChange() {
        modelSelector.value = currentModel;
        confirmationModal.style.display = 'none';
    }

    function parseMarkdown(text) {
        // Handle code blocks separately
        const codeBlockRegex = /```([\s\S]*?)```/g;
        const inlineCodeRegex = /`([^`]+)`/g;
        
        // First, extract and preserve code blocks
        const codeBlocks = [];
        let processedText = text.replace(codeBlockRegex, (match, codeContent) => {
            codeBlocks.push(codeContent);
            return `\uE000${codeBlocks.length - 1}\uE001`;
        });
        
        // Then, extract and preserve inline code
        const inlineCodes = [];
        processedText = processedText.replace(inlineCodeRegex, (match, codeContent) => {
            inlineCodes.push(codeContent);
            return `\uE002${inlineCodes.length - 1}\uE003`;
        });
        
        // Escape HTML in the remaining text (but not in the preserved code blocks)
        processedText = processedText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        
        // Convert **text** to bold
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Restore code blocks with proper formatting
        processedText = processedText.replace(/\uE000(\d+)\uE001/g, (match, index) => {
            const code = codeBlocks[index];
            return `<pre><code>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
        });
        
        // Restore inline code
        processedText = processedText.replace(/\uE002(\d+)\uE003/g, (match, index) => {
            const code = inlineCodes[index];
            return `<code>${code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>`;
        });
        
        return processedText;
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage) return;
        appendMessage('user', userMessage);
        messages.push({ role: 'user', content: userMessage });
        userInput.value = '';
        setFormDisabled(true);
        loadingIndicator.classList.remove('hidden');
        scrollToBottom();
        try {
            const aiResponse = await getAIResponse(modelSelector.value);
            appendMessage('assistant', aiResponse);
            messages.push({ role: 'assistant', content: aiResponse });
        } catch (error) {
            console.error("Error:", error);
            appendMessage('assistant', "Maaf, terjadi kesalahan. Coba lagi.", true);
        } finally {
            loadingIndicator.classList.add('hidden');
            setFormDisabled(false);
        }
    }

    async function getAIResponse(model) {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.error}`);
        }
        const data = await response.json();
        return data.choices[0].message.content;
    }

    function appendMessage(sender, text, isError = false) {
        const msgWrapper = document.createElement('div'), msgContent = document.createElement('div'), iconDiv = document.createElement('div');
        iconDiv.className = 'bg-gray-700 p-2 rounded-full self-start';
        msgWrapper.className = 'flex items-start gap-3';
        msgContent.className = 'rounded-lg p-3 max-w-lg shadow';
        msgContent.style.whiteSpace = 'pre-wrap';
        
        if (sender === 'user') {
            msgContent.textContent = text;
            msgWrapper.classList.add('justify-end');
            msgContent.classList.add('bg-teal-600', 'text-white');
            iconDiv.innerHTML = `<i data-lucide="user" class="text-white"></i>`;
            msgWrapper.append(msgContent, iconDiv);
        } else {
            // Parse markdown for AI responses
            msgContent.innerHTML = parseMarkdown(text);
            msgContent.classList.add(isError ? 'bg-red-800' : 'bg-gray-800');
            iconDiv.innerHTML = `<i data-lucide="bot" class="text-teal-400"></i>`;
            msgWrapper.append(iconDiv, msgContent);
        }
        
        chatContainer.appendChild(msgWrapper);
        lucide.createIcons();
        scrollToBottom();
    }

    function appendSystemMessage(text) {
         const wrapper = document.createElement('div');
         wrapper.className = 'text-center my-2';
         const content = document.createElement('div');
         content.className = 'inline-block bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full';
         content.textContent = text;
         wrapper.appendChild(content);
         chatContainer.appendChild(wrapper);
         scrollToBottom();
    }

    function scrollToBottom() { chatContainer.scrollTop = chatContainer.scrollHeight; }

    function setFormDisabled(isDisabled) {
        userInput.disabled = isDisabled;
        submitButton.disabled = isDisabled;
        userInput.placeholder = isDisabled ? "AI sedang berpikir..." : "Ketik pesan Anda di sini...";
        if (!isDisabled) userInput.focus();
    }
}
