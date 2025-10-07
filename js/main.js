// js/main.js

// Saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
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
        
        // Atur URL hash tanpa membuat history baru (baik untuk navigasi SPA)
        if (viewName === 'tool-selection') {
            history.replaceState(null, '', window.location.pathname);
        } else {
            history.replaceState(null, '', `#${viewName}`);
        }

        switch (viewName) {
            case 'tool-selection':
                initToolSelectionListeners();
                break;
            // Alat non-AI (tanpa refresh)
            case 'ai-chat': initAiChat(); initBackButtonListener(); break;
            case 'tiktok-downloader': initTikTokDownloader(); initBackButtonListener(); break;
            case 'number-converter': initNumberConverter(); initBackButtonListener(); break;
            case 'password-generator': initPasswordGenerator(); initBackButtonListener(); break;
            case 'pdf-merger': initPdfMerger(); initBackButtonListener(); break;
            case 'qrcode-generator': initQrCodeGenerator(); initBackButtonListener(); break;
            case 'diagram-editor': initDiagramEditor(); initBackButtonListener(); break;
            case 'text-extractor': await initTextExtractor(); initBackButtonListener(); break;
            
            // Alat AI (dipanggil setelah refresh)
            case 'tensor-chooser': initTensorChooserListeners(); initBackButtonListener(); break;
            case 'tensor-camera': await initTensorCamera(); initBackButtonListener(); break;
            case 'tensor-image': await initTensorImage(); initBackButtonListener(); break;
            case 'face-recognition': await initFaceRecognition(); initBackButtonListener(); break;
        }
    } catch (error) {
        console.error('Error loading view:', error);
        document.getElementById('app-container').innerHTML = `<div class="text-center p-8 text-red-400"><h2>Terjadi Kesalahan</h2><p>${error.message}</p><button onclick="window.location.href=window.location.pathname" class="mt-4 bg-slate-700 p-2 px-4 rounded-lg">Kembali ke Menu Utama</button></div>`;
    }
}

function initToolSelectionListeners() {
    // Alat standar yang menggunakan navigasi SPA (tanpa refresh)
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

    // --- LOGIKA KHUSUS UNTUK ALAT AI YANG BERKONFLIK (DENGAN REFRESH) ---
    const conflictingAiTools = {
        'select-tensor-ai': 'tensor-chooser',
        'select-face-recognition': 'face-recognition'
    };

    Object.entries(conflictingAiTools).forEach(([id, view]) => {
        document.getElementById(id)?.addEventListener('click', () => {
            // Logika dari sebelumnya: set hash DAN reload halaman untuk memastikan 'clean state'
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
    // --- Kembali ke menu utama dengan me-refresh halaman ---
    document.querySelectorAll('.back-to-selection-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            // Menghentikan stream kamera jika ada sebelum navigasi
            if (typeof window.stopTensorCameraStream === 'function') {
                window.stopTensorCameraStream();
            }
            // Navigasi ke halaman utama (membersihkan hash dan me-refresh)
            window.location.href = window.location.pathname;
        });
    });

    // Kembali ke halaman pilihan tensor (tanpa refresh)
    document.querySelectorAll('.back-to-chooser-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            loadView('tensor-chooser'); 
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