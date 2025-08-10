document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const imageInput = document.getElementById('imageInput');
    const fileNameSpan = document.getElementById('fileName');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const aspectRatioCheckbox = document.getElementById('aspectRatio');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValueSpan = document.getElementById('qualityValue');
    const formatSelect = document.getElementById('formatSelect');
    const resizeBtn = document.getElementById('resizeBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    const originalPreview = document.getElementById('originalPreview');
    const originalImage = document.getElementById('originalImage');
    const originalInfo = document.getElementById('originalInfo');
    
    const resizedPreview = document.getElementById('resizedPreview');
    const resizedImage = document.getElementById('resizedImage');
    const resizedInfo = document.getElementById('resizedInfo');
    
    const imagePreviewContainer = document.querySelector('.image-preview-container');
    const placeholderText = document.getElementById('placeholder-text');

    // State
    let originalFile = null;
    let originalWidth, originalHeight;

    // --- Event Listeners ---
    
    // File Input Change
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        originalFile = file;
        fileNameSpan.textContent = file.name;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            originalImage.src = event.target.result;
            originalImage.onload = () => {
                originalWidth = originalImage.naturalWidth;
                originalHeight = originalImage.naturalHeight;

                widthInput.value = originalWidth;
                heightInput.value = originalHeight;

                originalInfo.textContent = `${originalWidth} x ${originalHeight} px`;
                
                placeholderText.style.display = 'none';
                imagePreviewContainer.style.display = 'flex';
                originalPreview.style.display = 'block';
                resizedPreview.style.display = 'none';
                downloadBtn.style.display = 'none';
                resizeBtn.disabled = false;
            };
        };
        reader.readAsDataURL(file);
    });

    // Aspect Ratio Logic
    widthInput.addEventListener('input', () => {
        if (aspectRatioCheckbox.checked && originalWidth && originalHeight) {
            const newWidth = parseInt(widthInput.value);
            if (!isNaN(newWidth) && newWidth > 0) {
                const newHeight = Math.round((newWidth / originalWidth) * originalHeight);
                heightInput.value = newHeight;
            }
        }
    });

    heightInput.addEventListener('input', () => {
        if (aspectRatioCheckbox.checked && originalWidth && originalHeight) {
            const newHeight = parseInt(heightInput.value);
            if (!isNaN(newHeight) && newHeight > 0) {
                const newWidth = Math.round((newHeight / originalHeight) * originalWidth);
                widthInput.value = newWidth;
            }
        }
    });

    // Quality Slider
    qualitySlider.addEventListener('input', () => {
        qualityValueSpan.textContent = parseFloat(qualitySlider.value).toFixed(1);
    });

    // Resize Button Click
    resizeBtn.addEventListener('click', () => {
        if (!originalFile) {
            alert('অনুগ্রহ করে প্রথমে একটি ছবি আপলোড করুন।');
            return;
        }

        const newWidth = parseInt(widthInput.value);
        const newHeight = parseInt(heightInput.value);
        const quality = parseFloat(qualitySlider.value);
        const format = formatSelect.value;
        const extension = format.split('/')[1];

        if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
            alert('সঠিক Width এবং Height দিন।');
            return;
        }

        // Create a canvas to draw the resized image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw the image
        ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

        // Get the data URL
        const dataUrl = canvas.toDataURL(format, quality);
        resizedImage.src = dataUrl;

        // Show resized preview
        resizedPreview.style.display = 'block';
        resizedInfo.textContent = `${newWidth} x ${newHeight} px`;
        
        // Prepare download link
        downloadBtn.href = dataUrl;
        downloadBtn.download = `resized-${Date.now()}.${extension.toLowerCase()}`;
        downloadBtn.style.display = 'block';
    });
});
