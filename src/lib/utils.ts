
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { TiptapNode } from '@/components/PrintPreview';
import { DocumentRenderer } from '@/components/PrintPreview';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// This function takes a File, compresses it to WebP, and returns a Base64 string.
export const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1024; // You can set a max width for resizing
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Export the canvas to a WebP data URL with 80% quality
        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        resolve(webpDataUrl);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const exportToPdf = async (documentJson: TiptapNode, filename: string) => {
  if (!documentJson?.content) {
    console.error("No content to export");
    return;
  }
  
  // Dynamically import html2pdf.js only on the client-side
  const html2pdf = (await import('html2pdf.js')).default;

  // 1. Create a container
  const exportContainer = document.createElement('div');
  document.body.appendChild(exportContainer);

  // THE FINAL, ROBUST HIDING STYLES
  Object.assign(exportContainer.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '210mm',      // Must have a defined width for layout
    zIndex: '-1',         // Move it behind all other content
    opacity: '0',         // Make it fully transparent
    pointerEvents: 'none',// Prevent any interaction
  });

  // 2. Render the document content into the hidden container using React 18's createRoot
  const root = createRoot(exportContainer);
  const printableElement = React.createElement(
    'div',
    { className: 'bg-white p-[1in]' }, // Added background and padding here
    React.createElement(
      'div',
      { className: 'prose prose-sm sm:prose-base max-w-none' },
      React.createElement(DocumentRenderer, { content: documentJson.content })
    )
  );
  
  root.render(printableElement);

  // 3. THE CRITICAL FIX: Wait for React to render AND for all images to load
  await new Promise<void>((resolve) => setTimeout(resolve, 500)); // Wait for React's next tick

  const images = Array.from(exportContainer.getElementsByTagName('img'));
  const imageLoadPromises = images.map(img => {
    if (img.complete) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => {
        console.warn(`Could not load image: ${img.src}. It will be missing from the PDF.`);
        resolve(); // Resolve anyway so one broken image doesn't stop the whole export
      };
    });
  });

  await Promise.allSettled(imageLoadPromises);

  // 4. Configure and run html2pdf
  const options = {
    margin: 0, // Margins are handled by our 'p-[1in]' class
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().from(exportContainer).set(options).save();

  // 5. Clean up
  root.unmount();
  exportContainer.remove();
};
