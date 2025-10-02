function initTensorImage() {
    let model = null;
    let lastPreds = [];

    // Elemen DOM
    const modelStatusEl = document.getElementById('modelStatus');
    const fileInput = document.getElementById('fileInput');
    const detectBtn = document.getElementById('detectBtn');
    const imageEl = document.getElementById('imageEl');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const detList = document.getElementById('detList');
    const speakBtn = document.getElementById('speakBtn');
    const langSelect = document.getElementById('langSelect');
    const saveBtn = document.getElementById('saveBtn');
    const dropArea = document.getElementById('dropArea');
    const imageContainer = document.getElementById('imageContainer');
    
    // Pastikan elemen ada sebelum melanjutkan
    if (!modelStatusEl || !dropArea) {
        console.error("Elemen untuk mode gambar tidak ditemukan!");
        return;
    }

    const colors = ["#FF3838", "#FF9D97", "#FF701F", "#FFB21D", "#CFD231", "#48F28B", "#1F78D1", "#A45378", "#A37853"];

    cocoSsd.load().then(m => {
      model = m;
      modelStatusEl.textContent = '✅ Model AI Siap';
    }).catch(err => {
      console.error(err);
      modelStatusEl.textContent = '❌ Gagal memuat model AI';
    });
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
      document.body.addEventListener(eventName, preventDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add('drop-area-highlight'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove('drop-area-highlight'), false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    dropArea.addEventListener('drop', handleDrop, false);
    dropArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleDrop(e) {
      handleFiles(e.dataTransfer.files);
    }
    
    function handleFiles(files) {
        const f = files[0];
        if (!f || !f.type.startsWith("image/")) return;
        const url = URL.createObjectURL(f);
        imageEl.onload = () => { imageContainer.style.aspectRatio = imageEl.naturalWidth / imageEl.naturalHeight; };
        imageEl.src = url;
        imageEl.classList.remove('hidden');
        imagePlaceholder.classList.add('hidden');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        detList.innerHTML = 'Klik "Deteksi Objek" untuk memproses gambar.';
        speakBtn.disabled = true;
        saveBtn.disabled = true;
        detectBtn.disabled = false;
    }

    detectBtn.addEventListener('click', async () => {
      if (!model) return alert('Model belum siap.');
      if (!imageEl.src) return alert('Pilih gambar terlebih dahulu.');
      detectBtn.disabled = true;
      detList.innerHTML = '⏳ Menganalisis gambar...';
      await new Promise(resolve => {
        if (imageEl.complete && imageEl.naturalWidth > 0) resolve();
        else imageEl.onload = resolve;
      });
      try {
        const predictions = await model.detect(imageEl);
        lastPreds = predictions;
        renderDetections(predictions);
        autoSpeakResults(predictions);
        speakBtn.disabled = predictions.length === 0;
        saveBtn.disabled = predictions.length === 0;
      } catch (e) {
        console.error(e);
        detList.innerHTML = '❌ Terjadi galat saat deteksi.';
      } finally {
        detectBtn.disabled = false;
      }
    });

    function renderDetections(preds) {
      canvas.width = imageEl.naturalWidth;
      canvas.height = imageEl.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (preds.length === 0) {
        detList.innerHTML = 'Tidak ada objek yang terdeteksi.';
        return;
      }
      detList.innerHTML = '';
      preds.sort((a,b) => b.score - a.score);
      preds.forEach((p, i) => {
        const scorePct = Math.round(p.score * 100);
        const color = colors[i % colors.length];
        const div = document.createElement('div');
        div.className = 'result-box p-3 mb-2 rounded-lg flex items-center gap-3';
        div.style.backgroundColor = `${color}20`;
        div.innerHTML = `<div class="w-2 h-8 rounded" style="background-color: ${color};"></div><span class="font-semibold text-gray-800">${p.class}</span><span class="ml-auto text-sm font-medium text-gray-600">${scorePct}% Akurasi</span>`;
        detList.appendChild(div);
      });
    }

    function autoSpeakResults(preds) {
      if (preds.length === 0) { speak('Tidak ada objek yang terdeteksi.'); } 
      else {
        const uniqueClasses = [...new Set(preds.map(p => p.class))];
        const summary = `Saya mendeteksi ${uniqueClasses.length} jenis objek: ${uniqueClasses.join(', ')}.`;
        speak(summary);
      }
    }
    
    function speak(text) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = langSelect.value;
        speechSynthesis.cancel();
        speechSynthesis.speak(u);
    }
    
    speakBtn.addEventListener('click', () => {
        if (!lastPreds || lastPreds.length === 0) return;
        const top = lastPreds.map(p => `${p.class} ${Math.round(p.score*100)} persen`).join(', ');
        speak(`Objek terdeteksi: ${top}.`);
    });

    saveBtn.addEventListener('click', () => {
      if (!lastPreds || lastPreds.length === 0) return;
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lastPreds, null, 2));
      const a = document.createElement('a');
      a.href = dataStr;
      a.download = "hasil_deteksi.json";
      a.click();
    });
}