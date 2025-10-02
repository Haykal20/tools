// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    loadView('tool-selection');
});

async function loadView(viewName) {
    try {
        // gunakan path relatif eksplisit
        const response = await fetch(`./tools/${viewName}.html`);
        if (!response.ok) throw new Error(`Gagal memuat view: ${viewName}.html`);
        
        const html = await response.text();
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = html;
        if (appContainer.firstElementChild) {
            appContainer.firstElementChild.classList.add('view-enter');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // helper: panggil fungsi init dengan pengecekan dan retry singkat
        const callInit = (fnName) => {
            if (!fnName) return;
            if (typeof window[fnName] === 'function') {
                try { window[fnName](); } catch (e) { console.error(`Error saat menjalankan ${fnName}:`, e); }
            } else {
                // retry sekali setelah delay kecil (bila script belum sempat dieksekusi)
                setTimeout(() => {
                    if (typeof window[fnName] === 'function') {
                        try { window[fnName](); } catch (e) { console.error(`Error saat menjalankan ${fnName}:`, e); }
                    } else {
                        console.warn(`${fnName} tidak ditemukan.`);
                    }
                }, 250);
            }
        };

        // mapping view -> nama fungsi init (jaga agar tidak crash bila fungsi belum terdefinisi)
        switch (viewName) {
            case 'tool-selection':
                callInit('initToolSelectionListeners');
                break;
            case 'ai-chat':
                callInit('initAiChat');
                callInit('initBackButtonListener');
                break;
            case 'tiktok-downloader':
                callInit('initTikTokDownloader');
                callInit('initBackButtonListener');
                break;
            case 'number-converter':
                callInit('initNumberConverter');
                callInit('initBackButtonListener');
                break;
            case 'password-generator':
                callInit('initPasswordGenerator');
                callInit('initBackButtonListener');
                break;
            case 'pdf-merger':
                callInit('initPdfMerger');
                callInit('initBackButtonListener');
                break;
            case 'tensor-chooser':
                callInit('initTensorChooserListeners');
                callInit('initBackButtonListener');
                break;
            case 'tensor-camera':
                callInit('initTensorCamera');
                callInit('initBackButtonListener');
                break;
            case 'tensor-image':
                callInit('initTensorImage');
                callInit('initBackButtonListener');
                break;
            case 'qrcode-generator':
                callInit('initQrCodeGenerator');
                callInit('initBackButtonListener');
                break;
            case 'diagram-editor':
                callInit('initDiagramEditor');
                callInit('initBackButtonListener');
                break;
            case 'text-extractor':
                callInit('initTextExtractor');
                callInit('initBackButtonListener');
                break;
            default:
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

// GANTI: gunakan event delegation satu kali untuk back buttons (hindari multiple listeners)
function initBackButtonListener() {
    // pastikan listener hanya terpasang sekali
    if (document.body.dataset.backListenerAttached === '1') return;
    document.body.dataset.backListenerAttached = '1';

    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.back-to-selection-btn, .back-to-chooser-btn');
        if (!btn) return;
        e.preventDefault();
        // Stop camera stream if running
        if (typeof window.stopTensorCameraStream === 'function') {
            try { window.stopTensorCameraStream(); } catch (err) { console.warn('Gagal menghentikan stream:', err); }
        }
        loadView('tool-selection');
    });
}