// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    loadView('tool-selection');
});

async function loadView(viewName) {
    try {
        const response = await fetch(`tools/${viewName}.html`);
        if (!response.ok) throw new Error(`Gagal memuat view: ${viewName}.html`);
        
        const html = await response.text();
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = html;
        if (appContainer.firstElementChild) {
            appContainer.firstElementChild.classList.add('view-enter');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Memanggil fungsi inisialisasi yang sesuai
        switch (viewName) {
            case 'tool-selection':
                initToolSelectionListeners();
                break;
            case 'ai-chat':
                initAiChat();
                initBackButtonListener();
                break;
            case 'tiktok-downloader':
                initTikTokDownloader();
                initBackButtonListener();
                break;
            case 'number-converter':
                initNumberConverter();
                initBackButtonListener();
                break;
            case 'password-generator':
                initPasswordGenerator();
                initBackButtonListener();
                break;
            case 'pdf-merger':
                initPdfMerger();
                initBackButtonListener();
                break;
            case 'tensor-chooser':
                initTensorChooserListeners(); // Inisialisasi untuk halaman pilihan
                initBackButtonListener();
                break;
            case 'tensor-camera':
                initTensorCamera(); // Inisialisasi untuk mode kamera
                initBackButtonListener();
                break;
            case 'tensor-image':
                initTensorImage(); // Inisialisasi untuk mode gambar
                initBackButtonListener();
                break;
            case 'qrcode-generator':
                initQrCodeGenerator();
                initBackButtonListener();
                break;
            case 'diagram-editor':
                initDiagramEditor();
                initBackButtonListener();
                break;
            case 'text-extractor':
                initTextExtractor();
                initBackButtonListener();
                break;
        }
    } catch (error) {
        console.error('Error loading view:', error);
    }
}

function initToolSelectionListeners() {
    document.getElementById('select-ai-chat')?.addEventListener('click', () => loadView('ai-chat'));
    document.getElementById('select-tiktok-dl')?.addEventListener('click', () => loadView('tiktok-downloader'));
    document.getElementById('select-num-converter')?.addEventListener('click', () => loadView('number-converter'));
    document.getElementById('select-pw-generator')?.addEventListener('click', () => loadView('password-generator'));
    document.getElementById('select-pdf-merger')?.addEventListener('click', () => loadView('pdf-merger'));
    document.getElementById('select-tensor-ai')?.addEventListener('click', () => loadView('tensor-chooser'));
    document.getElementById('select-qrcode-generator')?.addEventListener('click', () => loadView('qrcode-generator'));
    document.getElementById('select-diagram-editor')?.addEventListener('click', () => loadView('diagram-editor'));
    document.getElementById('select-text-extractor')?.addEventListener('click', () => loadView('text-extractor'));
}

// FUNGSI BARU UNTUK MENGHANDLE HALAMAN PILIHAN TENSOR
function initTensorChooserListeners() {
    document.getElementById('select-camera-mode')?.addEventListener('click', () => loadView('tensor-camera'));
    document.getElementById('select-image-mode')?.addEventListener('click', () => loadView('tensor-image'));
}

function initBackButtonListener() {
    // Attach listener to any back button used across views (selection and chooser)
    const backButtons = document.querySelectorAll('.back-to-selection-btn, .back-to-chooser-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            // Stop camera stream if running
            if (typeof window.stopTensorCameraStream === 'function') {
                window.stopTensorCameraStream();
            }
            loadView('tool-selection');
        });
    });
}