
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

  // 1. Create a hidden container
  const printContainer = document.createElement('div');
  printContainer.id = 'pdf-export-container';
  document.body.appendChild(printContainer);

  // Style the container to be a printable A4 page, but off-screen
  Object.assign(printContainer.style, {
    position: 'absolute',
    left: '-9999px',
    top: '0',
    width: '210mm',
    minHeight: '297mm',
    backgroundColor: 'white',
    padding: '4rem', // Simulate padding from preview
  });

  // 2. Render the document content into the hidden container using React 18's createRoot
  const root = createRoot(printContainer);
  const printableElement = React.createElement(
    'div',
    { className: 'prose prose-sm sm:prose-base max-w-none' },
    React.createElement(DocumentRenderer, { content: documentJson.content })
  );
  
  root.render(printableElement);

  // --- Start of the fix ---
  // We must now patiently wait for two things:
  // 1. For React to finish rendering the content to the DOM.
  // 2. For all images within that content to finish loading.

  // Step 1: Wait for React to render. A short timeout allows the browser's event loop
  // to process React's asynchronous render update.
  await new Promise<void>((resolve) => setTimeout(resolve, 500));

  // Step 2: Now that the DOM is updated, find all images and wait for them.
  const images = Array.from(printContainer.getElementsByTagName('img'));
  const imageLoadPromises = images.map(img => {
    // If the image is already loaded (e.g., from cache or it's a data URL), we can resolve immediately.
    if (img.complete) {
      return Promise.resolve();
    }
    // Otherwise, we create a promise that resolves on the 'load' event.
    return new Promise<void>((resolve) => {
      img.onload = () => resolve();
      // We also resolve on error so that one broken image doesn't stop the entire export.
      img.onerror = () => {
        console.warn(`Could not load image: ${img.src}. It may be missing from the PDF.`);
        resolve(); 
      };
    });
  });

  // Wait for all the image loading promises to settle.
  await Promise.allSettled(imageLoadPromises);
  // --- End of the fix ---

  // 4. Configure and run html2pdf now that everything is ready
  const options = {
    margin: 10,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  await html2pdf().from(printContainer).set(options).save();

  // 5. Clean up
  root.unmount();
  printContainer.remove();
};
