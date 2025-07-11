import { type Editor } from '@tiptap/react';

// Helper function to fetch the content of a linked stylesheet
async function fetchCss(url: string): Promise<string> {
  try {
    // Use a cache-busting query parameter to ensure we get the latest styles
    const response = await fetch(`${url}?t=${new Date().getTime()}`);
    if (!response.ok) {
        console.error(`Failed to fetch CSS from ${url}: ${response.statusText}`);
        return '';
    }
    return await response.text();
  } catch (error) {
    console.error(`Error fetching CSS from ${url}`, error);
    return '';
  }
}

export const exportToHtml = async (editor: Editor): Promise<Blob> => {
  // 1. Get the basic HTML structure from Tiptap
  const editorHtml = editor.getHTML();
  
  // 2. Collect all CSS styles from the current page
  const styleSheets = Array.from(document.styleSheets);
  const cssPromises = styleSheets.map(sheet => {
    // Cross-origin stylesheets may have null href and can't be accessed, so we add a check.
    if (sheet.href && sheet.href.startsWith(window.location.origin)) {
      // It's a <link> stylesheet from the same origin, fetch its content
      return fetchCss(sheet.href);
    } else if (sheet.cssRules) {
      // It's an inline <style> tag or an accessible stylesheet
      try {
        return Promise.resolve(Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n'));
      } catch (e) {
        console.warn('Could not read CSS rules from stylesheet, possibly due to CORS.', sheet);
        return Promise.resolve('');
      }
    }
    return Promise.resolve('');
  });

  const allCss = (await Promise.all(cssPromises)).join('\n');

  // 3. Construct the full, self-contained HTML document
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Exported Document</title>
      <style>
        /* Embed all the collected CSS here */
        ${allCss}
        
        /* Add some basic page styles for the export */
        body {
          font-family: sans-serif;
          margin: 0 auto;
          padding: 2rem;
          max-width: 800px;
          background-color: #ffffff;
          color: #000000;
        }

        /* Ensure prose styles apply correctly */
        .prose {
          max-width: none;
        }
      </style>
    </head>
    <body>
      <!-- Apply the Tailwind Typography 'prose' class to the content -->
      <div class="prose prose-lg">
        ${editorHtml}
      </div>
    </body>
    </html>
  `;
  
  // 4. Create and return the Blob
  return new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
};
