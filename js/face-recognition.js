async function initFaceRecognition() {
    // Muat script yang dibutuhkan secara dinamis
    await loadScript('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
    // Pastikan library face-api.js sudah dimuat
    if (typeof faceapi === 'undefined') {
        console.error("Library face-api.js tidak dimuat!");
        document.getElementById('initial-info').textContent = 'Error: Library face-api.js gagal dimuat.';
        return;
    }
    
    // --- DOM Elements ---
    const loader = document.getElementById('loader');
    const initialInfo = document.getElementById('initial-info');
    const personNameInput = document.getElementById('personName');
    const registerFileInput = document.getElementById('registerFile');
    const verifyFileInput = document.getElementById('verifyFile');
    const jsonFileInput = document.getElementById('jsonFile');
    const registerPreview = document.getElementById('registerPreview');
    const verifyPreview = document.getElementById('verifyPreview');
    const downloadBtn = document.getElementById('downloadBtn');
    const registerResultDiv = document.getElementById('registerResult');
    const verifyResultDiv = document.getElementById('verifyResult');
    const thresholdSlider = document.getElementById('threshold');
    const thresholdValueSpan = document.getElementById('thresholdValue');
    const knownFacesList = document.getElementById('known-faces-list');
    
    // Pastikan semua elemen ada
    if (!loader || !personNameInput || !registerFileInput || !jsonFileInput || !verifyFileInput) return;

    // --- State Variables ---
    let faceDatabase = {}; // { name: [descriptor1, descriptor2, ...] }
    let tempFaceDataForDownload = null;

    // --- Core Functions: Model Loading ---
    (async () => {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        initialInfo.textContent = 'Model siap digunakan.';
        initialInfo.className = 'face-rec-result success';
        loadFromLocalStorage();
      } catch (error) {
        initialInfo.textContent = 'Gagal memuat model AI.';
        initialInfo.className = 'face-rec-result error';
        console.error("Model loading error:", error);
      }
    })();

    function speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            window.speechSynthesis.speak(utterance);
        }
    }

    async function processImage(file, resultDiv) {
        resultDiv.style.display = 'none';
        loader.style.display = 'block';
        try {
            const img = await faceapi.bufferToImage(file);
            const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            loader.style.display = 'none';
            if (!detection) {
                resultDiv.textContent = 'Wajah tidak terdeteksi!';
                resultDiv.className = 'face-rec-result error';
                resultDiv.style.display = 'block';
                speak('Wajah tidak terdeteksi');
                return null;
            }
            return detection.descriptor;
        } catch (error) {
            loader.style.display = 'none';
            resultDiv.textContent = 'Error memproses gambar.';
            resultDiv.className = 'face-rec-result error';
            console.error("Image processing error:", error);
            return null;
        }
    }

    // --- Card 1: File Generation ---
    async function createFileFromImage(file) {
        const personName = personNameInput.value.trim();
        if (!personName) {
            registerResultDiv.textContent = 'Harap masukkan nama terlebih dahulu!';
            registerResultDiv.className = 'face-rec-result error';
            registerResultDiv.style.display = 'block';
            speak('Harap masukkan nama');
            registerFileInput.value = '';
            registerPreview.style.display = 'none';
            return;
        }
        
        const descriptor = await processImage(file, registerResultDiv);
        if (descriptor) {
            tempFaceDataForDownload = { name: personName, descriptor: descriptor };
            registerResultDiv.textContent = `File untuk "${personName}" siap diunduh.`;
            registerResultDiv.className = 'face-rec-result success';
            registerResultDiv.style.display = 'block';
            downloadBtn.disabled = false;
        } else {
            downloadBtn.disabled = true;
            tempFaceDataForDownload = null;
        }
    }

    window.downloadJSON = function() {
      if (!tempFaceDataForDownload) return;
      const dataStr = JSON.stringify({ 
          name: tempFaceDataForDownload.name, 
          descriptor: Array.from(tempFaceDataForDownload.descriptor) 
      });
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tempFaceDataForDownload.name.toLowerCase().replace(/\s/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    // --- Card 2: Database and Verification ---
    function addFaceToDatabase(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && data.descriptor && data.name) {
                    const newDescriptor = new Float32Array(data.descriptor);
                    if (faceDatabase[data.name]) {
                        faceDatabase[data.name].push(newDescriptor);
                        verifyResultDiv.textContent = `Foto baru untuk "${data.name}" berhasil ditambahkan!`;
                    } else {
                        faceDatabase[data.name] = [newDescriptor];
                        verifyResultDiv.textContent = `Wajah "${data.name}" berhasil ditambahkan!`;
                    }
                    saveToLocalStorage();
                    updateKnownFacesListUI();
                    verifyResultDiv.className = 'face-rec-result success';
                    verifyResultDiv.style.display = 'block';
                } else { throw new Error('Format JSON tidak valid.'); }
            } catch (err) {
                verifyResultDiv.textContent = 'Gagal memuat file JSON. ' + err.message;
                verifyResultDiv.className = 'face-rec-result error';
                verifyResultDiv.style.display = 'block';
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
    
    async function verifyFromImage(file) {
        if (Object.keys(faceDatabase).length === 0) {
            verifyResultDiv.textContent = 'Database wajah kosong. Tambahkan wajah dulu!';
            verifyResultDiv.className = 'face-rec-result error';
            verifyResultDiv.style.display = 'block';
            speak('Database kosong');
            return;
        }
        
        const unknownDescriptor = await processImage(file, verifyResultDiv);
        if (unknownDescriptor) {
            let bestMatch = { name: "Tidak Dikenal", distance: Infinity };
            for (const name in faceDatabase) {
                for (const knownDescriptor of faceDatabase[name]) {
                    const distance = faceapi.euclideanDistance(knownDescriptor, unknownDescriptor);
                    if (distance < bestMatch.distance) {
                        bestMatch = { name, distance };
                    }
                }
            }
            
            const threshold = parseFloat(thresholdSlider.value);
            if (bestMatch.distance < threshold) {
                verifyResultDiv.textContent = `Terverifikasi! Ini adalah ${bestMatch.name}. (Jarak: ${bestMatch.distance.toFixed(2)})`;
                verifyResultDiv.className = 'face-rec-result success';
                speak(`Ini adalah ${bestMatch.name}`);
            } else {
                verifyResultDiv.textContent = `Tidak Dikenal! Wajah tidak cocok dengan data di database. (Jarak terdekat: ${bestMatch.distance.toFixed(2)})`;
                verifyResultDiv.className = 'face-rec-result error';
                speak(`Wajah tidak dikenal`);
            }
            verifyResultDiv.style.display = 'block';
        }
    }

    // --- LocalStorage & UI ---
    function saveToLocalStorage() { /* ... (fungsi sama seperti di file Anda) ... */ }
    function loadFromLocalStorage() { /* ... (fungsi sama seperti di file Anda) ... */ }
    window.clearDatabase = function() { /* ... (fungsi sama seperti di file Anda) ... */ }
    function updateKnownFacesListUI() { /* ... (fungsi sama seperti di file Anda) ... */ }
    
    // --- Event Listeners ---
    thresholdSlider.addEventListener('input', (e) => {
        thresholdValueSpan.textContent = parseFloat(e.target.value).toFixed(2);
    });

    const handleFileChange = (event, previewElement, callback) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            previewElement.src = e.target.result;
            previewElement.style.display = 'block';
            if (callback) callback(file);
        };
        reader.readAsDataURL(file);
    };

    registerFileInput.addEventListener('change', (e) => handleFileChange(e, registerPreview, createFileFromImage));
    verifyFileInput.addEventListener('change', (e) => handleFileChange(e, verifyPreview, verifyFromImage));
    jsonFileInput.addEventListener('change', addFaceToDatabase);

    // --- Kode yang disalin dari file Anda ---
    function saveToLocalStorage(){const e={};for(const t in faceDatabase)e[t]=faceDatabase[t].map(e=>Array.from(e));localStorage.setItem("faceRecognitionDB_v2",JSON.stringify(e))}
    function loadFromLocalStorage(){const e=localStorage.getItem("faceRecognitionDB_v2");if(e){const t=JSON.parse(e);faceDatabase={};for(const o in t)faceDatabase[o]=t[o].map(e=>new Float32Array(e))}updateKnownFacesListUI()}
    window.clearDatabase=function(){confirm("Anda yakin ingin menghapus semua data wajah dari browser?")&&(faceDatabase={},localStorage.removeItem("faceRecognitionDB_v2"),updateKnownFacesListUI(),verifyResultDiv.textContent="Database telah dikosongkan.",verifyResultDiv.className="face-rec-result info",verifyResultDiv.style.display="block")}
    function updateKnownFacesListUI(){knownFacesList.innerHTML="";const e=Object.keys(faceDatabase);if(0===e.length)knownFacesList.innerHTML="<li>Database kosong.</li>";else e.forEach(e=>{const t=faceDatabase[e].length,o=document.createElement("li");o.textContent=`${e} (${t} foto)`,knownFacesList.appendChild(o)})}
}