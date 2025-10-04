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
    const transparentToggle = document.getElementById("transparentToggle");
    
    const editModeBtn = document.getElementById("editModeBtn");
    const viewModeBtn = document.getElementById("viewModeBtn");
    const editorContainer = document.getElementById("editorContainer");
    const viewContainer = document.getElementById("viewContainer");

    if (!editor || !fullViewPreview || !themeToggle || !transparentToggle || !editModeBtn || !viewModeBtn || !editorContainer || !viewContainer) return;

    let currentTheme = localStorage.getItem('mermaidTheme') || 'dark';
    let removeBg = (localStorage.getItem('mermaidRemoveBg') === 'true');

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

    // Toggle transparan (remove background)
    function applyRemoveBg(val) {
        removeBg = !!val;
        localStorage.setItem('mermaidRemoveBg', removeBg ? 'true' : 'false');
        // Jika sedang di view, render ulang agar preview mengikuti opsi
        if (!viewContainer.classList.contains('hidden')) {
            renderMermaid();
        }
    }
    
    // Inisialisasi state transparan UI
    transparentToggle.checked = removeBg;
    transparentToggle.addEventListener('change', (e) => applyRemoveBg(e.target.checked));

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
                // Hanya berikan background jika opsi transparan tidak aktif
                if (!removeBg) {
                    svgEl.style.backgroundColor = currentTheme === 'dark' ? '#1E293B' : '#FFFFFF';
                } else {
                    svgEl.style.backgroundColor = 'transparent';
                }
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
            // Hanya tambahkan style background jika opsi transparan tidak aktif
            if (!removeBg) {
                const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
                style.textContent = `svg { background-color: ${currentTheme === 'dark' ? '#1E293B' : '#FFFFFF'}; }`;
                clonedSvgEl.prepend(style);
            }

            const svgData = new XMLSerializer().serializeToString(clonedSvgEl);
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "diagram.svg";
            document.body.appendChild(a); a.click();
            document.body.removeChild(a); URL.revokeObjectURL(url);
        });
    };

    // --- New: Export SVG as PNG (regular & HD) ---
    async function exportPNG(scale = 1, filename = "diagram.png") {
        // Pastikan render dulu jika belum
        await renderMermaid();

        const svgEl = fullViewPreview.querySelector("svg");
        if (!svgEl) {
            alert("⚠️ Belum ada diagram untuk diunduh!");
            return;
        }

        // Clone dan tambahkan style background (jika perlu)
        const clonedSvgEl = svgEl.cloneNode(true);
        const bgColor = currentTheme === 'dark' ? '#1E293B' : '#FFFFFF';
        if (!removeBg) {
            const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
            style.textContent = `svg { background-color: ${bgColor}; }`;
            clonedSvgEl.prepend(style);
        }

        // Pastikan namespace dan ukuran/viewBox ada
        if (!clonedSvgEl.getAttribute('xmlns')) {
            clonedSvgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }

        // Determine intrinsic width/height
        let width = parseFloat(clonedSvgEl.getAttribute('width')) || 0;
        let height = parseFloat(clonedSvgEl.getAttribute('height')) || 0;

        // Try to use viewBox or getBBox as fallback
        const viewBox = clonedSvgEl.getAttribute('viewBox');
        if ((!width || !height) && viewBox) {
            const vb = viewBox.split(/\s+|,/).map(Number);
            if (vb.length === 4) { width = vb[2]; height = vb[3]; }
        }
        if ((!width || !height)) {
            try {
                const bbox = svgEl.getBBox();
                width = bbox.width || width;
                height = bbox.height || height;
            } catch (e) {
                // ignore
            }
        }

        // Fallback dimension
        if (!width || !height) {
            width = svgEl.clientWidth || 800;
            height = svgEl.clientHeight || 600;
        }

        // Ensure viewBox matches dimensions
        if (!clonedSvgEl.getAttribute('viewBox')) {
            clonedSvgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
        clonedSvgEl.setAttribute('width', width);
        clonedSvgEl.setAttribute('height', height);

        const svgData = new XMLSerializer().serializeToString(clonedSvgEl);

        // Gunakan data URL dan set crossOrigin untuk mengurangi kemungkinan taint
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

        // Render into image then canvas
        try {
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.round(width * scale);
                        canvas.height = Math.round(height * scale);
                        const ctx = canvas.getContext('2d');

                        // Jika tidak removeBg, isi background agar PNG tidak transparan.
                        if (!removeBg) {
                            ctx.fillStyle = bgColor;
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        } else {
                            // Biarkan canvas transparan (tidak mengisi)
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                        // toBlob bisa melempar/return null jika canvas tainted
                        canvas.toBlob((blob) => {
                            if (!blob) { reject(new Error("Gagal membuat PNG (blob kosong).")); return; }
                            const a = document.createElement('a');
                            const pngUrl = URL.createObjectURL(blob);
                            a.href = pngUrl;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(pngUrl);
                            resolve();
                        }, 'image/png');
                    } catch (err) { reject(err); }
                };
                img.onerror = () => { reject(new Error("Gagal memuat SVG sebagai image")); };
                img.src = dataUrl;
            });
        } catch (err) {
            console.error(err);
            // Deteksi kemungkinan taint (pesan bisa berbeda antar browser)
            const msg = (err && err.message) ? err.message.toLowerCase() : '';
            if (msg.includes('taint') || msg.includes('securityerror') || msg.includes('tainted')) {
                alert("⚠️ Gagal mengekspor PNG karena canvas ter-taint (biasanya ada referensi gambar/font eksternal pada SVG). Sebagai alternatif, file SVG akan diunduh. Untuk PNG: pastikan semua gambar/font di-embed sebagai data URI atau host resource dengan CORS yang tepat.");
                // fallback: unduh SVG
                window.downloadSVG();
            } else {
                alert("⚠️ Gagal mengekspor PNG: " + (err.message || err));
            }
        }
    }

    // Global helpers
    window.downloadPNGHD = function() {
        // HD scale 3 (lebih tinggi), bisa disesuaikan
        exportPNG(3, "diagram-hd.png");
    };
}