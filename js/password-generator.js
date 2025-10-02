// js/password-generator.js

function initPasswordGenerator() {
    const display = document.getElementById('password-output');
    const lengthSlider = document.getElementById('length-slider');
    const lengthDisplay = document.getElementById('length-display');
    const options = {
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        numbers: document.getElementById('numbers'),
        symbols: document.getElementById('symbols')
    };
    const generateBtn = document.getElementById('generate-password-btn');
    const copyBtn = document.getElementById('copy-password-btn');

    // Check if elements exist
    if(!display || !generateBtn) return;

    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    const generatePassword = () => {
        const length = parseInt(lengthSlider.value);
        let charset = Object.keys(options)
            .filter(key => options[key].checked)
            .map(key => charSets[key])
            .join('');
        
        if (charset === '') {
            display.value = 'Pilih minimal satu opsi';
            return;
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }
        display.value = password;
    };

    const copyPassword = () => {
        if (!display.value || display.value.startsWith('Pilih')) return;
        navigator.clipboard.writeText(display.value).then(() => {
            copyBtn.innerHTML = `<i data-lucide="check" class="w-5 h-5 text-green-400"></i>`;
            lucide.createIcons();
            setTimeout(() => {
                copyBtn.innerHTML = `<i data-lucide="clipboard" class="w-5 h-5"></i>`;
                lucide.createIcons();
            }, 1500);
        });
    };

    lengthSlider.addEventListener('input', () => lengthDisplay.value = lengthSlider.value);
    lengthDisplay.addEventListener('input', () => {
        let value = Math.min(64, Math.max(4, parseInt(lengthDisplay.value) || 4));
        lengthDisplay.value = value;
        lengthSlider.value = value;
    });

    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);

    // Generate a password on initial load
    generatePassword();
}
