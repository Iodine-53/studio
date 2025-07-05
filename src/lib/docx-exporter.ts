
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

    const data = JSON.parse(pathsString || '[]');
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

function createTextRuns(node: TiptapNode): TextRun[] {
    return node.content?.map(contentNode => {
        const text = contentNode.text || '';
        if (!text) return null; // Skip empty text nodes

        return new TextRun({
            text: text,
            bold: contentNode.marks?.some(mark => mark.type === 'bold'),
            italics: contentNode.marks?.some(mark => mark.type === 'italic'),
            underline: contentNode.marks?.some(mark => mark.type === 'underline') ? {} : undefined,
            strike: contentNode.marks?.some(mark => mark.type === 'strike'),
        });
    }).filter((run): run is TextRun => run !== null) || [];
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
          children: createTextRuns(node),
          spacing: { after: 100 },
          alignment: node.attrs?.textAlign ? node.attrs.textAlign.toUpperCase() as AlignmentType : AlignmentType.LEFT,
        }),
      ];
    
    case 'image':
      try {
        const imageBuffer = await getImageBuffer(node.attrs?.src);
        return [new Paragraph({
          children: [new ImageRun({
            data: imageBuffer,
            transformation: { width: 450, height: 300 },
          })],
          alignment: AlignmentType.CENTER,
        })];
      } catch (e) {
        console.error("Error processing image for DOCX:", e);
        return [new Paragraph({ children: [ new TextRun({ text: `[Image failed to load: ${node.attrs?.src}]` }) ]})];
      }

    case 'horizontalRule':
      return [new Paragraph({
        border: { bottom: { color: "auto", space: 1, style: "single", size: 6 } },
      })];
    
    case 'chartBlock':
      try {
        const { chartData, chartConfig, chartType, title, viewConfig } = node.attrs;
        const parsedData = JSON.parse(chartData || '[]');
        const parsedConfig = JSON.parse(chartConfig || '{}');
        const parsedViewConfig = JSON.parse(viewConfig || '{}');

        if (parsedData.length === 0) {
          return [new Paragraph({ children: [ new TextRun({ text: `[Chart: ${title} - No data]` }) ]})];
        }

        let finalData;

        if (chartType === 'pie') {
          const pieLabels = parsedData.map((d: any) => d[parsedConfig.nameKey]);
          const pieDatasetData = parsedData.map((d: any) => d[parsedConfig.valueKey]);
          finalData = {
            labels: pieLabels,
            datasets: [{
              data: pieDatasetData,
              backgroundColor: pieDatasetData.map((_: any, index: number) => COLORS[index % COLORS.length]),
            }],
          };
        } else { // bar, line, area
          const labels = parsedData.map((d: any) => d[parsedConfig.xAxisKey]);
          const datasets = (parsedConfig.dataKeys || []).map((key: string, index: number) => ({
            label: key,
            data: parsedData.map((d: any) => parseFloat(d[key]) || 0),
            backgroundColor: COLORS[index % COLORS.length] + '80',
            borderColor: COLORS[index % COLORS.length],
            borderWidth: 1,
            fill: chartType === 'area',
          }));
          finalData = { labels, datasets };
        }

        const finalChartConfig = {
          type: chartType === 'area' ? 'line' : chartType,
          data: finalData,
          options: {
            plugins: {
              title: { display: !!title, text: title, font: { size: 16 } },
              legend: { display: parsedViewConfig.legend },
              tooltip: { enabled: parsedViewConfig.tooltip }
            },
            scales: chartType === 'pie' ? {} : {
              x: { grid: { display: parsedViewConfig.grid } },
              y: { grid: { display: parsedViewConfig.grid } }
            }
          },
        };
        
        const chartImageBase64 = await renderChartToImage(finalChartConfig);
        if (!chartImageBase64) throw new Error("Chart rendering returned empty.");

        const imageBuffer = await getImageBuffer(chartImageBase64);
        return [new Paragraph({
          children: [new ImageRun({
            data: imageBuffer,
            transformation: { width: 450, height: 300 },
          })],
          alignment: AlignmentType.CENTER,
        })];
      } catch (e) {
        console.error("Error processing chart for DOCX:", e);
        return [new Paragraph({ children: [ new TextRun({ text: `[Chart failed to render]` }) ]})];
      }

    case 'drawing':
      try {
        const drawingImageBase64 = await renderDrawingToImage(node.attrs?.paths);
        if (!drawingImageBase64) throw new Error("Drawing rendering returned empty.");

        const imageBuffer = await getImageBuffer(drawingImageBase64);
        return [new Paragraph({
          children: [new ImageRun({
            data: imageBuffer,
            transformation: { width: 450, height: 300 },
          })],
          alignment: AlignmentType.CENTER,
        })];
      } catch (e) {
        console.error("Error processing drawing for DOCX:", e);
        return [new Paragraph({ children: [ new TextRun({ text: `[Drawing failed to render]` }) ]})];
      }

    case 'codeBlock':
      const codeText = node.content?.map(n => n.text).join('\n') || '';
      return [new Paragraph({
          children: [new TextRun({ text: codeText, font: { name: 'Courier New' } })],
          shading: {
              type: ShadingType.CLEAR,
              fill: "F1F1F1", // Light grey
          },
          spacing: { after: 200 }
      })];
    
    case 'table':
        const tableRows = await Promise.all(
            (node.content || []).map(async (rowNode) => {
                const cells = await Promise.all(
                    (rowNode.content || []).map(async (cellNode) => {
                        const cellContent = (await Promise.all((cellNode.content || []).map(convertNodeToDocx))).flat();
                        return new TableCell({
                            children: cellContent.length > 0 ? cellContent : [new Paragraph('')],
                            shading: cellNode.type === 'tableHeader' ? { fill: 'EFEFEF', type: ShadingType.CLEAR } : undefined,
                        });
                    })
                );
                return new TableRow({ children: cells });
            })
        );
        return [new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
        })];

    case 'bulletList':
    case 'orderedList':
        const listItems = await Promise.all(
            (node.content || []).map(async (listItemNode) => {
                const itemContent = createTextRuns(listItemNode);
                return new Paragraph({
                    children: itemContent,
                    bullet: node.type === 'bulletList' ? { level: 0 } : undefined,
                    numbering: node.type === 'orderedList' ? { reference: 'default-numbering', level: 0 } : undefined,
                });
            })
        );
        return listItems.flat();

    case 'taskList':
        return (await Promise.all((node.content || []).map(async taskItemNode => {
            const checkbox = taskItemNode.attrs?.checked ? '☑' : '☐';
            const textRuns = taskItemNode.content?.map(contentNode => new TextRun({
                text: contentNode.text || '',
                strike: taskItemNode.attrs?.checked,
            })) || [];
            
            return new Paragraph({
                children: [new TextRun(`${checkbox} `), ...textRuns],
            });
        }))).flat();

    case 'callout':
        const calloutContent = (await Promise.all((node.content || []).map(convertNodeToDocx))).flat();
        return [new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
                children: [new TableCell({
                    children: calloutContent,
                    shading: { type: ShadingType.CLEAR, fill: 'E6F7FF' },
                    borders: {
                        left: { style: BorderStyle.SINGLE, size: 6, color: '40A9FF' }
                    }
                })]
            })]
        })];
    
    case 'accordion':
        const accordionElements: Paragraph[] = [];
        accordionElements.push(new Paragraph({
            children: [new TextRun({ text: node.attrs?.title || 'Accordion', bold: true })],
            heading: HeadingLevel.HEADING_3,
        }));
        for (const item of (node.attrs?.items || [])) {
            accordionElements.push(new Paragraph({
                children: [new TextRun({ text: item.title, bold: true })],
                spacing: { before: 200 },
            }));
            accordionElements.push(new Paragraph({
                children: [new TextRun(item.content)],
            }));
        }
        return accordionElements;

    case 'todoList':
         const todoElements: Paragraph[] = [];
         todoElements.push(new Paragraph({
            children: [new TextRun({ text: node.attrs?.title, bold: true })],
            heading: HeadingLevel.HEADING_3,
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
         return todoElements;

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
    return new Blob(); // Return an empty blob if there's no content
  }

  const elements = (await Promise.all(docJson.content.map(convertNodeToDocx))).flat();

  const doc = new Document({
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
