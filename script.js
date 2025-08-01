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
    const qualityToggle = document.getElementById('qualityToggle');
    const qualityControls = document.getElementById('qualityControls');
    const sizeControls = document.getElementById('sizeControls');
    const targetSizeInput = document.getElementById('targetSizeInput');
    const sizeUnitSelect = document.getElementById('sizeUnitSelect');

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

    // --- Helper Functions ---

    // Function to calculate file size from data URL
    const calculateFileSize = (dataUrl) => {
        const base64 = dataUrl.split(',')[1];
        const bytes = atob(base64).length;
        return bytes;
    };

    // Function to resize image using binary search for quality
    const resizeImageToTargetSize = (newWidth, newHeight, format, targetBytes) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

            let low = 0, high = 1, mid, dataUrl, currentBytes;

            // Binary search for quality
            for (let i = 0; i < 10; i++) { // 10 iterations for good precision
                mid = (low + high) / 2;
                dataUrl = canvas.toDataURL(format, mid);
                currentBytes = calculateFileSize(dataUrl);

                if (currentBytes > targetBytes) {
                    high = mid;
                } else {
                    low = mid;
                }
            }

            // Final check and adjustment
            let finalQuality = high;
            dataUrl = canvas.toDataURL(format, finalQuality);
            currentBytes = calculateFileSize(dataUrl);

            // If the size is still too big, try a slightly lower quality
            if (currentBytes > targetBytes && finalQuality > 0.1) {
                finalQuality -= 0.05;
                dataUrl = canvas.toDataURL(format, finalQuality);
                currentBytes = calculateFileSize(dataUrl);
            }
            
            resolve({ dataUrl, finalBytes: currentBytes });
        });
    };

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

    // Toggle between quality and size controls
    qualityToggle.addEventListener('change', () => {
        if (qualityToggle.checked) {
            qualityControls.style.display = 'none';
            sizeControls.style.display = 'block';
        } else {
            qualityControls.style.display = 'block';
            sizeControls.style.display = 'none';
        }
    });

    // Quality Slider
    qualitySlider.addEventListener('input', () => {
        qualityValueSpan.textContent = parseFloat(qualitySlider.value).toFixed(1);
    });

    // Resize Button Click
    resizeBtn.addEventListener('click', async () => {
        if (!originalFile) {
            alert('অনুগ্রহ করে প্রথমে একটি ছবি আপলোড করুন।');
            return;
        }

        const newWidth = parseInt(widthInput.value);
        const newHeight = parseInt(heightInput.value);
        const format = formatSelect.value;
        const extension = format.split('/')[1];

        if (!newWidth || !newHeight || newWidth <= 0 || newHeight <= 0) {
            alert('সঠিক Width এবং Height দিন।');
            return;
        }
        
        let dataUrl, finalBytes;
        let resizedImageInfoText = '';

        if (qualityToggle.checked) { // User wants to resize by target size
            const targetSize = parseFloat(targetSizeInput.value);
            if (isNaN(targetSize) || targetSize <= 0) {
                alert('সঠিক টার্গেট ফাইল সাইজ দিন।');
                return;
            }

            let targetBytes = targetSize;
            if (sizeUnitSelect.value === 'mb') {
                targetBytes *= 1024 * 1024;
            } else {
                targetBytes *= 1024;
            }

            // PNG format doesn't support quality, so we fall back to JPEG/WEBP
            if (format === 'image/png') {
                alert('PNG ফরম্যাট ফাইল সাইজ রিসাইজিং সাপোর্ট করে না। JPEG বা WEBP ব্যবহার করুন।');
                return;
            }

            const result = await resizeImageToTargetSize(newWidth, newHeight, format, targetBytes);
            dataUrl = result.dataUrl;
            finalBytes = result.finalBytes;

            const finalSizeKB = (finalBytes / 1024).toFixed(2);
            resizedImageInfoText = `${newWidth} x ${newHeight} px | ${finalSizeKB} KB`;

        } else { // User wants to resize by quality slider
            const quality = parseFloat(qualitySlider.value);
            
            // Create a canvas to draw the resized image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = newWidth;
            canvas.height = newHeight;
            ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

            dataUrl = canvas.toDataURL(format, quality);
            finalBytes = calculateFileSize(dataUrl);
            
            if (format === 'image/png') {
                resizedImageInfoText = `${newWidth} x ${newHeight} px`;
            } else {
                const finalSizeKB = (finalBytes / 1024).toFixed(2);
                resizedImageInfoText = `${newWidth} x ${newHeight} px | ${finalSizeKB} KB`;
            }
        }
        
        resizedImage.src = dataUrl;
        resizedPreview.style.display = 'block';
        resizedInfo.textContent = resizedImageInfoText;

        // Prepare download link
        downloadBtn.href = dataUrl;
        downloadBtn.download = `resized-${Date.now()}.${extension.toLowerCase()}`;
        downloadBtn.style.display = 'block';
    });
});
