function initTextExtractor() {
    // Cek jika library Tesseract ada
    if (typeof Tesseract === 'undefined') {
        console.error("Library Tesseract.js tidak dimuat!");
        document.getElementById('progressStatus').textContent = "Error: Library Tesseract gagal dimuat.";
        return;
    }

    // DOM Elements
    const fileInput = document.getElementById('fileInput');
    const dropArea = document.getElementById('dropArea');
    const imagePreview = document.getElementById('imagePreview');
    const uploadPrompt = document.getElementById('upload-prompt');
    const output = document.getElementById('output');
    const progressStatus = document.getElementById('progressStatus');
    const progressBar = document.getElementById('progressBar');
    const speakBtn = document.getElementById('speakBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const langSelect = document.getElementById('langSelect');

    // Pastikan semua elemen penting ada
    if (!fileInput || !dropArea || !output) return;

    let ocrText = "";

    // --- Drag and Drop Functionality ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add('border-cyan-500', 'bg-slate-800/50'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove('border-cyan-500', 'bg-slate-800/50'), false);
    });

    dropArea.addEventListener('drop', e => handleFiles(e.dataTransfer.files), false);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
      const file = files[0];
      if (!file || !file.type.startsWith("image/")) return;
      
      const reader = new FileReader();
      reader.onload = e => {
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        uploadPrompt.classList.add('hidden');
        runOCR(file);
      };
      reader.readAsDataURL(file);
    }
    
    // --- OCR Functionality ---
    async function runOCR(file) {
      resetState();
      progressStatus.textContent = "Mempersiapkan OCR...";
      
      const worker = await Tesseract.createWorker('eng+ind', 1, {
        logger: info => {
          if (info.status === 'recognizing text') {
            const progress = Math.round(info.progress * 100);
            progressBar.style.width = `${progress}%`;
            progressStatus.textContent = `Mengenali teks... (${progress}%)`;
          } else {
            // Mengubah status menjadi lebih mudah dibaca, cth: "loading_language_data" -> "Loading language data"
            const friendlyStatus = info.status.charAt(0).toUpperCase() + info.status.slice(1).replace(/_/g, ' ');
            progressStatus.textContent = friendlyStatus + "...";
          }
        }
      });

      try {
        const { data: { text } } = await worker.recognize(file);
        progressStatus.textContent = "✅ Ekstraksi Selesai!";
        ocrText = text;
        output.value = text;
        
        // Aktifkan tombol jika ada teks yang ditemukan
        const hasText = ocrText.trim().length > 0;
        if ('speechSynthesis' in window) {
            speakBtn.disabled = !hasText;
        } else {
            speakBtn.style.display = 'none'; // Sembunyikan jika tidak didukung
        }
        downloadBtn.disabled = !hasText;

      } catch (error) {
        progressStatus.textContent = "Gagal: " + error.message;
        console.error(error);
      } finally {
        await worker.terminate();
      }
    }

    function resetState() {
        output.value = '';
        progressBar.style.width = '0%';
        progressStatus.textContent = 'Menunggu gambar...';
        speakBtn.disabled = true;
        downloadBtn.disabled = true;
        ocrText = "";
    }

    // --- Button Functionality ---
    speakBtn.addEventListener('click', () => {
      if (!ocrText || !('speechSynthesis' in window)) return;
      speechSynthesis.cancel(); // Hentikan suara yang sedang berjalan
      const utterance = new SpeechSynthesisUtterance(ocrText);
      utterance.lang = langSelect.value;
      speechSynthesis.speak(utterance);
    });

    downloadBtn.addEventListener('click', () => {
      if (!ocrText) return;
      const blob = new Blob([ocrText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hasil-ocr.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
}