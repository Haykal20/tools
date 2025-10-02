// js/tensor-detector.js

function initTensorDetector() {
    const appContainer = document.getElementById('app-container');
    let model = null;
    let modelStatus = 'loading'; // 'loading', 'loaded', 'error'

    // Kamus terjemahan untuk mode kamera (jika diperlukan)
    const kamusIndonesia = {
        person: 'orang', bicycle: 'sepeda', car: 'mobil', motorcycle: 'sepeda motor',
        airplane: 'pesawat', bus: 'bis', train: 'kereta', truck: 'truk', boat: 'perahu',
        'traffic light': 'lampu lalu lintas', 'fire hydrant': 'hidran', 'stop sign': 'rambu berhenti',
        'parking meter': 'meteran parkir', bench: 'bangku', bird: 'burung', cat: 'kucing',
        dog: 'anjing', horse: 'kuda', sheep: 'domba', cow: 'sapi', elephant: 'gajah',
        bear: 'beruang', zebra: 'zebra', giraffe: 'jerapah', backpack: 'ransel',
        umbrella: 'payung', handbag: 'tas tangan', tie: 'dasi', suitcase: 'koper',
        frisbee: 'frisbee', skis: 'ski', snowboard: 'papan seluncur', 'sports ball': 'bola',
        kite: 'layang-layang', 'baseball bat': 'tongkat bisbol', 'baseball glove': 'sarung tangan bisbol',
        skateboard: 'papan luncur', surfboard: 'papan selancar', 'tennis racket': 'raket tenis',
        bottle: 'botol', 'wine glass': 'gelas anggur', cup: 'gelas', fork: 'garpu',
        knife: 'pisau', spoon: 'sendok', bowl: 'mangkuk', banana: 'pisang', apple: 'apel',
        sandwich: 'roti lapis', orange: 'jeruk', broccoli: 'brokoli', carrot: 'wortel',
        'hot dog': 'hot dog', pizza: 'pizza', donut: 'donat', cake: 'kue', chair: 'kursi',
        couch: 'sofa', 'potted plant': 'tanaman pot', bed: 'tempat tidur', 'dining table': 'meja makan',
        toilet: 'toilet', tv: 'televisi', laptop: 'laptop', mouse: 'mouse', remote: 'remote',
        keyboard: 'keyboard', 'cell phone': 'ponsel', microwave: 'microwave', oven: 'oven',
        toaster: 'pemanggang roti', sink: 'wastafel', refrigerator: 'kulkas', book: 'buku',
        clock: 'jam', vase: 'vas', scissors: 'gunting', 'teddy bear': 'boneka beruang',
        'hair drier': 'pengering rambut', toothbrush: 'sikat gigi'
    };

    // --- FUNGSI UTAMA UNTUK MEMUAT TAMPILAN ---
    async function loadTensorView(viewName) {
        try {
            const response = await fetch(`tools/${viewName}.html`);
            if (!response.ok) throw new Error(`Gagal memuat ${viewName}`);
            const html = await response.text();
            appContainer.innerHTML = html;
            lucide.createIcons();
            
            // Inisialisasi logika berdasarkan tampilan yang dimuat
            if (viewName === 'tensor-chooser') initChooserView();
            else if (viewName === 'tensor-camera') initCameraView();
            else if (viewName === 'tensor-image') initImageView();

        } catch (error) {
            console.error("Error loading tensor view:", error);
            appContainer.innerHTML = `<p class="text-red-500 text-center mt-10">Gagal memuat komponen. Silakan coba lagi.</p>`;
        }
    }

    // --- LOGIKA UNTUK HALAMAN PEMILIH MODE ---
    function initChooserView() {
        document.getElementById('select-camera-mode')?.addEventListener('click', () => loadTensorView('tensor-camera'));
        document.getElementById('select-image-mode')?.addEventListener('click', () => loadTensorView('tensor-image'));
        // Tombol kembali utama dihandle oleh main.js
        document.querySelector('.back-to-selection-btn')?.addEventListener('click', (e) => {
            // Hentikan deteksi / stream jika ada
            if (typeof window.stopTensorDetection === 'function') {
                try { window.stopTensorDetection(); } catch (err) { console.warn('stopTensorDetection error', err); }
            } else if (window.tensorCameraStream) {
                window.tensorCameraStream.getTracks().forEach(track => track.stop());
                window.tensorCameraStream = null;
            }
            // Navigasi kembali ke menu utama melalui loadView dari main.js
            if (typeof loadView === 'function') {
                loadView('tool-selection');
            } else {
                // Fallback: muat ulang halaman jika loadView tidak tersedia
                location.reload();
            }
        });
    }
    
    // --- FUNGSI UNTUK KEMBALI KE HALAMAN PEMILIH ---
    function attachBackToChooserListener() {
        document.querySelector('.back-to-chooser-btn')?.addEventListener('click', () => {
            // Hentikan fungsi spesifik mode sebelum kembali
            if (typeof window.stopTensorDetection === 'function') {
                window.stopTensorDetection();
            }
            loadTensorView('tensor-chooser');
        });
    }

    // --- LOGIKA UNTUK MODE DETEKSI GAMBAR ---
    function initImageView() {
        attachBackToChooserListener();
        let lastPreds = [];

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
        const colors = ["#FF3838", "#FF9D97", "#FF701F", "#FFB21D", "#CFD231", "#48F28B", "#1F78D1", "#A45378", "#A37853"];

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dropArea.addEventListener(e, ev => {
            ev.preventDefault();
            ev.stopPropagation();
        }, false));
        ['dragenter', 'dragover'].forEach(e => dropArea.addEventListener(e, () => dropArea.classList.add('hover:border-amber-500', 'hover:bg-slate-800/50'), false));
        dropArea.addEventListener('drop', e => handleFiles(e.dataTransfer.files), false);
        dropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => handleFiles(e.target.files));

        function handleFiles(files) {
            const f = files[0];
            if (!f || !f.type.startsWith("image/")) return;
            const url = URL.createObjectURL(f);
            imageEl.onload = () => imageContainer.style.aspectRatio = imageEl.naturalWidth / imageEl.naturalHeight;
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
            if (modelStatus !== 'loaded') return alert('Model belum siap.');
            if (!imageEl.src) return alert('Pilih gambar dahulu.');
            detectBtn.disabled = true;
            detList.innerHTML = '⏳ Menganalisis gambar...';
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
            detList.innerHTML = preds.length === 0 ? 'Tidak ada objek yang terdeteksi.' : '';
            preds.sort((a,b) => b.score - a.score).forEach((p, i) => {
                const scorePct = Math.round(p.score * 100);
                const color = colors[i % colors.length];
                const div = document.createElement('div');
                div.className = 'result-box p-3 rounded-lg flex items-center gap-3 border';
                div.style.backgroundColor = `${color}20`;
                div.style.borderColor = color;
                div.innerHTML = `
                  <div class="w-2 h-8 rounded" style="background-color: ${color};"></div>
                  <span class="font-semibold text-slate-100">${p.class}</span>
                  <span class="ml-auto text-sm font-medium text-slate-300">${scorePct}% Akurasi</span>`;
                detList.appendChild(div);
            });
        }

        function autoSpeakResults(preds) {
            if (preds.length === 0) return speak('Tidak ada objek yang terdeteksi.');
            const uniqueClasses = [...new Set(preds.map(p => p.class))];
            speak(`Saya mendeteksi ${uniqueClasses.length} jenis objek: ${uniqueClasses.join(', ')}.`);
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
            a.download = `hasil_deteksi_${Date.now()}.json`;
            a.click();
        });
    }

    // --- LOGIKA UNTUK MODE DETEKSI KAMERA ---
    function initCameraView() {
        attachBackToChooserListener();
        const video = document.getElementById('cameraFeed');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        const startButton = document.getElementById('startButton');
        const startUI = document.getElementById('start-ui');
        const loadingUI = document.getElementById('loading');
        const statusText = document.getElementById('tensor-status');
        const errorMessage = document.getElementById('tensor-error-message');
        let stream = null, animationFrameId = null;
        // state untuk pengumuman suara agar tidak bicara setiap frame
        let lastSpokenClasses = [];
        let lastSpeakTs = 0;
        const SPEAK_INTERVAL = 3000; // ms minimal antar pengumuman

        window.stopTensorDetection = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                window.tensorCameraStream = null;
            }
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            speechSynthesis.cancel();
        };

        async function runDetection() {
            if (!model || !stream) return;
            const predictions = await model.detect(video);
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.font = '16px Inter';

            predictions.forEach(p => {
                const [x, y, width, height] = p.bbox;
                const translatedClass = kamusIndonesia[p.class] || p.class;
                context.strokeStyle = '#00FFFF';
                context.lineWidth = 2;
                context.strokeRect(x, y, width, height);
                context.fillStyle = '#00FFFF';
                context.fillText(`${translatedClass} (${Math.round(p.score * 100)}%)`, x, y > 10 ? y - 5 : 10);
            });
+
+            // LOGIKA SUARA: ambil kelas unik dan bicara jika berubah / melewati interval
+            try {
+                const unique = [...new Set(predictions.map(p => p.class))];
+                const now = Date.now();
+                const sameAsLast = unique.length === lastSpokenClasses.length && unique.every(c => lastSpokenClasses.includes(c));
+                if (!sameAsLast && unique.length > 0 && (now - lastSpeakTs) > SPEAK_INTERVAL) {
+                    const translated = unique.map(c => kamusIndonesia[c] || c);
+                    const text = `Saya mendeteksi ${translated.length} jenis objek: ${translated.join(', ')}.`;
+                    const utter = new SpeechSynthesisUtterance(text);
+                    utter.lang = 'id-ID';
+                    // batalkan ucapan sebelumnya dan mulai yg baru
+                    try { speechSynthesis.cancel(); } catch(e) {}
+                    speechSynthesis.speak(utter);
+                    lastSpokenClasses = unique;
+                    lastSpeakTs = now;
+                } else if (unique.length === 0 && lastSpokenClasses.length > 0 && (now - lastSpeakTs) > SPEAK_INTERVAL) {
+                    // apabila sebelumnya ada objek lalu kini kosong, beri tahu sekali
+                    const utter = new SpeechSynthesisUtterance('Tidak ada objek terdeteksi.');
+                    utter.lang = 'id-ID';
+                    try { speechSynthesis.cancel(); } catch(e) {}
+                    speechSynthesis.speak(utter);
+                    lastSpokenClasses = [];
+                    lastSpeakTs = now;
+                }
+            } catch (e) {
+                console.warn('Speech synthesis error:', e);
+            }
+
            animationFrameId = requestAnimationFrame(runDetection);
        }

        startButton.addEventListener('click', async () => {
            startButton.classList.add('hidden');
            errorMessage.classList.add('hidden');
            loadingUI.classList.remove('hidden');
            statusText.textContent = "Memuat model AI...";

            try {
                if (modelStatus !== 'loaded') throw new Error("Model belum siap.");
                statusText.textContent = "Mengaktifkan kamera...";
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                window.tensorCameraStream = stream; // Simpan stream di global scope
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    startUI.classList.add('hidden');
                    statusText.textContent = "Arahkan kamera ke objek";
                    runDetection();
                };
            } catch (err) {
                statusText.textContent = "Gagal memuat. Coba lagi.";
                errorMessage.textContent = "Gagal memulai. Pastikan Anda memberi izin kamera & koneksi HTTPS.";
                errorMessage.classList.remove('hidden');
                startButton.classList.remove('hidden');
                loadingUI.classList.add('hidden');
            }
        });
    }


    // --- INISIALISASI UTAMA ---
    // Memuat model AI satu kali saja
    if (!model) {
        cocoSsd.load().then(m => {
            model = m;
            modelStatus = 'loaded';
            console.log("Model COCO-SSD berhasil dimuat.");
            // Setelah model siap, tampilkan halaman pilihan
            loadTensorView('tensor-chooser');
        }).catch(err => {
            modelStatus = 'error';
            console.error("Gagal memuat model COCO-SSD:", err);
            appContainer.innerHTML = `<p class="text-red-500 text-center mt-10">Gagal memuat Model AI. Fitur ini tidak dapat digunakan.</p>`;
        });
    } else {
        // Jika model sudah ada, langsung tampilkan pilihan
        loadTensorView('tensor-chooser');
    }
}