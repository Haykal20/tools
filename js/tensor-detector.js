// js/tensor-detector.js

function initTensorDetector() {
    const appContainer = document.getElementById('app-container');
    let model = null;
    let modelStatus = 'loading'; // 'loading', 'loaded', 'error'

    // --- FUNGSI UTAMA UNTUK MEMUAT TAMPILAN ---
    async function loadTensorView(viewName) {
        try {
            const response = await fetch(`tools/${viewName}.html`);
            if (!response.ok) throw new Error(`Gagal memuat ${viewName}`);
            const html = await response.text();
            appContainer.innerHTML = html;
            lucide.createIcons();
            
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
        
        const backBtn = document.querySelector('.back-to-selection-btn');
        if (backBtn && typeof loadView === 'function') {
            // Menggunakan listener khusus agar tidak tumpang tindih dengan main.js
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (window.tensorCameraStream) {
                    window.tensorCameraStream.getTracks().forEach(track => track.stop());
                    window.tensorCameraStream = null;
                }
                loadView('tool-selection');
            });
        }
    }
    
    // --- FUNGSI UNTUK KEMBALI KE HALAMAN PEMILIH ---
    function attachBackToChooserListener() {
        document.querySelector('.back-to-chooser-btn')?.addEventListener('click', () => {
            if (typeof window.stopTensorDetection === 'function') {
                window.stopTensorDetection();
            }
            loadTensorView('tensor-chooser');
        });
    }

    // --- LOGIKA UNTUK MODE DETEKSI GAMBAR (Tidak ada perubahan) ---
    function initImageView() {
        attachBackToChooserListener();
        let lastPreds = [];
        const fileInput = document.getElementById('fileInput'), detectBtn = document.getElementById('detectBtn'), imageEl = document.getElementById('imageEl');
        const imagePlaceholder = document.getElementById('imagePlaceholder'), canvas = document.getElementById('canvas'), ctx = canvas.getContext('2d');
        const detList = document.getElementById('detList'), speakBtn = document.getElementById('speakBtn'), langSelect = document.getElementById('langSelect');
        const saveBtn = document.getElementById('saveBtn'), dropArea = document.getElementById('dropArea'), imageContainer = document.getElementById('imageContainer');
        const colors = ["#FF3838", "#FF9D97", "#FF701F", "#FFB21D", "#CFD231", "#48F28B", "#1F78D1", "#A45378", "#A37853"];
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e=>dropArea.addEventListener(e,ev=>{ev.preventDefault();ev.stopPropagation();},!1)),['dragenter', 'dragover'].forEach(e=>dropArea.addEventListener(e,()=>dropArea.classList.add('hover:border-amber-500','hover:bg-slate-800/50'),!1)),dropArea.addEventListener('drop',e=>handleFiles(e.dataTransfer.files),!1),dropArea.addEventListener('click',()=>fileInput.click()),fileInput.addEventListener('change',e=>handleFiles(e.target.files));
        function handleFiles(e){const t=e[0];if(t&&t.type.startsWith("image/")){const e=URL.createObjectURL(t);imageEl.onload=()=>imageContainer.style.aspectRatio=imageEl.naturalWidth/imageEl.naturalHeight,imageEl.src=e,imageEl.classList.remove('hidden'),imagePlaceholder.classList.add('hidden'),ctx.clearRect(0,0,canvas.width,canvas.height),detList.innerHTML='Klik "Deteksi Objek" untuk memproses gambar.',speakBtn.disabled=!0,saveBtn.disabled=!0,detectBtn.disabled=!1}}
        detectBtn.addEventListener('click',async()=>{if("loaded"===modelStatus&&imageEl.src){detectBtn.disabled=!0,detList.innerHTML="⏳ Menganalisis gambar...";try{const e=await model.detect(imageEl);lastPreds=e,renderDetections(e),autoSpeakResults(e),speakBtn.disabled=0===e.length,saveBtn.disabled=0===e.length}catch(e){console.error(e),detList.innerHTML="❌ Terjadi galat saat deteksi."}finally{detectBtn.disabled=!1}}else alert("Model belum siap."
        )});
        function renderDetections(e){detList.innerHTML=0===e.length?"Tidak ada objek yang terdeteksi.":"",e.sort((e,t)=>t.score-e.score).forEach((e,t)=>{const o=Math.round(100*e.score),s=colors[t%colors.length],a=document.createElement('div');a.className="result-box p-3 rounded-lg flex items-center gap-3 border",a.style.backgroundColor=`${s}20`,a.style.borderColor=s,a.innerHTML=`\n                  <div class="w-2 h-8 rounded" style="background-color: ${s};"></div>\n                  <span class="font-semibold text-slate-100">${e.class}</span>\n                  <span class="ml-auto text-sm font-medium text-slate-300">${o}% Akurasi</span>`,detList.appendChild(a)})}
        function autoSpeakResults(e){if(0===e.length)return speak("Tidak ada objek yang terdeteksi.");const t=[...new Set(e.map(e=>e.class))];speak(`Saya mendeteksi ${t.length} jenis objek: ${t.join(", ")}.`)}
        function speak(e){const t=new SpeechSynthesisUtterance(e);t.lang=langSelect.value,speechSynthesis.cancel(),speechSynthesis.speak(t)}
        speakBtn.addEventListener('click',()=>{if(lastPreds&&0!==lastPreds.length){const e=lastPreds.map(e=>`${e.class} ${Math.round(100*e.score)} persen`).join(", ");speak(`Objek terdeteksi: ${e}.`)}}),saveBtn.addEventListener('click',()=>{if(lastPreds&&0!==lastPreds.length){const e="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(lastPreds,null,2)),t=document.createElement('a');t.href=e,t.download=`hasil_deteksi_${Date.now()}.json`,t.click()}});
    }

    // --- LOGIKA UNTUK MODE DETEKSI KAMERA (INI YANG DIPERBAIKI) ---
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
        let lastSpoken = '', speakTimeout = null;

        const kamusIndonesia = {'person':'orang','bicycle':'sepeda','car':'mobil','motorcycle':'sepeda motor','airplane':'pesawat','bus':'bis','train':'kereta','truck':'truk','boat':'perahu','traffic light':'lampu lalu lintas','fire hydrant':'hidran','stop sign':'rambu berhenti','parking meter':'meteran parkir','bench':'bangku','bird':'burung','cat':'kucing','dog':'anjing','horse':'kuda','sheep':'domba','cow':'sapi','elephant':'gajah','bear':'beruang','zebra':'zebra','giraffe':'jerapah','backpack':'ransel','umbrella':'payung','handbag':'tas tangan','tie':'dasi','suitcase':'koper','frisbee':'frisbee','skis':'ski','snowboard':'papan seluncur','sports ball':'bola','kite':'layang-layang','baseball bat':'tongkat bisbol','baseball glove':'sarung tangan bisbol','skateboard':'papan luncur','surfboard':'papan selancar','tennis racket':'raket tenis','bottle':'botol','wine glass':'gelas anggur','cup':'gelas','fork':'garpu','knife':'pisau','spoon':'sendok','bowl':'mangkuk','banana':'pisang','apple':'apel','sandwich':'roti lapis','orange':'jeruk','broccoli':'brokoli','carrot':'wortel','hot dog':'hot dog','pizza':'pizza','donut':'donat','cake':'kue','chair':'kursi','couch':'sofa','potted plant':'tanaman pot','bed':'tempat tidur','dining table':'meja makan','toilet':'toilet','tv':'televisi','laptop':'laptop','mouse':'mouse','remote':'remote','keyboard':'keyboard','cell phone':'ponsel','microwave':'microwave','oven':'oven','toaster':'pemanggang roti','sink':'wastafel','refrigerator':'kulkas','book':'buku','clock':'jam','vase':'vas','scissors':'gunting','teddy bear':'boneka beruang','hair drier':'pengering rambut','toothbrush':'sikat gigi'};

        function speak(text) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 1.1; // Sedikit lebih cepat
            window.speechSynthesis.speak(utterance);
        }

        window.stopTensorDetection = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
                window.tensorCameraStream = null;
            }
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            if (speakTimeout) clearTimeout(speakTimeout);
            speechSynthesis.cancel();
        };

        async function runDetection() {
            if (!model || !stream || video.paused || video.ended) return;

            const predictions = await model.detect(video);
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.font = 'bold 16px Inter';
            context.textBaseline = 'top';

            predictions.forEach(p => {
                const [x, y, width, height] = p.bbox;
                const translatedClass = kamusIndonesia[p.class] || p.class;
                const score = Math.round(p.score * 100);
                const text = `${translatedClass} (${score}%)`;
                const textWidth = context.measureText(text).width;
                const textHeight = 16;

                // Koordinat untuk label (di atas kotak)
                let labelY = y - (textHeight + 8);
                if (labelY < 0) labelY = y + 4; // Jika mentok, taruh di dalam

                // PERBAIKAN: Menggambar latar belakang label agar mudah dibaca
                context.fillStyle = 'rgba(0, 255, 255, 0.75)'; // Cyan dengan transparansi
                context.fillRect(x, labelY, textWidth + 8, textHeight + 8);

                // PERBAIKAN: Menggambar teks di atas latar belakang
                context.fillStyle = '#000000'; // Teks hitam
                context.fillText(text, x + 4, labelY + 4);

                // PERBAIKAN: Menggambar kotak (bounding box)
                context.strokeStyle = '#00FFFF'; // Warna Cyan
                context.lineWidth = 3; // Garis lebih tebal
                context.strokeRect(x, y, width, height);
            });

            // PERBAIKAN: Mengembalikan logika suara yang cerdas
            if (predictions.length > 0) {
                const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
                const translatedClass = kamusIndonesia[topPrediction.class] || topPrediction.class;

                if (topPrediction.score > 0.70 && translatedClass !== lastSpoken) { // Score threshold dinaikkan
                    lastSpoken = translatedClass;
                    clearTimeout(speakTimeout);
                    speakTimeout = setTimeout(() => {
                        speak(`Itu ${translatedClass}`);
                    }, 400); // Jeda sedikit lebih pendek
                }
            } else {
                lastSpoken = '';
            }

            animationFrameId = requestAnimationFrame(runDetection);
        }

        startButton.addEventListener('click', async () => {
            startButton.classList.add('hidden');
            errorMessage.classList.add('hidden');
            loadingUI.classList.remove('hidden');
            statusText.textContent = "Mengaktifkan kamera...";

            try {
                if (modelStatus !== 'loaded') throw new Error("Model belum siap.");
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } });
                window.tensorCameraStream = stream;
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    startUI.classList.add('hidden');
                    statusText.textContent = "Arahkan kamera ke objek";
                    runDetection();
                };
            } catch (err) {
                statusText.textContent = "Gagal memuat. Coba lagi.";
                errorMessage.textContent = "Gagal memulai. Pastikan izin kamera diberikan & koneksi HTTPS.";
                errorMessage.classList.remove('hidden'); startButton.classList.remove('hidden'); loadingUI.classList.add('hidden');
            }
        });
    }


    // --- INISIALISASI UTAMA ---
    if (!model) {
        cocoSsd.load().then(m => {
            model = m;
            modelStatus = 'loaded';
            console.log("Model COCO-SSD berhasil dimuat.");
            loadTensorView('tensor-chooser');
        }).catch(err => {
            modelStatus = 'error';
            console.error("Gagal memuat model COCO-SSD:", err);
            appContainer.innerHTML = `<p class="text-red-500 text-center mt-10">Gagal memuat Model AI. Fitur ini tidak dapat digunakan.</p>`;
        });
    } else {
        loadTensorView('tensor-chooser');
    }
}