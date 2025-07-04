
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from 'react';
import { renderToString } from 'react-dom/server';
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

export const generatePrintableHtml = (documentJson: TiptapNode): string => {
  if (!documentJson?.content) {
    return '';
  }

  // 1. Render our React component to a static HTML string
  const documentHtml = renderToString(
    React.createElement('div', { className: 'prose prose-sm sm:prose-base' },
      React.createElement(DocumentRenderer, { content: documentJson.content })
    )
  );

  // 2. Create the full HTML document structure
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Print Preview</title>
        
        <!-- This is CRITICAL: It links to your compiled Tailwind CSS -->
        <link rel="stylesheet" href="/globals.css">
        
        <style>
          /* Basic print-friendly styles */
          @media print {
            body {
              -webkit-print-color-adjust: exact; /* Ensures colors print */
              print-color-adjust: exact;
            }
          }
          @page {
            size: A4;
            margin: 1in;
          }
          body {
            margin: 0;
            padding: 0;
            width: 210mm;
            min-height: 297mm;
            box-sizing: border-box; /* Ensure padding is included in width */
          }
        </style>
      </head>
      <body class="p-[1in] bg-white">
        ${documentHtml}
      </body>
    </html>
  `;
};
