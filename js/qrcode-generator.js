function initQrCodeGenerator() {
    // Cek jika library ada
    if (typeof QRCodeStyling === 'undefined' || typeof window.jspdf === 'undefined') {
        console.error("Library QR Code atau jsPDF tidak dimuat!");
        return;
    }

    // Elemen DOM
    const qrInput = document.getElementById('qrInput');
    const colorDotsInput = document.getElementById('colorDots');
    const colorBgInput = document.getElementById('colorBg');
    const downloadPNGButton = document.getElementById('downloadPNG');
    const downloadPDFButton = document.getElementById('downloadPDF');
    const qrcodeContainer = document.getElementById('qrcode');
    const qrPlaceholder = document.getElementById('qrPlaceholder');
    
    // Pastikan semua elemen ditemukan
    if (!qrInput || !qrcodeContainer) return;

    // Inisialisasi objek QR Code dengan gaya modern
    const qrCode = new QRCodeStyling({
        width: 280,
        height: 280,
        type: "svg",
        data: "https://www.google.com",
        dotsOptions: {
            color: "#FFFFFF", // Default putih untuk tema gelap
            type: "rounded"
        },
        backgroundOptions: {
            color: "#1E293B", // Default latar Slate-800 untuk tema gelap
        },
        imageOptions: {
            crossOrigin: "anonymous",
            margin: 5
        },
        cornersSquareOptions: {
            type: "extra-rounded"
        },
        cornersDotOptions: {
            type: "dot"
        }
    });

    // Fungsi untuk update QR code
    const updateQrCode = () => {
        const text = qrInput.value.trim();
        const colorDots = colorDotsInput.value;
        const colorBg = colorBgInput.value;

        if (text === "") {
            qrcodeContainer.style.display = 'none';
            qrPlaceholder.style.display = 'block';
            downloadPNGButton.disabled = true;
            downloadPDFButton.disabled = true;
            return;
        }

        qrcodeContainer.style.display = 'block';
        qrPlaceholder.style.display = 'none';
        downloadPNGButton.disabled = false;
        downloadPDFButton.disabled = false;

        qrCode.update({
            data: text,
            dotsOptions: { color: colorDots },
            backgroundOptions: { color: colorBg }
        });
    };
    
    // Event Listeners untuk update otomatis
    qrInput.addEventListener('input', updateQrCode);
    colorDotsInput.addEventListener('input', updateQrCode);
    colorBgInput.addEventListener('input', updateQrCode);

    // Event Listeners untuk tombol download
    downloadPNGButton.addEventListener('click', () => {
        const filename = qrInput.value.trim().substring(0, 20).replace(/[^a-z0-9]/gi, '_') || 'qrcode';
        qrCode.download({ name: filename, extension: 'png' });
    });

    downloadPDFButton.addEventListener('click', async () => {
        const blob = await qrCode.getRawData('png');
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const qrSize = 80;
            const x = (pdfWidth - qrSize) / 2;
            const y = 40;

            pdf.addImage(img, 'PNG', x, y, qrSize, qrSize);
            const filename = qrInput.value.trim().substring(0, 20).replace(/[^a-z0-9]/gi, '_') || 'qrcode';
            pdf.save(`${filename}.pdf`);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    });

    // Generate QR code awal saat halaman dimuat
    qrInput.value = "https://google.com/";
    qrCode.append(qrcodeContainer);
    updateQrCode();
}