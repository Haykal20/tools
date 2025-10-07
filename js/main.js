// js/main.js

// Saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    // Cek apakah ada "hash" di URL (contoh: #tensor-chooser)
    const hash = window.location.hash.substring(1);
    
    // Jika ada hash, langsung muat view tersebut. Jika tidak, muat menu utama.
    if (hash) {
        loadView(hash);
    } else {
        loadView('tool-selection');
    }
});

async function loadView(viewName) {
    try {
        const response = await fetch(`tools/${viewName}.html`);
        if (!response.ok) throw new Error(`Gagal memuat view: ${viewName}.html`);
        
        const html = await response.text();
        document.getElementById('app-container').innerHTML = html;
        if (document.getElementById('app-container').firstElementChild) {
            document.getElementById('app-container').firstElementChild.classList.add('view-enter');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
        // Memanggil fungsi inisialisasi yang sesuai
        switch (viewName) {
            case 'tool-selection':
                initToolSelectionListeners();
                break;
            // Alat non-AI
            case 'ai-chat': initAiChat(); initBackButtonListener(); break;
            case 'tiktok-downloader': initTikTokDownloader(); initBackButtonListener(); break;
            case 'number-converter': initNumberConverter(); initBackButtonListener(); break;
            case 'password-generator': initPasswordGenerator(); initBackButtonListener(); break;
            case 'pdf-merger': initPdfMerger(); initBackButtonListener(); break;
            case 'qrcode-generator': initQrCodeGenerator(); initBackButtonListener(); break;
            case 'diagram-editor': initDiagramEditor(); initBackButtonListener(); break;

            // Alat AI
            case 'text-extractor': await initTextExtractor(); initBackButtonListener(); break;
            case 'tensor-chooser': initTensorChooserListeners(); initBackButtonListener(); break;
            case 'tensor-camera': await initTensorCamera(); initBackButtonListener(); break;
            case 'tensor-image': await initTensorImage(); initBackButtonListener(); break;
            case 'face-recognition': await initFaceRecognition(); initBackButtonListener(); break;
        }
    } catch (error) {
        console.error('Error loading view:', error);
    }
}

function initToolSelectionListeners() {
    const standardTools = {
        'select-ai-chat': 'ai-chat',
        'select-tiktok-dl': 'tiktok-downloader',
        'select-num-converter': 'number-converter',
        'select-pw-generator': 'password-generator',
        'select-pdf-merger': 'pdf-merger',
        'select-qrcode-generator': 'qrcode-generator',
        'select-diagram-editor': 'diagram-editor',
        'select-text-extractor': 'text-extractor',
    };

    Object.entries(standardTools).forEach(([id, view]) => {
        document.getElementById(id)?.addEventListener('click', () => loadView(view));
    });

    // --- LOGIKA DIPERBAIKI DI SINI ---
    const conflictingAiTools = {
        'select-tensor-ai': 'tensor-chooser',
        'select-face-recognition': 'face-recognition'
    };

    Object.entries(conflictingAiTools).forEach(([id, view]) => {
        document.getElementById(id)?.addEventListener('click', () => {
            // Langsung set hash DAN reload pada klik pertama
            window.location.hash = view;
            window.location.reload();
        });
    });
}

function initTensorChooserListeners() {
    document.getElementById('select-camera-mode')?.addEventListener('click', () => loadView('tensor-camera'));
    document.getElementById('select-image-mode')?.addEventListener('click', () => loadView('tensor-image'));
}

function initBackButtonListener() {
    document.querySelectorAll('.back-to-selection-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            // Kembali ke menu utama dengan membersihkan hash dan reload
            window.location.href = window.location.pathname;
        });
    });

    document.querySelectorAll('.back-to-chooser-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            loadView('tensor-chooser'); // Kembali ke halaman pilihan tensor (tanpa reload)
        });
    });
}

// Fungsi loadScript (jika Anda masih menggunakannya di file lain)
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Gagal memuat script: ${src}`));
        document.head.appendChild(script);
    });
}