function initDiagramEditor() {
    // Cek jika library Mermaid sudah dimuat
    if (typeof mermaid === 'undefined') {
        console.error("Library Mermaid tidak dimuat!");
        document.getElementById("preview").innerHTML = '<p class="text-red-500">Error: Library Mermaid gagal dimuat.</p>';
        return;
    }

    const editor = document.getElementById("editor");
    const preview = document.getElementById("preview");

    // Pastikan elemen ditemukan
    if (!editor || !preview) return;

    // Inisialisasi Mermaid dengan tema gelap
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark', // Menggunakan tema gelap
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true, // Biarkan diagram menyesuaikan lebar kontainer
      },
      fontFamily: '"Inter", sans-serif',
    });
    
    // Contoh kode awal
    editor.value = `graph TD
    A[Mulai] --> B{Pilih Alat?};
    B -->|Ya| C[Gunakan Alat];
    B -->|Tidak| D[Selesai];
    C --> D;`;

    async function renderMermaid() {
      const code = editor.value.trim();
      if (!code) {
        preview.innerHTML = '<p class="text-slate-500">Masukkan kode Mermaid...</p>';
        return;
      }
      preview.innerHTML = '<div class="loader"></div>'; // Tampilkan loading spinner

      try {
        // Render diagram dengan ID unik untuk menghindari cache
        const svgId = 'mermaid-svg-' + Date.now();
        const { svg } = await mermaid.render(svgId, code);
        preview.innerHTML = svg;
      } catch (error) {
        // Tampilkan pesan error yang lebih ramah
        const errorMessage = error.message.split('\n').slice(0, 3).join('<br>');
        preview.innerHTML = `<div class="p-4 text-left text-red-400 bg-red-900/50 rounded-lg font-mono text-sm">
                                <strong class="font-bold">❌ Error Rendering:</strong><br>${errorMessage}
                             </div>`;
        console.error(error);
      }
    }

    // Render pertama kali
    renderMermaid();

    // Update otomatis saat mengetik dengan jeda (debounce)
    let debounceTimer;
    editor.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderMermaid, 400);
    });

    // Fungsi untuk tombol-tombol (ditempelkan ke window agar bisa diakses onclick)
    window.pasteFromClipboard = async function() {
      try {
        const text = await navigator.clipboard.readText();
        editor.value = text;
        renderMermaid();
      } catch (err) {
        alert("⚠️ Gagal menempel. Pastikan Anda mengizinkan akses clipboard.");
      }
    };

    window.clearEditor = function() {
      editor.value = "";
      renderMermaid();
    };

    window.downloadSVG = function() {
      const svgEl = preview.querySelector("svg");
      if (!svgEl) {
        alert("⚠️ Belum ada diagram untuk diunduh!");
        return;
      }
      
      // Menambahkan background pada SVG saat download
      const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
      style.textContent = `svg { background-color: #1e293b; }`; // Warna Slate-800
      svgEl.prepend(style);

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.svg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Hapus style setelah download
      svgEl.querySelector("style").remove();
    };
}