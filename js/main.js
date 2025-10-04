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
                initTensorChooserListeners();
                initBackButtonListener();
                break;
            case 'tensor-camera':
                initTensorCamera();
                initBackButtonListener();
                break;
            case 'tensor-image':
                initTensorImage();
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
            default:
                console.warn(`Tidak ada inisialisasi untuk view: ${viewName}`);
        }
    } catch (error) {
        console.error('Error loading view:', error);
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = `
            <div class="flex items-center justify-center min-h-screen">
                <div class="text-center">
                    <h2 class="text-2xl font-bold text-red-400 mb-4">Error Memuat Halaman</h2>
                    <p class="text-slate-400">Gagal memuat ${viewName}.html</p>
                    <button onclick="loadView('tool-selection')" class="mt-4 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg">
                        Kembali ke Menu Utama
                    </button>
                </div>
            </div>
        `;
    }
}

function initToolSelectionListeners() {
    const tools = {
        'select-ai-chat': 'ai-chat',
        'select-tiktok-dl': 'tiktok-downloader',
        'select-num-converter': 'number-converter',
        'select-pw-generator': 'password-generator',
        'select-pdf-merger': 'pdf-merger',
        'select-tensor-ai': 'tensor-chooser',
        'select-qrcode-generator': 'qrcode-generator',
        'select-diagram-editor': 'diagram-editor',
        'select-text-extractor': 'text-extractor'
    };

    Object.entries(tools).forEach(([id, view]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', () => loadView(view));
        } else {
            console.warn(`Element dengan id ${id} tidak ditemukan`);
        }
    });
}

// FUNGSI BARU UNTUK MENGHANDLE HALAMAN PILIHAN TENSOR
function initTensorChooserListeners() {
    const cameraMode = document.getElementById('select-camera-mode');
    const imageMode = document.getElementById('select-image-mode');
    
    if (cameraMode) {
        cameraMode.addEventListener('click', () => loadView('tensor-camera'));
    } else {
        console.warn('Element select-camera-mode tidak ditemukan');
    }
    
    if (imageMode) {
        imageMode.addEventListener('click', () => loadView('tensor-image'));
    } else {
        console.warn('Element select-image-mode tidak ditemukan');
    }
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

// Tambahkan fungsi global untuk error handling
window.handleGlobalError = function(error) {
    console.error('Global error:', error);
    // Bisa ditambahkan notifikasi error ke user di sini
};

// Global error handler
window.addEventListener('error', (event) => {
    handleGlobalError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    handleGlobalError(event.reason);
});