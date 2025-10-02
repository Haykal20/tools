// js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Load the tool selection view by default when the page loads
    loadView('tool-selection');
});

/**
 * Fetches and displays the HTML for a specific tool view.
 * @param {string} viewName - The name of the tool view to load (e.g., 'ai-chat').
 */
async function loadView(viewName) {
    try {
        const response = await fetch(`tools/${viewName}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load view: ${viewName}.html not found.`);
        }
        
        const html = await response.text();
        const appContainer = document.getElementById('app-container');
        appContainer.innerHTML = html;

        // Add a fade-in animation to the loaded content
        if (appContainer.firstElementChild) {
            appContainer.firstElementChild.classList.add('view-enter');
        }

        // Re-render Lucide icons for the new view
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Initialize the specific listeners and logic for the loaded view
        if (viewName === 'tool-selection') {
            initToolSelectionListeners();
        } else {
            // All other views have a "back" button
            initBackButtonListener();
            
            // Call the specific init function for the loaded tool
            switch (viewName) {
                case 'ai-chat':
                    initAiChat();
                    break;
                case 'tiktok-downloader':
                    initTikTokDownloader();
                    break;
                case 'number-converter':
                    initNumberConverter();
                    break;
                case 'password-generator':
                    initPasswordGenerator();
                    break;
                case 'tensor-detector':
                    initTensorDetector();
                    break;
                    case 'pdf-merger':
                    initPdfMerger();
                    break;
            }
        }
    } catch (error) {
        console.error('Error loading view:', error);
        document.getElementById('app-container').innerHTML = 
            `<div class="flex items-center justify-center min-h-screen">
                <p class="text-center text-red-400">Gagal memuat konten. Periksa konsol untuk detail.</p>
            </div>`;
    }
}

/**
 * Sets up event listeners for the tool selection cards on the main page.
 */
function initToolSelectionListeners() {
    document.getElementById('select-ai-chat')?.addEventListener('click', () => loadView('ai-chat'));
    document.getElementById('select-tiktok-dl')?.addEventListener('click', () => loadView('tiktok-downloader'));
    document.getElementById('select-num-converter')?.addEventListener('click', () => loadView('number-converter'));
    document.getElementById('select-pw-generator')?.addEventListener('click', () => loadView('password-generator'));
    document.getElementById('select-tensor-ai')?.addEventListener('click', () => loadView('tensor-detector'));
    document.getElementById('select-pdf-merger')?.addEventListener('click', () => loadView('pdf-merger'));
}

/**
 * Sets up the event listener for the "Back to Menu" button present in each tool view.
 */
function initBackButtonListener() {
    const backButton = document.querySelector('.back-to-selection-btn');
    if (backButton) {
        backButton.addEventListener('click', (event) => {
            event.preventDefault();
            // Special cleanup for Tensor AI to stop the camera stream before navigating away
            if (typeof window.stopTensorDetection === 'function') {
                window.stopTensorDetection();
            }
            loadView('tool-selection');
        });
    }
}
