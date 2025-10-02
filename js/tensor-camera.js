function initTensorCamera() {
    const video = document.getElementById('cameraFeed');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const startUI = document.getElementById('start-ui');
    const loadingUI = document.getElementById('loading');
    const statusText = document.getElementById('tensor-status'); // use the id defined in HTML
    
    // Pastikan elemen ada sebelum melanjutkan
    if (!video || !canvas || !startButton) {
        console.error("Elemen untuk mode kamera tidak ditemukan!");
        return;
    }

    let model = null;
    let lastSpoken = '';
    let speakTimeout = null;
    let animationFrameId = null;

    // Kamus dari file asli Anda
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

    function speak(text) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
    
    // Fungsi untuk menghentikan stream kamera, dipanggil oleh main.js
    window.stopTensorCameraStream = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
    };

    async function runDetection() {
        if (!model || !video.srcObject) return;
        const predictions = await model.detect(video);
        
        const aspectRatio = video.videoWidth / video.videoHeight;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientWidth / aspectRatio;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '16px Inter';
        context.textBaseline = 'top';

        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            const translatedClass = kamusIndonesia[prediction.class] || prediction.class;
            const score = Math.round(prediction.score * 100);

            // Scaling coordinates
            const scaleX = canvas.width / video.videoWidth;
            const scaleY = canvas.height / video.videoHeight;
            const drawX = x * scaleX;
            const drawY = y * scaleY;
            const drawWidth = width * scaleX;
            const drawHeight = height * scaleY;

            context.strokeStyle = '#00FFFF';
            context.lineWidth = 2;
            context.strokeRect(drawX, drawY, drawWidth, drawHeight);

            const text = `${translatedClass} (${score}%)`;
            const textWidth = context.measureText(text).width;
            context.fillStyle = '#00FFFF';
            context.fillRect(drawX, drawY, textWidth + 8, 24);
            context.fillStyle = '#000000';
            context.fillText(text, drawX + 4, drawY + 4);
        });

        if (predictions.length > 0) {
            const topPrediction = predictions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
            const translatedClass = kamusIndonesia[topPrediction.class] || topPrediction.class;

            if (topPrediction.score > 0.65 && translatedClass !== lastSpoken) {
                lastSpoken = translatedClass;
                clearTimeout(speakTimeout);
                speakTimeout = setTimeout(() => {
                    speak(`Ini ${translatedClass}`);
                }, 500);
            }
        } else {
            lastSpoken = '';
        }
        animationFrameId = requestAnimationFrame(runDetection);
    }

    startButton.addEventListener('click', async () => {
        startButton.classList.add('hidden');
        loadingUI.classList.remove('hidden');
        statusText.textContent = "Memuat model AI...";

        try {
            model = await cocoSsd.load();
            statusText.textContent = "Mengaktifkan kamera...";
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            video.srcObject = stream;

            video.onloadedmetadata = () => {
                startUI.classList.add('hidden');
                statusText.textContent = "Arahkan kamera ke objek";
                runDetection();
            };
        } catch (err) {
            console.error("Error:", err);
            statusText.textContent = "Gagal memuat. Coba lagi.";
            alert("Gagal memulai kamera atau model AI. Pastikan Anda memberikan izin akses kamera dan menggunakan koneksi HTTPS.");
            startButton.classList.remove('hidden');
            loadingUI.classList.add('hidden');
        }
    });
}