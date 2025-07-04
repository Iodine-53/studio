
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

    // Dynamically import to ensure they only run on the client
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');

    const exportContainer = document.createElement('div');
    document.body.appendChild(exportContainer);

    Object.assign(exportContainer.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '210mm', // Set a fixed width for consistent layout
        zIndex: '-1',
        opacity: '0',
        pointerEvents: 'none',
    });

    const PrintableDocument: React.FC = () => (
        <div className="bg-white">
            <div className="prose prose-sm sm:prose-base max-w-none">
                <DocumentRenderer content={documentJson.content!} />
            </div>
        </div>
    );

    const root = createRoot(exportContainer);
    await new Promise<void>((resolve) => {
        root.render(React.createElement(PrintableDocument));
        // A generous timeout to allow for rendering and image loading
        setTimeout(resolve, 500);
    });

    // STEP 1: CAPTURE WITH HTML2CANVAS
    const canvas = await html2canvas(exportContainer, {
        scale: 2, // Higher resolution for better quality
        useCORS: true,
    });
    
    // Clean up the DOM as early as possible
    root.unmount();
    exportContainer.remove();

    // STEP 2: COMPOSE WITH JSPDF
    const imgData = canvas.toDataURL('image/png');
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Create a PDF with the same dimensions as the captured canvas
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvasWidth, canvasHeight],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvasWidth, canvasHeight);

    // STEP 3: SAVE
    pdf.save(`${filename}.pdf`);
};
