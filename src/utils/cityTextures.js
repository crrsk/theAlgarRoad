import * as THREE from 'three';

const CANVAS_SIZE = 512;

function hexColor(value) {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function createCanvasTexture(draw, repeat = [1, 1]) {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  const context = canvas.getContext('2d');
  draw(context, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);

  return texture;
}

export function createFacadeTexture(baseColor, seed) {
  return createCanvasTexture((context, width, height) => {
    const brickWidth = 58 + (seed % 5) * 4;
    const brickHeight = 24 + (seed % 3) * 2;
    const mortar = 3;
    const rowCount = Math.ceil((height + brickHeight * 2) / (brickHeight + mortar));

    context.fillStyle = hexColor(baseColor);
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(16, 20, 28, 0.34)';
    context.fillRect(0, 0, width, height);

    Array.from({ length: rowCount }, (_, rowIndex) => {
      const y = -brickHeight + rowIndex * (brickHeight + mortar);
      const offset = rowIndex % 2 === 0 ? 0 : -(brickWidth + mortar) / 2;
      const columnCount = Math.ceil((width + brickWidth * 2) / (brickWidth + mortar));

      return Array.from({ length: columnCount }, (_, columnIndex) => {
        const x = offset - brickWidth + columnIndex * (brickWidth + mortar);
        const variation = ((x * 13 + y * 7 + seed * 17) % 28) - 14;
        const light = Math.max(0, Math.min(255, 92 + variation));
        const alpha = 0.34 + (Math.abs(variation) % 7) * 0.018;

        context.fillStyle = `rgba(${light}, ${light + 8}, ${light + 18}, ${alpha})`;
        context.fillRect(x, y, brickWidth, brickHeight);
        context.fillStyle = 'rgba(255, 255, 255, 0.035)';
        context.fillRect(x + 3, y + 3, brickWidth - 6, 2);

        return null;
      });
    });

    context.fillStyle = 'rgba(0, 0, 0, 0.18)';
    Array.from({ length: Math.ceil(height / (brickHeight + mortar)) }, (_, index) => {
      context.fillRect(0, index * (brickHeight + mortar), width, mortar);
      return null;
    });

    context.fillStyle = 'rgba(255, 255, 255, 0.055)';
    Array.from({ length: 260 }, (_, index) => {
      context.fillRect(
        (index * 37 + seed * 19) % width,
        (index * 53 + seed * 11) % height,
        1,
        1,
      );
      return null;
    });
  }, [1.8, 5]);
}

export function createRoadTexture(baseColor) {
  return createCanvasTexture((context, width, height) => {
    // 1. Base color
    context.fillStyle = hexColor(baseColor);
    context.fillRect(0, 0, width, height);

    // 2. High density noise for asphalt grain
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Random grain between -12 and +12
      const noise = (Math.random() - 0.5) * 24;
      data[i] = Math.max(0, Math.min(255, data[i] + noise));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
    }
    context.putImageData(imageData, 0, 0);

    // 3. Tire wear (faint darker vertical tracks)
    const trackGradient = context.createLinearGradient(0, 0, width, 0);
    trackGradient.addColorStop(0, 'rgba(0,0,0,0)');
    trackGradient.addColorStop(0.2, 'rgba(0,0,0,0.15)'); // Left lane left tire
    trackGradient.addColorStop(0.3, 'rgba(0,0,0,0.15)'); // Left lane right tire
    trackGradient.addColorStop(0.5, 'rgba(0,0,0,0)');
    trackGradient.addColorStop(0.7, 'rgba(0,0,0,0.15)'); // Right lane left tire
    trackGradient.addColorStop(0.8, 'rgba(0,0,0,0.15)'); // Right lane right tire
    trackGradient.addColorStop(1, 'rgba(0,0,0,0)');
    
    context.fillStyle = trackGradient;
    context.fillRect(0, 0, width, height);
    
    // 4. Random dark patches (resembling old asphalt/cracks)
    context.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 40; i++) {
      context.beginPath();
      const rX = Math.random() * width;
      const rY = Math.random() * height;
      const radius = Math.random() * 8 + 2;
      // Draw irregular blobs
      context.ellipse(rX, rY, radius, radius * (Math.random() + 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
  }, [1.2, 18]);
}

export function createSidewalkTexture() {
  return createCanvasTexture((context, width, height) => {
    context.fillStyle = '#8f979e';
    context.fillRect(0, 0, width, height);

    context.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    context.lineWidth = 3;
    Array.from({ length: Math.ceil(height / 82) + 1 }, (_, index) => {
      const y = index * 82;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
      return null;
    });

    context.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    context.lineWidth = 2;
    Array.from({ length: Math.ceil(width / 128) + 1 }, (_, index) => {
      const x = index * 128;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
      return null;
    });
  }, [1.2, 22]);
}

export function createGroundTexture(baseColor = 0x0f1115) {
  return createCanvasTexture((context, width, height) => {
    // 1. Base dark color
    context.fillStyle = hexColor(baseColor);
    context.fillRect(0, 0, width, height);

    // 2. Grainy noise (dark dirt/concrete look)
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 12;
      // Slight greenish/brownish tint to the noise
      data[i] = Math.max(0, Math.min(255, data[i] + noise + 2)); // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise + 4)); // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    }
    context.putImageData(imageData, 0, 0);

    // 3. Dark patches
    context.fillStyle = 'rgba(0, 0, 0, 0.25)';
    for (let i = 0; i < 50; i++) {
      context.beginPath();
      const rX = Math.random() * width;
      const rY = Math.random() * height;
      const radius = Math.random() * 15 + 5;
      context.ellipse(rX, rY, radius, radius * (Math.random() + 0.5), Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
  }, [12, 12]); // Repeat 12x12 over the entire plane
}
