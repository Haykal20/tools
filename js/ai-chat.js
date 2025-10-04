// js/ai-chat.js

function initAiChat() {
    const API_URL = "https://restless-fire-59dc.thehaykal219.workers.dev";
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const submitButton = chatForm ? chatForm.querySelector('button') : null;
    const modelSelector = document.getElementById('model-selector');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmChangeBtn = document.getElementById('confirm-change-btn');
    const cancelChangeBtn = document.getElementById('cancel-change-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn'); // optional

    // Minimal required elements
    if (!chatContainer || !chatForm) return;

    let messages = [];
    let currentModel = modelSelector ? modelSelector.value : '';
    let isFirstMessage = true;

    // Load messages from localStorage
    function loadMessages() {
        const savedMessages = localStorage.getItem('aiChatMessages');
        const savedModel = localStorage.getItem('aiChatModel');
        
        if (savedMessages) {
            messages = JSON.parse(savedMessages);
            renderSavedMessages();
            isFirstMessage = messages.length === 0;
        }
        
        if (savedModel && modelSelector) {
            modelSelector.value = savedModel;
            currentModel = savedModel;
        }
    }

    // Save messages to localStorage
    function saveMessages() {
        // limit stored messages to avoid localStorage ballooning
        const toSave = messages.slice(-200);
        localStorage.setItem('aiChatMessages', JSON.stringify(toSave));
        if (modelSelector) localStorage.setItem('aiChatModel', modelSelector.value);
    }

    // Render saved messages
    function renderSavedMessages() {
        chatContainer.innerHTML = '';
        messages.forEach(msg => {
            if (msg.role === 'system') {
                appendSystemMessage(msg.content);
            } else if (msg.role === 'user') {
                appendMessage('user', msg.content);
            } else if (msg.role === 'assistant') {
                appendMessage('assistant', msg.content);
            }
        });
        // Rendered from storage — scroll to bottom so user sees latest on open
        scrollToBottom();
    }

    // Clear chat history
    function clearChatHistory() {
        const confirmClear = confirm('Apakah Anda yakin ingin menghapus semua riwayat chat?');
        if (confirmClear) {
            messages = [];
            chatContainer.innerHTML = '';
            localStorage.removeItem('aiChatMessages');
            localStorage.removeItem('aiChatModel');
            
            // Add welcome message
            appendSystemMessage('Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!');
            messages.push({ role: 'system', content: 'Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!' });
            isFirstMessage = false;
        }
    }

    chatForm.addEventListener('submit', handleFormSubmit);
    if (modelSelector) modelSelector.addEventListener('change', handleModelChange);
    if (confirmChangeBtn) confirmChangeBtn.addEventListener('click', confirmModelChange);
    if (cancelChangeBtn) cancelChangeBtn.addEventListener('click', cancelModelChange);
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearChatHistory);

    // Load messages on init
    loadMessages();

    if (isFirstMessage) {
        appendSystemMessage('Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!');
        messages.push({ role: 'system', content: 'Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!' });
        isFirstMessage = false;
        saveMessages();
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
        messages.push({ role: 'system', content: `Model diubah ke ${modelName}. Percakapan dimulai ulang.` });
        userInput.focus();
        if (modelSelector) currentModel = modelSelector.value;
        confirmationModal.style.display = 'none';
        saveMessages(); // Save after model change
    }

    function cancelModelChange() {
        if (modelSelector) modelSelector.value = currentModel;
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
        saveMessages(); // Save after user message
        userInput.value = '';
        setFormDisabled(true);
        loadingIndicator.classList.remove('hidden'); // show typing indicator (now fixed)
        // jangan paksa scroll ke bottom di sini — appendMessage akan handle auto-scroll sesuai posisi user
        try {
            const aiResponse = await getAIResponse(modelSelector ? modelSelector.value : currentModel);
            appendMessage('assistant', aiResponse);
            messages.push({ role: 'assistant', content: aiResponse });
            saveMessages(); // Save after AI response
        } catch (error) {
            console.error("Error:", error);
            appendMessage('assistant', "Maaf, terjadi kesalahan. Coba lagi.", true);
            messages.push({ role: 'assistant', content: "Maaf, terjadi kesalahan. Coba lagi.", isError: true });
            saveMessages(); // Save even on error
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

    // Tambahkan helper untuk cek apakah user berada dekat bottom
    function isUserNearBottom(threshold = 120) {
        if (!chatContainer) return true;
        return (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight) < threshold;
    }

    function appendMessage(sender, text, isError = false) {
        const msgWrapper = document.createElement('div'), msgContent = document.createElement('div'), iconDiv = document.createElement('div');
        iconDiv.className = 'bg-gray-700 p-2 rounded-full self-start';
        msgWrapper.className = 'flex items-start gap-3';
        msgContent.className = 'rounded-lg p-3 max-w-lg shadow';

        // Cek apakah user sedang dekat bottom sebelum append
        const shouldScroll = isUserNearBottom();

        // Limit visual overflow and keep formatting (lebih ramah mobile)
        msgContent.style.whiteSpace = 'pre-wrap';
        msgContent.style.overflowWrap = 'break-word';
        msgContent.style.wordBreak = 'break-word';
        msgContent.style.boxSizing = 'border-box';
        msgContent.style.maxWidth = 'min(70ch, 85%)'; // ubah jadi 85% agar mobile tidak terlalu ke kanan

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
        if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons();

        // Hanya scroll jika user sebelumnya sudah berada di bottom / near bottom
        if (shouldScroll) scrollToBottom();
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
        if (submitButton) submitButton.disabled = isDisabled;
        userInput.placeholder = isDisabled ? "AI sedang berpikir..." : "Ketik pesan Anda di sini...";
        if (!isDisabled) userInput.focus();
    }
}
