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
        // Convert headings (#, ##, ###)
        text = text.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mb-2">$1</h1>');
        text = text.replace(/^## (.*$)/gim, '<h2 class="text-md font-semibold text-white mb-2">$1</h2>');
        text = text.replace(/^### (.*$)/gim, '<h3 class="text-sm font-medium text-white mb-1">$1</h3>');
        
        // Convert **text** to bold
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
        
        // Convert *text* to italic
        text = text.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
        
        // Convert `code` to inline code
        text = text.replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
        
        // Convert ```code blocks```
        text = text.replace(/```(\w+)?\s*([\s\S]*?)```/g, '<pre class="bg-gray-700 p-3 rounded my-2 overflow-x-auto"><code class="text-sm font-mono">$2</code></pre>');
        
        // Convert paragraphs (handle line breaks)
        text = text.replace(/([^\n])\n([^\n])/g, '$1<br>$2');
        
        return text;
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
