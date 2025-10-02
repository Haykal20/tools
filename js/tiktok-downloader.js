// js/tiktok-downloader.js

function initTikTokDownloader() {
    let currentSlides = [];
    let currentCaption = "";

    window.hideAllResultSections = function() {
        document.getElementById('tiktok-result').classList.remove('visible');
        ['captionSection', 'videoSection', 'slideshowSection', 'profileSection', 'tiktok-error'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
    }

    window.pasteFromClipboard = async function() {
        try {
            document.getElementById('tiktok-url').value = await navigator.clipboard.readText();
            toggleClearButton();
        } catch (err) { console.error('Gagal membaca clipboard: ', err); }
    }

    window.toggleClearButton = function() {
        const clearBtn = document.getElementById('clear-btn');
        const urlInput = document.getElementById('tiktok-url');
        if(clearBtn && urlInput) {
            clearBtn.classList.toggle('hidden', !urlInput.value);
        }
    }

    window.clearInput = function() {
        const urlInput = document.getElementById('tiktok-url');
        if(urlInput) urlInput.value = '';
        toggleClearButton();
    }

    window.downloadTikTok = async function() {
        const urlInputEl = document.getElementById('tiktok-url');
        const urlInput = urlInputEl ? urlInputEl.value.trim() : '';
        let url = urlInput.startsWith('@') ? `https://www.tiktok.com/${urlInput}` : urlInput;
        const loading = document.getElementById('tiktok-loading');
        const error = document.getElementById('tiktok-error');
        const errorMessage = document.getElementById('errorMessage');

        if (!url) {
            if(errorMessage) errorMessage.textContent = 'Tolong masukkan URL TikTok!';
            if(error) error.classList.remove('hidden');
            return;
        }

        hideAllResultSections();
        if(loading) loading.classList.remove('hidden');

        try {
            document.getElementById('loadingText').textContent = 'Menghubungi server...';
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`)}`);
            if (!response.ok) throw new Error(`Network error: ${response.status}`);
            
            document.getElementById('loadingText').textContent = 'Menerima data...';
            const resultData = JSON.parse((await response.json()).contents);
            if (resultData.code !== 0) throw new Error(resultData.msg || 'Gagal mengekstrak konten.');
            
            const content = resultData.data;
            let contentFound = false;
            currentCaption = content.title || "";

            if (currentCaption) {
                document.getElementById('captionText').textContent = currentCaption;
                document.getElementById('captionSection').classList.remove('hidden');
            }

            if (content.images && content.images.length > 0) {
                document.getElementById('videoSection').innerHTML = '';
                document.getElementById('slideshowSection').innerHTML = createSlideshowHTML();
                displaySlideshow(content);
                document.getElementById('slideshowSection').classList.remove('hidden');
                contentFound = true;
                saveToHistory({ url: urlInput, title: content.title, thumbnail: content.cover, type: 'slideshow' });
            } else if (content.play) {
                document.getElementById('slideshowSection').innerHTML = '';
                document.getElementById('videoSection').innerHTML = createVideoHTML();
                displayVideo(content);
                document.getElementById('videoSection').classList.remove('hidden');
                contentFound = true;
                saveToHistory({ url: urlInput, title: content.title, thumbnail: content.cover, type: 'video' });
            }

            if (content.author?.unique_id) {
                document.getElementById('profileSection').innerHTML = createProfileHTML();
                displayProfile(content.author);
                document.getElementById('profileSection').classList.remove('hidden');
            } else if (content.unique_id && !contentFound) {
                document.getElementById('profileSection').innerHTML = createProfileHTML();
                displayProfile(content);
                document.getElementById('profileSection').classList.remove('hidden');
                contentFound = true;
                saveToHistory({ url: urlInput, title: `@${content.unique_id}`, thumbnail: content.avatar, type: 'profile' });
            }

            if (contentFound) {
                document.getElementById('tiktok-result').classList.add('visible');
            } else {
                throw new Error('Tidak ada konten yang dapat diunduh.');
            }
        } catch (err) {
            errorMessage.textContent = `Error: ${err.message}`;
            error.classList.remove('hidden');
        } finally {
            if(loading) loading.classList.add('hidden');
        }
    }

    window.copyCaption = function() {
        navigator.clipboard.writeText(currentCaption).then(() => {
            const btnText = document.getElementById('copyBtnText');
            btnText.textContent = 'Berhasil disalin!';
            setTimeout(() => { btnText.textContent = 'Salin Caption'; }, 2000);
        });
    }

    const createVideoHTML = () => `<div class="bg-green-500/20 rounded-lg p-4 border border-green-400/30"><h3 class="text-green-100 font-semibold mb-4 flex items-center gap-2"><i class="fas fa-video"></i> Video Terdeteksi</h3><video id="preview" controls class="video-preview-large mb-4"></video><div class="grid grid-cols-1 md:grid-cols-2 gap-3"><a id="videoLink" download href="#" target="_blank" class="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-3 px-4 rounded-lg"><i class="fas fa-video"></i> Unduh Video</a><a id="audioLink" download href="#" target="_blank" class="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium py-3 px-4 rounded-lg"><i class="fas fa-music"></i> Unduh Audio</a></div></div>`;
    const createSlideshowHTML = () => `<div class="bg-yellow-500/20 rounded-lg p-4 border border-yellow-400/30"><h3 class="text-yellow-100 font-semibold mb-4 flex items-center gap-2"><i class="fas fa-images"></i> Slideshow Terdeteksi</h3><div class="mb-6"><img id="slidePreviewLarge" alt="Slide Preview" class="slide-preview-large mx-auto"><div class="flex justify-center mt-3"><span id="currentSlideInfo" class="text-yellow-200 text-sm"></span></div></div><div class="slide-container" id="slidesContainer"></div><div class="mt-4"><button onclick="downloadSlidesAsZip()" class="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-4 rounded-lg"><i class="fas fa-file-archive mr-2"></i> Unduh Semua (ZIP)</button></div></div>`;
    const createProfileHTML = () => `<div class="bg-indigo-500/20 rounded-lg p-4 border border-indigo-400/30"><h3 class="text-indigo-100 font-semibold mb-3 flex items-center gap-2"><i class="fas fa-user-circle"></i> Informasi Profil</h3><div class="flex items-center gap-4 mb-4"><img id="profileImage" alt="Profile" class="w-24 h-24 rounded-full border-4 border-white shadow-xl"><div class="min-w-0"><p id="username" class="text-white font-bold text-xl break-words"></p><p id="nickname" class="text-indigo-200 text-sm break-words"></p><p id="followers" class="text-indigo-300 text-xs mt-1"></p></div></div><a id="profileDownloadLink" download href="#" target="_blank" class="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold py-3 px-6 rounded-lg"><i class="fas fa-user"></i> Unduh Foto Profil</a></div>`;

    const displayVideo = (video) => { document.getElementById('preview').src = video.play; document.getElementById('videoLink').href = video.play; const audioLink = document.getElementById('audioLink'); audioLink.href = video.music; audioLink.classList.toggle('hidden', !video.music); }

    const displaySlideshow = (slideshow) => {
        currentSlides = slideshow.images || [];
        document.getElementById('slidePreviewLarge').src = currentSlides[0] || '';
        document.getElementById('currentSlideInfo').textContent = `Slide 1 dari ${currentSlides.length}`;
        const container = document.getElementById('slidesContainer');
        container.innerHTML = currentSlides.map((url, i) => `<img src="${url}" alt="Slide ${i + 1}" class="slide-image" onclick="changeSlide(${i})">`).join('');
        if (container.firstChild) container.firstChild.style.border = '3px solid #ff2a6d';
    }

    window.changeSlide = (index) => {
        document.getElementById('slidePreviewLarge').src = currentSlides[index];
        document.getElementById('currentSlideInfo').textContent = `Slide ${index + 1} dari ${currentSlides.length}`;
        document.querySelectorAll('.slide-image').forEach((thumb, i) => thumb.style.border = i === index ? '3px solid #ff2a6d' : '3px solid #fff');
    }

    window.downloadSlidesAsZip = async function() {
        const zip = new JSZip();
        const promises = currentSlides.map(async (url, index) => {
            const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
            const blob = await (await fetch(JSON.parse(await response.text()).contents)).blob();
            zip.file(`image_${index + 1}.jpeg`, blob);
        });
        await Promise.all(promises);
        zip.generateAsync({ type: 'blob' }).then(content => {
            saveAs(content, 'tiktok_slideshow.zip');
        });
    }

    const displayProfile = (author) => {
        document.getElementById('profileImage').src = author.avatar || '';
        document.getElementById('username').textContent = `@${author.unique_id || 'unknown'}`;
        document.getElementById('nickname').textContent = author.nickname || 'No name';
        document.getElementById('followers').textContent = author.follower_count ? `${formatNumber(author.follower_count)} followers` : '';
        document.getElementById('profileDownloadLink').href = author.avatar || '#';
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }

    const saveToHistory = (item) => {
        let history = JSON.parse(localStorage.getItem('tiktokHistory')) || [];
        history = history.filter(h => h.url !== item.url);
        history.unshift({ ...item, timestamp: new Date().getTime() });
        if (history.length > 5) history.pop();
        localStorage.setItem('tiktokHistory', JSON.stringify(history));
        loadHistory();
    }

    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem('tiktokHistory')) || [];
        const container = document.getElementById('historyContainer');
        if (!container) return;
        if (history.length === 0) { container.innerHTML = ''; return; }
        let historyHTML = `<div class="glass-card rounded-2xl p-4 mt-6"><div class="flex justify-between items-center mb-3"><h3 class="text-white font-semibold"><i class="fas fa-history mr-2"></i>Riwayat Terakhir</h3><button onclick="clearHistory()" class="text-purple-300 hover:text-white text-sm">Bersihkan</button></div><div class="space-y-2">`;
        history.forEach(item => {
            const icon = item.type === 'video' ? 'fa-video' : item.type === 'slideshow' ? 'fa-images' : 'fa-user';
            historyHTML += `<div onclick="reuseUrl('${item.url}')" class="flex items-center gap-3 p-2 rounded-lg bg-white/10 hover:bg-white/20 cursor-pointer transition-colors"><img src="${item.thumbnail}" onerror="this.src='https://placehold.co/40x40/ff2a6d/white?text=?';" class="w-10 h-10 rounded-md object-cover flex-shrink-0"><div class="min-w-0"><p class="text-white text-sm font-medium truncate">${item.title || item.url}</p><p class="text-purple-300 text-xs"><i class="fas ${icon} mr-1"></i> ${item.type}</p></div></div>`;
        });
        historyHTML += `</div></div>`;
        container.innerHTML = historyHTML;
    }

    window.reuseUrl = (url) => { document.getElementById('tiktok-url').value = url; toggleClearButton(); downloadTikTok(); }
    window.clearHistory = () => { localStorage.removeItem('tiktokHistory'); loadHistory(); }

    // Initial load of history when the view is shown
    loadHistory();
}
