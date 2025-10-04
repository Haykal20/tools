function initDiagramEditor() {
    // Cek jika library Mermaid sudah dimuat
    if (typeof mermaid === 'undefined') {
        console.error("Library Mermaid tidak dimuat!");
        const previewElement = document.getElementById("fullViewPreview");
        if(previewElement) {
            previewElement.innerHTML = '<p class="text-red-500">Error: Library Mermaid gagal dimuat.</p>';
        }
        return;
    }

    // Elemen DOM
    const editor = document.getElementById("editor");
    const fullViewPreview = document.getElementById("fullViewPreview");
    
    const themeToggle = document.getElementById("themeToggle");
    const themeLabel = document.getElementById("themeLabel");
    
    const editModeBtn = document.getElementById("editModeBtn");
    const viewModeBtn = document.getElementById("viewModeBtn");
    const editorContainer = document.getElementById("editorContainer");
    const viewContainer = document.getElementById("viewContainer");

    if (!editor || !fullViewPreview || !themeToggle || !editModeBtn || !viewModeBtn || !editorContainer || !viewContainer) return;

    let currentTheme = localStorage.getItem('mermaidTheme') || 'dark';

    // --- Inisialisasi & Pengaturan Tema ---
    function applyTheme(theme) {
        currentTheme = theme;
        localStorage.setItem('mermaidTheme', theme);
        themeLabel.textContent = theme === 'dark' ? 'Gelap' : 'Terang';
        themeToggle.checked = theme === 'light';
        mermaid.initialize({
            startOnLoad: false,
            theme: theme,
            securityLevel: 'loose',
            flowchart: { useMaxWidth: true },
            fontFamily: '"Inter", sans-serif',
        });
        // Render ulang jika sedang dalam mode view
        if (!viewContainer.classList.contains('hidden')) {
            renderMermaid();
        }
    }

    themeToggle.addEventListener('change', (event) => {
        applyTheme(event.target.checked ? 'light' : 'dark');
    });

    // --- Pengaturan Mode Edit/View ---
    function setMode(mode) {
        if (mode === 'edit') {
            editModeBtn.classList.add('bg-orange-600', 'text-white');
            editModeBtn.classList.remove('text-slate-300', 'hover:bg-slate-600');
            viewModeBtn.classList.remove('bg-orange-600', 'text-white');
            viewModeBtn.classList.add('text-slate-300', 'hover:bg-slate-600');
            
            editorContainer.classList.remove('hidden');
            viewContainer.classList.add('hidden');
        } else { // 'view'
            viewModeBtn.classList.add('bg-orange-600', 'text-white');
            viewModeBtn.classList.remove('text-slate-300', 'hover:bg-slate-600');
            editModeBtn.classList.remove('bg-orange-600', 'text-white');
            editModeBtn.classList.add('text-slate-300', 'hover:bg-slate-600');
            
            editorContainer.classList.add('hidden');
            viewContainer.classList.remove('hidden');
            renderMermaid(); // Render diagram saat beralih ke mode view
        }
    }

    editModeBtn.addEventListener('click', () => setMode('edit'));
    viewModeBtn.addEventListener('click', () => setMode('view'));

    // --- Fungsi Render Mermaid ---
    async function renderMermaid() {
        const code = editor.value.trim();
        if (!code) {
            fullViewPreview.innerHTML = '<p class="text-slate-500">Tidak ada kode untuk ditampilkan.</p>';
            return;
        }
        fullViewPreview.innerHTML = '<div class="loader-mermaid"></div>';

        try {
            const svgId = 'mermaid-svg-' + Date.now();
            const { svg } = await mermaid.render(svgId, code);
            fullViewPreview.innerHTML = svg;
            const svgEl = fullViewPreview.querySelector('svg');
            if(svgEl) {
                svgEl.style.backgroundColor = currentTheme === 'dark' ? '#1E293B' : '#FFFFFF';
            }
        } catch (error) {
            const errorMessage = error.message.split('\n').slice(0, 3).join('<br>');
            fullViewPreview.innerHTML = `<div class="p-4 text-left text-red-400 bg-red-900/50 rounded-lg font-mono text-sm"><strong class="font-bold">❌ Error Rendering:</strong><br>${errorMessage}</div>`;
            console.error(error);
        }
    }
    
    // Hapus debounce, karena tidak ada lagi live preview
    // editor.addEventListener("input", ...);

    // --- Inisialisasi Awal ---
    applyTheme(currentTheme);
    setMode('edit'); // Mulai dari mode Edit

    // --- Fungsi Global untuk Tombol-tombol ---
    window.insertSample = function(type) {
        // ... (Fungsi insertSample tetap sama seperti sebelumnya)
        let sampleCode = '';
        switch(type) {
           case 'flowchart':
                sampleCode = `graph TD
    A[Mulai] --> B{Pilih Alat?};
    B -->|Ya| C[Gunakan Alat];
    B -->|Tidak| D[Selesai];
    C --> D;`;
                break;
            case 'sequence':
                sampleCode = `sequenceDiagram
    participant Pengguna
    participant Aplikasi
    Pengguna->>Aplikasi: Klik tombol
    Aplikasi-->>Pengguna: Tampilkan hasil`;
                break;
            case 'class':
                sampleCode = `classDiagram
    class Hewan {
        -String nama
        +suara()
    }
    class Kucing {
        +meong()
    }
    Hewan <|-- Kucing`;
                break;
            case 'state':
                sampleCode = `stateDiagram-v2
    [*] --> Mati
    Mati --> Hidup: Tombol Ditekan
    Hidup --> Mati: Tombol Ditekan`;
                break;
            case 'er':
                sampleCode = `erDiagram
    PELANGGAN ||--o{ PESANAN : "membuat"
    PESANAN ||--|{ PRODUK : "berisi"`;
                break;
            case 'gantt':
                sampleCode = `gantt
    title Proyek Pengembangan
    dateFormat  YYYY-MM-DD
    section Desain
    UI/UX       : 2025-10-01, 7d
    section Development
    Frontend    : after UI/UX, 14d
    Backend     : after UI/UX, 12d`;
                break;
            case 'pie':
                sampleCode = `pie
    title Pengguna Browser
    "Chrome" : 65
    "Firefox" : 15
    "Safari" : 10
    "Lainnya" : 10`;
                break;
            case 'mindmap':
                sampleCode = `mindmap
  root((Pusat Ide))
    Ide A
      Sub-Ide A1
      Sub-Ide A2
    Ide B`;
                break;
        }
        editor.value = sampleCode;
        renderMermaid();
    };
    
    insertSample('flowchart');

    window.pasteFromClipboard = async function() {
        try {
            const text = await navigator.clipboard.readText();
            editor.value = text;
        } catch (err) { alert("⚠️ Gagal menempel."); }
    };

    window.clearEditor = function() {
        editor.value = "";
    };

    window.downloadSVG = function() {
        // Pastikan render dulu jika belum
        renderMermaid().then(() => {
            const svgEl = fullViewPreview.querySelector("svg");
            if (!svgEl) {
                alert("⚠️ Belum ada diagram untuk diunduh!");
                return;
            }
            const clonedSvgEl = svgEl.cloneNode(true);
            const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
            style.textContent = `svg { background-color: ${currentTheme === 'dark' ? '#1E293B' : '#FFFFFF'}; }`;
            clonedSvgEl.prepend(style);
            const svgData = new XMLSerializer().serializeToString(clonedSvgEl);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "diagram.svg";
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        });
    };
}