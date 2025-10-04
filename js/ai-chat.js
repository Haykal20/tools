// js/ai-chat.js

function initAiChat() {
    // Pastikan library tambahan sudah dimuat
    if (typeof marked === 'undefined' || typeof hljs === 'undefined') {
        console.error("Marked.js atau Highlight.js belum dimuat. Fitur formatting tidak akan berjalan.");
    }

    const API_URL = "https://restless-fire-59dc.thehaykal219.workers.dev";
    const chatContainer = document.getElementById('chat-container');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const loadingIndicator = document.getElementById('loading-indicator');
    const submitButton = chatForm?.querySelector('button');
    const modelSelector = document.getElementById('model-selector');
    
    // Modal Ganti Model
    const modelChangeModal = document.getElementById('model-change-modal');
    const confirmChangeBtn = document.getElementById('confirm-change-btn');
    const cancelChangeBtn = document.getElementById('cancel-change-btn');
    
    // Tombol dan Modal Hapus Chat
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const clearChatModal = document.getElementById('clear-chat-modal');
    const confirmClearBtn = document.getElementById('confirm-clear-btn');
    const cancelClearBtn = document.getElementById('cancel-clear-btn');

    if (!chatContainer || !chatForm) return;

    let messages = [];
    let currentModel = modelSelector?.value || '';

    // --- Manajemen Riwayat Chat ---
    function loadMessages() {
        const savedMessages = localStorage.getItem('aiChatMessages');
        const savedModel = localStorage.getItem('aiChatModel');
        if (savedMessages) {
            messages = JSON.parse(savedMessages);
            renderAllMessages();
        }
        if (savedModel && modelSelector) {
            modelSelector.value = savedModel;
            currentModel = savedModel;
        }
        if (messages.length === 0) {
            appendSystemMessage('Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!');
            messages.push({ role: 'system', content: 'Halo! Saya Haykal AI. Silakan ajukan pertanyaan apa pun!' });
        }
    }

    function saveMessages() {
        localStorage.setItem('aiChatMessages', JSON.stringify(messages.slice(-50))); // Simpan 50 pesan terakhir
        if (modelSelector) localStorage.setItem('aiChatModel', modelSelector.value);
    }

    function renderAllMessages() {
        chatContainer.innerHTML = '';
        messages.forEach(msg => {
            if (msg.role === 'system') appendSystemMessage(msg.content);
            else appendMessage(msg.role, msg.content, msg.isError || false, false);
        });
        scrollToBottom();
    }
    
    // --- Logika Tombol Header ---
    clearChatBtn?.addEventListener('click', () => clearChatModal?.classList.remove('hidden'));
    cancelClearBtn?.addEventListener('click', () => clearChatModal?.classList.add('hidden'));
    confirmClearBtn?.addEventListener('click', () => {
        messages = [];
        chatContainer.innerHTML = '';
        localStorage.removeItem('aiChatMessages');
        appendSystemMessage('Riwayat percakapan dihapus.');
        messages.push({ role: 'system', content: 'Riwayat percakapan dihapus.' });
        saveMessages();
        clearChatModal?.classList.add('hidden');
    });

    modelSelector?.addEventListener('change', () => {
        if (messages.length > 1) modelChangeModal?.classList.remove('hidden');
        else confirmModelChange();
    });
    cancelChangeBtn?.addEventListener('click', () => {
        if (modelSelector) modelSelector.value = currentModel;
        modelChangeModal?.classList.add('hidden');
    });
    confirmChangeBtn?.addEventListener('click', () => {
        messages = [];
        chatContainer.innerHTML = '';
        const modelName = modelSelector.options[modelSelector.selectedIndex].text;
        appendSystemMessage(`Model diubah ke ${modelName}. Percakapan dimulai ulang.`);
        messages.push({ role: 'system', content: `Model diubah ke ${modelName}. Percakapan dimulai ulang.` });
        if (modelSelector) currentModel = modelSelector.value;
        saveMessages();
        modelChangeModal?.classList.add('hidden');
        userInput.focus();
    });
    
    // --- Pengiriman Pesan ---
    chatForm.addEventListener('submit', handleFormSubmit);

    async function handleFormSubmit(e) {
        e.preventDefault();
        const userMessage = userInput.value.trim();
        if (!userMessage) return;
        
        appendMessage('user', userMessage);
        messages.push({ role: 'user', content: userMessage });
        saveMessages();
        userInput.value = '';
        setFormDisabled(true);
        loadingIndicator?.classList.remove('hidden');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: currentModel, messages })
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            appendMessage('assistant', aiResponse);
            messages.push({ role: 'assistant', content: aiResponse });
            saveMessages();
        } catch (error) {
            console.error("Error:", error);
            appendMessage('assistant', "Maaf, terjadi kesalahan. Silakan coba lagi.", true);
        } finally {
            loadingIndicator?.classList.add('hidden');
            setFormDisabled(false);
        }
    }
    
    function isUserNearBottom(threshold = 120) {
        return (chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight) < threshold;
    }

    function appendMessage(sender, text, isError = false, shouldSave = true) {
        const shouldScroll = isUserNearBottom();

        const msgWrapper = document.createElement('div');
        msgWrapper.className = 'flex items-start gap-3';
        
        const iconDiv = document.createElement('div');
        iconDiv.className = 'bg-gray-700 p-2 rounded-full self-start';
        
        const msgContent = document.createElement('div');
        msgContent.className = 'rounded-lg p-3 max-w-lg shadow';
        msgContent.style.overflowWrap = 'break-word';

        if (sender === 'user') {
            msgWrapper.classList.add('justify-end');
            iconDiv.innerHTML = `<i data-lucide="user" class="text-white"></i>`;
            msgContent.textContent = text;
            msgContent.classList.add('bg-teal-600', 'text-white');
            msgWrapper.append(msgContent, iconDiv);
        } else { // assistant
            iconDiv.innerHTML = `<i data-lucide="bot" class="text-teal-400"></i>`;
            msgContent.classList.add(isError ? 'bg-red-800' : 'bg-gray-800', 'text-gray-200');
            // Gunakan Marked.js untuk parsing
            if (typeof marked !== 'undefined' && !isError) {
                msgContent.innerHTML = marked.parse(text);
            } else {
                msgContent.textContent = text;
            }
            msgWrapper.append(iconDiv, msgContent);
        }

        chatContainer.appendChild(msgWrapper);
        lucide.createIcons();
        
        // Setelah di-append, cari blok kode dan tambahkan highlight + tombol copy
        msgContent.querySelectorAll('pre code').forEach(addSyntaxHighlightingAndCopy);

        if (shouldScroll) scrollToBottom();
    }

    function addSyntaxHighlightingAndCopy(block) {
        // Terapkan highlighting
        if (typeof hljs !== 'undefined') {
            hljs.highlightElement(block);
        }
        
        // Buat dan tambahkan tombol copy
        const pre = block.parentElement;
        if (pre.querySelector('.copy-code-btn')) return; // Hindari duplikat tombol

        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.textContent = 'Copy';
        pre.appendChild(copyButton);

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(block.textContent).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
            }).catch(err => {
                console.error('Gagal menyalin kode:', err);
                copyButton.textContent = 'Error';
            });
        });
    }

    function appendSystemMessage(text) {
         const wrapper = document.createElement('div');
         wrapper.className = 'text-center my-2';
         wrapper.innerHTML = `<div class="inline-block bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">${text}</div>`;
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

    // --- Inisialisasi ---
    loadMessages();
}