// js/number-converter.js

function initNumberConverter() {
    const inputs = {
        text: document.getElementById('text-input'),
        dec: document.getElementById('decimal-input'),
        bin: document.getElementById('binary-input'),
        hex: document.getElementById('hex-input'),
        oct: document.getElementById('octal-input')
    };
    const clearBtn = document.getElementById('clear-converter-btn');
    
    // Check if elements exist
    if (!inputs.text || !clearBtn) return;
    
    let activeInput = null;

    const updateAll = (source, value) => {
        if (activeInput !== source) return;
        let textVal = '', decVal = '', binVal = '', hexVal = '', octVal = '';
        if (source === 'text') {
            if(value) {
               for (const char of value) {
                    const charCode = char.charCodeAt(0);
                    decVal += charCode + ' ';
                    binVal += charCode.toString(2).padStart(8, '0') + ' ';
                    hexVal += charCode.toString(16).toUpperCase().padStart(2, '0') + ' ';
                    octVal += charCode.toString(8).padStart(3, '0') + ' ';
                }
            }
            textVal = value;
        } else {
            const cleanedValue = value.replace(/\s+/g, '');
            if(cleanedValue) {
                const baseMap = { dec: 10, bin: 2, hex: 16, oct: 8 };
                const numbers = source === 'hex' ? cleanedValue.match(/[0-9a-fA-F]+/g) || [] : cleanedValue.match(/[0-9]+/g) || [];
                try {
                   const decValues = numbers.map(numStr => parseInt(numStr, baseMap[source]));
                   if (decValues.some(isNaN)) throw new Error("Invalid number");
                    decValues.forEach(dec => {
                        if (dec >= 0 && dec <= 0x10FFFF) { textVal += String.fromCodePoint(dec); }
                        decVal += dec + ' ';
                        binVal += dec.toString(2).padStart(8, '0') + ' ';
                        hexVal += dec.toString(16).toUpperCase().padStart(2, '0') + ' ';
                        octVal += dec.toString(8).padStart(3, '0') + ' ';
                    });
                } catch (e) {
                     Object.keys(inputs).forEach(key => { if(key !== source && key !== 'text') inputs[key].value = ''; });
                     inputs.text.value = 'Error';
                     return;
                }
            }
        }
        if (source !== 'text') inputs.text.value = textVal.trim();
        if (source !== 'dec') inputs.dec.value = decVal.trim();
        if (source !== 'bin') inputs.bin.value = binVal.trim();
        if (source !== 'hex') inputs.hex.value = hexVal.trim();
        if (source !== 'oct') inputs.oct.value = octVal.trim();
    };

    Object.entries(inputs).forEach(([name, element]) => {
        element.addEventListener('focus', () => activeInput = name);
        element.addEventListener('input', (e) => updateAll(name, e.target.value));
    });

    clearBtn.addEventListener('click', () => {
        Object.values(inputs).forEach(input => input.value = '');
    });
}
