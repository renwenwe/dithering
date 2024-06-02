document.getElementById('process').addEventListener('click', () => {
  const input = document.getElementById('imageInput');
  const urlInput = document.getElementById('imageUrl').value;

  if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
          displayImageSize(e.target.result, 'inputSize', 'Input Image Size');
          processImage(e.target.result);
      }
      reader.readAsDataURL(input.files[0]);
  } else if (urlInput) {
      fetch(urlInput)
          .then(response => response.blob())
          .then(blob => {
              const reader = new FileReader();
              reader.onloadend = function () {
                  displayImageSize(reader.result, 'inputSize', 'Input Image Size');
                  processImage(reader.result);
              }
              reader.readAsDataURL(blob);
          })
          .catch(error => {
              console.error('Failed to load image from URL:', error);
              alert('Failed to load image from URL.');
          });
  } else {
      alert('Please upload an image file, enter an image URL, or drag and drop an image.');
  }
});

function processImage(src) {
  const img = new Image();
  img.crossOrigin = "Anonymous"; // Handle CORS for image URLs
  img.onload = function () {
      const canvas = document.getElementById('canvas');
      const context = canvas.getContext('2d');

      // Adjust image size (reduce resolution)
      const maxWidth = 300; // Further reduce width to 300px
      const scaleSize = maxWidth / img.width;
      const width = maxWidth;
      const height = img.height * scaleSize;

      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, 0, 0, width, height);

      let imageData = context.getImageData(0, 0, width, height);
      let grayscaleData = toGrayscale(imageData);
      let contrastedData = enhanceContrast(grayscaleData, 5); // Increase contrast by 3.5
      let ditheredData = applyDithering(contrastedData, width, height);
      context.putImageData(ditheredData, 0, 0);

      const outputImage = document.getElementById('outputImage');
      const dataURL = canvas.toDataURL('image/jpeg', 0.2); // Further reduce quality to 0.2
      outputImage.src = dataURL;
      outputImage.style.display = 'block';
      canvas.style.display = 'none';

      displayImageSize(dataURL, 'outputSize', 'Output Image Size');
  }
  img.onerror = function (error) {
      console.error('Failed to load image:', error);
      alert('Failed to process image.');
  };
  img.src = src;
}

function toGrayscale(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
  }
  return imageData;
}

function enhanceContrast(imageData, contrast) {
  const data = imageData.data;
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
      data[i] = truncate(factor * (data[i] - 128) + 128);
      data[i + 1] = truncate(factor * (data[i + 1] - 128) + 128);
      data[i + 2] = truncate(factor * (data[i + 2] - 128) + 128);
  }
  return imageData;
}

function truncate(value) {
  return Math.min(255, Math.max(0, value));
}

function applyDithering(imageData, width, height) {
  let data = imageData.data;
  for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
          let index = (y * width + x) * 4;
          let oldPixel = data[index];
          let newPixel = oldPixel < 128 ? 0 : 255;
          data[index] = newPixel;
          data[index + 1] = newPixel;
          data[index + 2] = newPixel;
          let quantError = oldPixel - newPixel;
          if (x + 1 < width) data[index + 4] += quantError * 7 / 16;
          if (x > 0 && y + 1 < height) data[index + (width - 1) * 4] += quantError * 3 / 16;
          if (y + 1 < height) data[index + width * 4] += quantError * 5 / 16;
          if (x + 1 < width && y + 1 < height) data[index + (width + 1) * 4] += quantError * 1 / 16;
      }
  }
  return imageData;
}

// Drag and Drop functionality
const dropZone = document.getElementById('dropZone');

dropZone.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropZone.style.borderColor = 'black';
});

dropZone.addEventListener('dragleave', (event) => {
  dropZone.style.borderColor = '#ccc';
});

dropZone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropZone.style.borderColor = '#ccc';

  const dt = event.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = function (e) {
          displayImageSize(e.target.result, 'inputSize', 'Input Image Size');
          processImage(e.target.result);
      }
      reader.readAsDataURL(files[0]);
  } else {
      const url = dt.getData('text/plain');
      if (url) {
          fetch(url)
              .then(response => response.blob())
              .then(blob => {
                  const reader = new FileReader();
                  reader.onloadend = function () {
                      displayImageSize(reader.result, 'inputSize', 'Input Image Size');
                      processImage(reader.result);
                  }
                  reader.readAsDataURL(blob);
              })
              .catch(error => {
                  console.error('Failed to load image from URL:', error);
                  alert('Failed to load image from URL.');
              });
      }
  }
});

function displayImageSize(dataURL, elementId, label) {
  const base64StringLength = dataURL.length - 'data:image/jpeg;base64,'.length;
  const sizeInBytes = (base64StringLength * (3/4)) - ((dataURL[dataURL.length - 2] === '=') ? 2 : (dataURL[dataURL.length - 1] === '=') ? 1 : 0);
  const sizeInKB = (sizeInBytes / 1024).toFixed(2);
  document.getElementById(elementId).innerText = `${label}: ${sizeInKB} KB`;
}
