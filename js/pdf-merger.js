function initPdfMerger() {
    // Check if the required library is loaded
    if (typeof window.jspdf === 'undefined') {
        console.error("jsPDF library is not loaded!");
        return;
    }
    const { jsPDF } = window.jspdf;

    const dropArea = document.getElementById("dropArea");
    const fileInput = document.getElementById("fileInput");
    const convertBtn = document.getElementById("convertBtn");
    const previewContainer = document.getElementById("preview-container");
    const statusDiv = document.getElementById("status");

    // Exit if elements are not found
    if (!dropArea || !fileInput || !convertBtn || !previewContainer || !statusDiv) {
        return;
    }

    let imageFiles = []; // Array of { file, url }

    // Drag & Drop event listeners
    ["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ["dragenter", "dragover"].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add("dragover"), false);
    });

    ["dragleave", "drop"].forEach(eventName => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove("dragover"), false);
    });

    dropArea.addEventListener("drop", handleDrop, false);
    dropArea.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileSelect);

    function handleDrop(e) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith("image/"));
      addImages(files);
    }

    function handleFileSelect(e) {
      const files = Array.from(e.target.files).filter(file => file.type.startsWith("image/"));
      addImages(files);
      e.target.value = ''; // Reset file input
    }

    function addImages(files) {
      if (files.length === 0) return;

      files.forEach(file => {
        const url = URL.createObjectURL(file);
        imageFiles.push({ file, url });
      });

      renderPreview();
      convertBtn.disabled = imageFiles.length === 0;
      showStatus(`✅ ${files.length} gambar ditambahkan!`, "success");
    }

    function renderPreview() {
      previewContainer.innerHTML = "";
      imageFiles.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "preview-item";
        div.draggable = true;
        div.dataset.index = index;

        div.innerHTML = `
          <span class="index">#${index + 1}</span>
          <img src="${item.url}" alt="Preview">
          <button class="remove" onclick="removeImage(${index})">×</button>
        `;

        // Drag events for reordering
        div.addEventListener("dragstart", handleDragStart);
        div.addEventListener("dragover", handleDragOver);
        div.addEventListener("drop", handleDropItem);
        div.addEventListener("dragend", handleDragEnd);

        previewContainer.appendChild(div);
      });
      // Re-initialize lucide icons if any were added dynamically (none in this case, but good practice)
      if(typeof lucide !== 'undefined') lucide.createIcons();
    }

    // Drag & Drop Reorder Logic
    let dragSrcEl = null;

    function handleDragStart(e) {
      dragSrcEl = this;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", this.innerHTML);
      this.style.opacity = "0.4";
    }

    function handleDragOver(e) {
      if (e.preventDefault) e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      return false;
    }

    function handleDropItem(e) {
      if (e.stopPropagation) e.stopPropagation();

      if (dragSrcEl !== this) {
        const srcIndex = parseInt(dragSrcEl.dataset.index);
        const destIndex = parseInt(this.dataset.index);

        // Swap items in the array
        const temp = imageFiles[srcIndex];
        imageFiles[srcIndex] = imageFiles[destIndex];
        imageFiles[destIndex] = temp;

        renderPreview();
      }
      return false;
    }

    function handleDragEnd() {
      this.style.opacity = "1";
    }

    // Make removeImage globally accessible for the onclick attribute
    window.removeImage = function(index) {
      URL.revokeObjectURL(imageFiles[index].url); // Clean up memory
      imageFiles.splice(index, 1);
      renderPreview();
      convertBtn.disabled = imageFiles.length === 0;
      showStatus("🗑️ Gambar dihapus.", "info");
      if (imageFiles.length === 0) {
        showStatus("Silakan tambahkan gambar untuk memulai.", "info");
      }
    }

    function showStatus(text, type) {
      statusDiv.textContent = text;
      statusDiv.className = type;
    }

    // Make convertToPDF globally accessible for the onclick attribute
    window.convertToPDF = async function() {
      if (imageFiles.length === 0) return;
      showStatus("🔄 Sedang membuat PDF...", "info");
      convertBtn.disabled = true;

      try {
        const pdf = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4"
        });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < imageFiles.length; i++) {
          if (i > 0) pdf.addPage();

          const img = new Image();
          img.src = imageFiles[i].url;
          await new Promise(resolve => img.onload = resolve);

          const imgRatio = img.width / img.height;
          const pdfRatio = pdfWidth / pdfHeight;

          let finalWidth, finalHeight;
          if (imgRatio > pdfRatio) {
            // Image is wider than the page, fit to width
            finalWidth = pdfWidth;
            finalHeight = pdfWidth / imgRatio;
          } else {
            // Image is taller than the page, fit to height
            finalHeight = pdfHeight;
            finalWidth = pdfHeight * imgRatio;
          }

          const x = (pdfWidth - finalWidth) / 2;
          const y = (pdfHeight - finalHeight) / 2;

          pdf.addImage(img, "JPEG", x, y, finalWidth, finalHeight);
        }
        const timestamp = new Date().getTime();
        pdf.save(`GambarGabungan_${timestamp}.pdf`);
        showStatus("✅ PDF berhasil dibuat dan diunduh!", "success");
      } catch (error) {
        console.error("Error creating PDF:", error);
        showStatus("❌ Gagal membuat PDF: " + (error.message || "Error tidak dikenal"), "error");
      } finally {
        convertBtn.disabled = false;
      }
    }
}