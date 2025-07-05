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
} from 'docx';

// A generic type for a Tiptap node. Adjust as needed.
export type TiptapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string }[];
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


async function convertNodeToDocx(node: TiptapNode): Promise<Array<Paragraph | Table>> {
  switch (node.type) {
    case 'heading':
      const headingLevelKey = `HEADING_${node.attrs?.level}` as keyof typeof HeadingLevel;
      return [
        new Paragraph({
          children: node.content?.map(contentNode => new TextRun({
            text: contentNode.text || '',
            bold: contentNode.marks?.some(mark => mark.type === 'bold'),
            italics: contentNode.marks?.some(mark => mark.type === 'italic'),
          })) || [],
          heading: HeadingLevel[headingLevelKey],
          spacing: { after: 200 },
        }),
      ];

    case 'paragraph':
       return [
        new Paragraph({
          children: node.content?.map(contentNode => new TextRun({
            text: contentNode.text || '',
            bold: contentNode.marks?.some(mark => mark.type === 'bold'),
            italics: contentNode.marks?.some(mark => mark.type === 'italic'),
          })) || [],
          spacing: { after: 100 },
        }),
      ];
    
    case 'image':
      try {
        const imageBuffer = await getImageBuffer(node.attrs?.src);
        return [new Paragraph({
          children: [new ImageRun({
            data: imageBuffer,
            transformation: { width: 450, height: 300 }, // Adjust size as needed
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
    
    // Add more cases for your other custom nodes here (table, todoList, etc.)

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
    sections: [{
      properties: {},
      children: elements,
    }],
  });

  return Packer.toBlob(doc);
};
