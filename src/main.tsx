import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure favicon is set as high-res PNG and SVG
if (typeof window !== 'undefined') {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 128, 128);
        const pngUrl = canvas.toDataURL('image/png');
        let link = document.querySelector("link[rel='icon'][type='image/png']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          document.head.appendChild(link);
        }
        link.href = pngUrl;
      }
    };
    img.src = '/favicon.svg';
  } catch {
    // Graceful fallback to static favicon.svg
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
