document.addEventListener('DOMContentLoaded', function() {
  console.log('AR Picking Assistant page loaded.');

  // Example: Simulate picking route step click
  const routeSteps = document.querySelectorAll('.route-steps li');
  routeSteps.forEach((step, index) => {
    step.addEventListener('click', () => {
      alert(`Navigating to step ${index + 1}: ${step.textContent}`);
    });
  });

  // Barcode and Note Scanning Prototype
  const scanButton = document.createElement('button');
  scanButton.textContent = 'Start Scan';
  scanButton.style.marginTop = '20px';
  scanButton.style.padding = '10px 20px';
  scanButton.style.fontSize = '1rem';
  scanButton.style.cursor = 'pointer';

  const arVisualization = document.querySelector('.ar-visualization');
  arVisualization.appendChild(scanButton);

  scanButton.addEventListener('click', async () => {
    if (!('mediaDevices' in navigator) || !('getUserMedia' in navigator.mediaDevices)) {
      alert('Camera access is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.style.width = '100%';
      video.style.height = 'auto';
      arVisualization.innerHTML = '';
      arVisualization.appendChild(video);
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      await video.play();

      // Use BarcodeDetector if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] });
        const scanLoop = async () => {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
              alert('Barcode detected: ' + barcodes[0].rawValue);
              stream.getTracks().forEach(track => track.stop());
              arVisualization.innerHTML = '<p>Scan complete.</p>';
              return;
            }
          } catch (e) {
            console.error('Barcode detection error:', e);
          }
          requestAnimationFrame(scanLoop);
        };
        scanLoop();
      } else {
        // Fallback: simple note scanning simulation
        arVisualization.innerHTML = '<p>BarcodeDetector API not supported. Note scanning feature coming soon.</p>';
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      alert('Error accessing camera: ' + err.message);
    }
  });
});
