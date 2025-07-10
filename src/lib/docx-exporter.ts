
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  ShadingType,
  BorderStyle,
  TextWrappingType,
  IParagraphOptions,
  ITableCellOptions,
} from 'docx';
import {
  Chart,
  LineController,
  BarController,
  PieController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

// Register all the components you use in your charts
Chart.register(
  LineController, BarController, PieController,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Tooltip, Legend, Title
);


// A generic type for a Tiptap node. Adjust as needed.
export type TiptapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
};

// Helper to fetch image data and convert to a buffer, handling both URLs and Base64
async function getImageBuffer(src: string): Promise<Buffer> {
  if (src.startsWith('data:image')) {
    // For Base64 images from uploads
    const base64Data = src.split(',')[1];
    return Buffer.from(base64Data, 'base64');
  }
  // For external URL images
  const response = await fetch(src);
  return Buffer.from(await response.arrayBuffer());
}

// New helper function to render a drawing to a Base64 image
const renderDrawingToImage = (pathsString: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(''); // Return empty string on failure
      return;
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const data = JSON.parse(pathsString || '[]'
);
    if (Array.isArray(data)) {
      data.forEach(path => {
        ctx.beginPath();
        ctx.strokeStyle = path.strokeColor;
        ctx.lineWidth = path.strokeWidth;
        if (path.paths) {
          path.paths.forEach((point: { x: number, y: number }, index: number) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
            } else {
              ctx.lineTo(point.x, point.y);
            }
          });
        }
        ctx.stroke();
      });
    }
    
    resolve(canvas.toDataURL('image/png'));
  });
};


// New helper function to render a chart to a Base64 image
export const renderChartToImage = (chartConfig: any): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve(''); // Return empty string on failure
      return;
    }

    const chart = new Chart(ctx, {
      type: chartConfig.type,
      data: chartConfig.data,
      options: {
        ...chartConfig.options,
        responsive: false,
        animation: {
          duration: 0 // Disable animations for instant rendering
        },
        // Ensure a background color for non-transparent export
        plugins: {
          ...chartConfig.options.plugins,
          // Add a custom plugin to draw a white background
          beforeDraw: (chart) => {
            const ctx = chart.canvas.getContext('2d');
            if (ctx) {
              ctx.save();
              ctx.globalCompositeOperation = 'destination-over';
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, chart.width, chart.height);
              ctx.restore();
            }
          }
        }
      }
    });

    // Use a short timeout to ensure the chart has rendered before exporting
    setTimeout(() => {
      const dataUrl = chart.toBase64Image();
      chart.destroy(); // Clean up the chart instance
      resolve(dataUrl);
    }, 100); // A small delay is sometimes needed
  });
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF5733', '#C70039', '#900C3F', '#581845'];

// A helper to draw a rounded rectangle, as ctx.roundRect is not universally supported.
const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    if (width < 0) width = 0;
    if (height < 0) height = 0;
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    if (radius < 0) radius = 0;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
};

const renderBarChartToImage = (title: string, items: any[]): Promise<string> => {
  return new Promise((resolve) => {
    const BAR_HEIGHT = 10;
    const PADDING = 20;
    const LABEL_HEIGHT = 20;
    const LINE_SPACING = 15; // Closer together
    const BLOCK_TITLE_HEIGHT = 40;
    const CANVAS_WIDTH = 600;

    const canvasHeight = PADDING + BLOCK_TITLE_HEIGHT + (items.length * (LABEL_HEIGHT + BAR_HEIGHT + LINE_SPACING)) - LINE_SPACING; // No spacing after last item
    
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      resolve('');
      return;
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, PADDING, PADDING);

    let currentY = PADDING + BLOCK_TITLE_HEIGHT;

    items.forEach(item => {
      // Draw label and percentage
      ctx.fillStyle = '#1F2937';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.label, PADDING, currentY);

      ctx.fillStyle = '#6B7280';
      ctx.textAlign = 'right';
      ctx.fillText(`${item.value}%`, CANVAS_WIDTH - PADDING, currentY);

      currentY += LABEL_HEIGHT;

      const barX = PADDING;
      const barCanvasWidth = CANVAS_WIDTH - (PADDING * 2);
      
      ctx.fillStyle = '#E5E7EB';
      drawRoundedRect(ctx, barX, currentY, barCanvasWidth, BAR_HEIGHT, 5);

      if (item.value > 0) {
        const barWidth = barCanvasWidth * (item.value / 100);
        ctx.fillStyle = item.color;
        drawRoundedRect(ctx, barX, currentY, barWidth, BAR_HEIGHT, 5);
      }
      
      currentY += BAR_HEIGHT + LINE_SPACING;
    });
    
    setTimeout(() => {
        resolve(canvas.toDataURL('image/png'));
    }, 100);
  });
};

function createTextRuns(node: TiptapNode): TextRun[] {
    return node.content?.flatMap(contentNode => {
        if (contentNode.type === 'hardBreak') {
            return new TextRun({ break: 1 });
        }

        const text = contentNode.text || '';
        if (!text) return [];

        const linkMark = contentNode.marks?.find(mark => mark.type === 'link');
        const href = linkMark?.attrs?.href;

        if (href) {
            return [new TextRun({
                children: [text],
                style: 'Hyperlink',
            })];
        }

        const textStyleMark = contentNode.marks?.find(mark => mark.type === 'textStyle');
        const color = textStyleMark?.attrs?.color?.substring(1);
        const fontFamily = textStyleMark?.attrs?.fontFamily;
        const fontSizePx = parseInt(textStyleMark?.attrs?.fontSize, 10);
        const size = !isNaN(fontSizePx) ? Math.round(fontSizePx * 1.5) : undefined; 

        return [new TextRun({
            text: text,
            bold: contentNode.marks?.some(mark => mark.type === 'bold'),
            italics: contentNode.marks?.some(mark => mark.type === 'italic'),
            underline: contentNode.marks?.some(mark => mark.type === 'underline') ? {} : undefined,
            strike: contentNode.marks?.some(mark => mark.type === 'strike'),
            color: color,
            font: fontFamily ? { name: fontFamily } : undefined,
            size: size,
        })];
    }) || [];
}

async function convertNodeToDocx(node: TiptapNode): Promise<Array<Paragraph | Table>> {
  switch (node.type) {
    case 'heading':
      const headingLevelKey = `HEADING_${node.attrs?.level}` as keyof typeof HeadingLevel;
      return [
        new Paragraph({
          children: createTextRuns(node),
          heading: HeadingLevel[headingLevelKey] || HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          alignment: node.attrs?.textAlign ? node.attrs.textAlign.toUpperCase() as AlignmentType : AlignmentType.LEFT,
        }),
      ];

    case 'paragraph':
       return [
        new Paragraph({
          children: createTextRuns(node).length > 0 ? createTextRuns(node) : [new TextRun('')],
          spacing: { after: 100 },
          alignment: node.attrs?.textAlign ? node.attrs.textAlign.toUpperCase() as AlignmentType : AlignmentType.LEFT,
        }),
      ];
    
    case 'image':
    case 'chartBlock':
    case 'drawing':
      try {
          let imageBuffer: Buffer;
          let nodeTitle = 'Image';
          const { layout, textAlign, caption } = node.attrs;
          
          const width = layout?.width || (node.type === 'chartBlock' ? 75 : 100);
          const align = textAlign || (node.type === 'chartBlock' ? 'left' : 'center');

          if (node.type === 'image') {
              if (!node.attrs?.src) {
                return [new Paragraph({ children: [new TextRun({ text: `[Empty Image]` })] })];
              }
              imageBuffer = await getImageBuffer(node.attrs?.src);
          } else if (node.type === 'drawing') {
              const drawingImageBase64 = await renderDrawingToImage(node.attrs?.paths);
              if (!drawingImageBase64) throw new Error("Drawing rendering returned empty.");
              imageBuffer = await getImageBuffer(drawingImageBase64);
          } else { // chartBlock
              const { chartData, chartConfig, chartType, title, viewConfig } = node.attrs;
              nodeTitle = title;
              const parsedData = JSON.parse(chartData || '[]').map((d: any) => {
                  const dataPoint = {...d};
                  Object.keys(dataPoint).forEach(key => {
                      const num = parseFloat(dataPoint[key]);
                      if (!isNaN(num)) dataPoint[key] = num;
                  });
                  return dataPoint;
              });

              const parsedConfig = JSON.parse(chartConfig || '{}');
              const parsedViewConfig = JSON.parse(viewConfig || '{}');
      
              if (parsedData.length === 0) {
                  return [new Paragraph({ children: [new TextRun({ text: `[Chart: ${nodeTitle} - No data]` })] })];
              }
              
              let finalData;
              if (chartType === 'pie') {
                  finalData = {
                      labels: parsedData.map((d: any) => d[parsedConfig.nameKey]),
                      datasets: [{ data: parsedData.map((d: any) => d[parsedConfig.valueKey]), backgroundColor: parsedData.map((_: any, i: number) => COLORS[i % COLORS.length]) }],
                  };
              } else {
                  finalData = {
                      labels: parsedData.map((d: any) => d[parsedConfig.xAxisKey]),
                      datasets: (parsedConfig.dataKeys || []).map((key: string, i: number) => ({
                          label: key, data: parsedData.map((d: any) => d[key] || 0),
                          backgroundColor: COLORS[i % COLORS.length] + '80', borderColor: COLORS[i % COLORS.length],
                          borderWidth: 1, fill: chartType === 'area',
                      })),
                  };
              }
              
              const finalChartConfig = {
                  type: chartType === 'area' ? 'line' : chartType,
                  data: finalData,
                  options: {
                      plugins: { title: { display: !!nodeTitle, text: nodeTitle, font: { size: 16 } }, legend: { display: parsedViewConfig.legend }, tooltip: { enabled: parsedViewConfig.tooltip } },
                      scales: chartType === 'pie' ? {} : { x: { grid: { display: parsedViewConfig.grid } }, y: { grid: { display: parsedViewConfig.grid }, beginAtZero: true } }
                  },
              };
              const chartImageBase64 = await renderChartToImage(finalChartConfig);
              if (!chartImageBase64) throw new Error("Chart rendering returned empty.");
              imageBuffer = await getImageBuffer(chartImageBase64);
          }
          
          const imageWidthInPixels = Math.floor(450 * (width / 100));
          const imageHeightInPixels = node.type === 'chartBlock'
            ? layout?.height || 320
            : Math.floor(300 * (width / 100)); // Rough aspect ratio for images/drawings

          const imageRun = new ImageRun({
            data: imageBuffer,
            transformation: { width: imageWidthInPixels, height: imageHeightInPixels },
          });

          let docxAlignment: AlignmentType;
          switch (align) {
              case 'center': docxAlignment = AlignmentType.CENTER; break;
              case 'right': docxAlignment = AlignmentType.RIGHT; break;
              default: docxAlignment = AlignmentType.LEFT;
          }

          const imageParagraph = new Paragraph({
              children: [imageRun],
              alignment: docxAlignment,
              spacing: { after: (caption && node.type === 'image') ? 50 : 200 },
          });
          
          const elements = [imageParagraph];

          if (caption && node.type === 'image') {
              const captionParagraph = new Paragraph({
                  children: [new TextRun({ text: caption, italics: true, size: 18 })],
                  alignment: docxAlignment,
                  spacing: { after: 200 },
              });
              elements.push(captionParagraph);
          }

          return elements;

      } catch (e) {
        console.error(`Error processing ${node.type} for DOCX:`, e);
        return [new Paragraph({ children: [ new TextRun({ text: `[${node.type} failed to load]` }) ]})];
      }

    case 'horizontalRule':
      return [new Paragraph({
        border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } },
      })];
    
    case 'codeBlock':
      const codeText = node.content?.map(n => n.text).join('\n') || '';
      return [new Paragraph({
          children: [new TextRun({ text: codeText, font: { name: 'Courier New' } })],
          shading: {
              type: ShadingType.CLEAR,
              fill: "F1F1F1",
          },
          spacing: { after: 200 }
      })];
    
    case 'blockquote':
      const blockquoteContent = (await Promise.all((node.content || []).map(convertNodeToDocx))).flat();
        blockquoteContent.forEach(p => {
          if (p instanceof Paragraph) {
            p.properties.indent = { left: 400 };
            p.properties.border = { left: { color: "auto", space: 4, style: BorderStyle.SINGLE, size: 4 } };
          }
        });
        return blockquoteContent;

    case 'interactiveTable': {
      try {
        const { title, headers: headersJson, data: dataJson } = node.attrs;
        const headers = JSON.parse(headersJson);
        const data = JSON.parse(dataJson);
    
        const titlePara = new Paragraph({
            children: [new TextRun({ text: title, bold: true })],
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 200 }
        });
    
        const headerRow = new TableRow({
            children: headers.map((header: string) => new TableCell({
                children: [new Paragraph(header)],
                shading: { fill: 'EFEFEF', type: ShadingType.CLEAR },
            })),
            tableHeader: true,
        });
        
        const dataRows = data.map((row: string[]) => new TableRow({
            children: row.map((cell: string) => new TableCell({
                children: [new Paragraph(cell || '')],
            })),
        }));
    
        const table = new Table({
            rows: [headerRow, ...dataRows],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });
    
        return [titlePara, table];
    
      } catch(e) {
          console.error('Error exporting interactive table to DOCX', e);
          return [new Paragraph({ text: '[Error rendering table]' })];
      }
    }

    case 'bulletList':
    case 'orderedList':
        const listItems = await Promise.all(
            (node.content || []).map(async (listItemNode) => {
                const itemParagraphs = (await Promise.all((listItemNode.content || []).map(convertNodeToDocx))).flat();
                
                itemParagraphs.forEach(p => {
                    if (p instanceof Paragraph) {
                        p.properties.numbering = node.type === 'orderedList' 
                            ? { reference: 'default-numbering', level: 0 } 
                            : undefined;
                        p.properties.bullet = node.type === 'bulletList' 
                            ? { level: 0 } 
                            : undefined;
                    }
                });
                return itemParagraphs;
            })
        );
        return listItems.flat();

    case 'taskList':
        return (await Promise.all((node.content || []).map(async taskItemNode => {
            const checkbox = taskItemNode.attrs?.checked ? '☑' : '☐';
            const textRuns = taskItemNode.content?.flatMap(p => p.content?.map(c => new TextRun({ text: c.text, strike: taskItemNode.attrs?.checked })) || []) || [];
            
            return new Paragraph({
                children: [new TextRun(`${checkbox} `), ...textRuns],
            });
        }))).flat();

    case 'callout': {
        const calloutContent = (await Promise.all((node.content || []).map(convertNodeToDocx))).flat();
        
        const type = node.attrs?.type || 'info';
        const colors = {
          info: { fill: 'E6F7FF', border: '91D5FF' },
          warning: { fill: 'FFFBE6', border: 'FFE58F' },
          danger: { fill: 'FFF1F0', border: 'FFA39E' },
          success: { fill: 'F6FFED', border: 'B7EB8F' }
        };
        const { fill, border } = colors[type as keyof typeof colors] || colors.info;

        return [new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
                children: [new TableCell({
                    children: calloutContent,
                    shading: { type: ShadingType.CLEAR, fill },
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.SINGLE, size: 6, color: border },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    },
                    margins: { left: 100, right: 100, top: 100, bottom: 100 }
                })]
            })]
        })];
    }
    
    case 'todoList': {
        const todoElements: Paragraph[] = [];
        todoElements.push(new Paragraph({
           children: [new TextRun({ text: node.attrs?.title, bold: true })],
           heading: HeadingLevel.HEADING_3,
           spacing: { after: 100 }
        }));
        for (const task of (node.attrs?.tasks || [])) {
           const checkbox = task.completed ? '☑' : '☐';
           todoElements.push(new Paragraph({
               children: [
                   new TextRun({ text: `${checkbox} ` }),
                   new TextRun({ text: task.text, strike: task.completed }),
               ]
           }));
        }
       // Wrap in a styled table cell
       return [new Table({
           width: { size: 100, type: WidthType.PERCENTAGE },
           rows: [new TableRow({
               children: [new TableCell({
                   children: todoElements,
                   shading: { fill: 'F5F5F5', type: ShadingType.CLEAR },
                   borders: {
                     top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                     bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                     left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                     right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                   },
                   margins: { top: 200, bottom: 200, left: 200, right: 200 }
               })]
           })]
       })];
     }

    case 'embed': {
      const { src } = node.attrs;
      if (!src) return [];
      
      const textRuns: TextRun[] = [
        new TextRun({
          text: `[Embedded Content: `,
        }),
        new TextRun({
          text: src,
          style: 'Hyperlink',
        }),
        new TextRun({
          text: `]`,
        }),
      ];

      return [
        new Paragraph({
          children: textRuns,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
      ];
    }

    case 'progressBarBlock': {
      try {
        const { title, items, layout, textAlign } = node.attrs;
        
        const imageBase64 = await renderBarChartToImage(title, items);
        if (!imageBase64) throw new Error("Progress bar rendering returned empty.");
        
        const imageBuffer = await getImageBuffer(imageBase64);
        
        const width = layout?.width || 100;
        const align = textAlign || 'center';
        
        const imageWidthInPixels = Math.floor(600 * (width / 100));

        // Calculate height based on aspect ratio of the generated canvas
        const BAR_HEIGHT = 10;
        const PADDING = 20;
        const LABEL_HEIGHT = 20;
        const LINE_SPACING = 15;
        const BLOCK_TITLE_HEIGHT = 40;
        const CANVAS_WIDTH = 600;
        
        const canvasHeight = PADDING + BLOCK_TITLE_HEIGHT + (items.length * (LABEL_HEIGHT + BAR_HEIGHT + LINE_SPACING)) - LINE_SPACING;
        const aspectRatio = canvasHeight / CANVAS_WIDTH;
        const imageHeightInPixels = Math.floor(imageWidthInPixels * aspectRatio);

        const imageRun = new ImageRun({
          data: imageBuffer,
          transformation: { 
            width: imageWidthInPixels, 
            height: imageHeightInPixels 
          },
        });
        
        let docxAlignment: AlignmentType;
        switch (align) {
            case 'center': docxAlignment = AlignmentType.CENTER; break;
            case 'right': docxAlignment = AlignmentType.RIGHT; break;
            default: docxAlignment = AlignmentType.LEFT;
        }

        return [new Paragraph({
            children: [imageRun],
            alignment: docxAlignment,
            spacing: { after: 200 },
        })];

      } catch (e) {
        console.error(`Error processing progressBarBlock for DOCX:`, e);
        return [new Paragraph({ children: [ new TextRun({ text: `[Progress Bar block failed to load]` }) ]})];
      }
    }

    default:
      if (node.content) {
        const children = await Promise.all(node.content.map(convertNodeToDocx));
        return children.flat();
      }
      return [];
  }
}

export const exportToDocx = async (docJson: TiptapNode) => {
  if (!docJson.content) {
    return new Blob();
  }

  const elements = (await Promise.all(docJson.content.map(convertNodeToDocx))).flat();

  const doc = new Document({
    styles: {
        hyperlink: {
            run: {
                color: "0563C1",
                underline: {},
            },
        },
    },
    numbering: {
      config: [
          {
              reference: 'default-numbering',
              levels: [
                  {
                      level: 0,
                      format: 'decimal',
                      text: '%1.',
                      alignment: AlignmentType.START,
                  },
              ],
          },
      ],
    },
    sections: [{
      properties: {},
      children: elements,
    }],
  });

  return Packer.toBlob(doc);
};
