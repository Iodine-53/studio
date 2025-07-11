
"use client";

import { X, CheckSquare, Square, AlertTriangle, Download, Video, Info, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import React, { type FC, useRef, useEffect, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Bar, BarChart, Area, AreaChart, Line, LineChart, Pie, PieChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ReactSketchCanvas, type ReactSketchCanvasRef } from 'react-sketch-canvas';


type TiptapMark = {
    type: 'bold' | 'italic' | 'underline' | 'strike' | 'link' | 'textStyle';
    attrs?: Record<string, any>;
};

export type TiptapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
};

const renderNode = (node: TiptapNode, key: number) => <NodeRenderer key={key} node={node} />;

// Defensive renderNodes to prevent crashes on undefined content
const renderNodes = (nodes: TiptapNode[] | undefined) => (nodes || []).map(renderNode);


// New StaticDrawing component to render sketches in the print preview
const StaticDrawing: FC<{ node: TiptapNode }> = ({ node }) => {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const { paths, layout, textAlign } = node.attrs || {};
  const width = layout?.width || 100;
  const align = textAlign || 'left';

  const wrapperStyle: CSSProperties = {
    width: `${width}%`,
  };

  if (align === 'center') {
    wrapperStyle.margin = '0 auto';
  } else if (align === 'right') {
    wrapperStyle.marginLeft = 'auto';
  }

  useEffect(() => {
    if (canvasRef.current && paths) {
      try {
        const parsedPaths = JSON.parse(paths);
        if (Array.isArray(parsedPaths) && parsedPaths.length > 0) {
            canvasRef.current.loadPaths(parsedPaths);
        }
      } catch (e) {
        console.error('Failed to load drawing paths for print preview.', e);
      }
    }
  }, [paths]);

  return (
    <div style={wrapperStyle}>
      <div className="my-4 border rounded-lg overflow-hidden pointer-events-none">
        <ReactSketchCanvas
          ref={canvasRef}
          className="w-full aspect-[4/3]"
          canvasColor="white"
        />
      </div>
    </div>
  );
};


const NodeRenderer: FC<{ node: TiptapNode }> = ({ node }) => {
    // Base case: if it's a text node, start with the text content.
    // Otherwise, recursively render child nodes.
    let children: React.ReactNode = node.type === 'text'
        ? node.text
        : renderNodes(node.content);

    // Apply marks to the children.
    if (node.marks) {
        const textStyleAttrs: CSSProperties = {};
        // It's often better to apply styling marks first, then semantic ones.
        const marks = [...node.marks].reverse();

        for (const mark of marks) {
            switch (mark.type) {
                case 'textStyle':
                    if (mark.attrs?.color) textStyleAttrs.color = mark.attrs.color;
                    if (mark.attrs?.fontFamily) textStyleAttrs.fontFamily = mark.attrs.fontFamily;
                    if (mark.attrs?.fontSize) textStyleAttrs.fontSize = mark.attrs.fontSize;
                    break;
                case 'bold':
                    children = <strong>{children}</strong>;
                    break;
                case 'italic':
                    children = <em>{children}</em>;
                    break;
                case 'underline':
                    children = <u>{children}</u>;
                    break;
                case 'strike':
                    children = <s>{children}</s>;
                    break;
                case 'link':
                    children = <a href={mark.attrs?.href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    break;
            }
        }

        if (Object.keys(textStyleAttrs).length > 0) {
            children = <span style={textStyleAttrs}>{children}</span>;
        }
    }
    
    // If it's a text node, we've already processed it and its marks.
    if (node.type === 'text') {
        return <>{children}</>;
    }


  // Create a style object from node attributes for text alignment and line height.
  const style: CSSProperties = {};
  if (node.attrs?.textAlign) {
    style.textAlign = node.attrs.textAlign;
  }
  if (node.attrs?.lineHeight) {
    style.lineHeight = node.attrs.lineHeight;
  }
  const hasStyle = Object.keys(style).length > 0;

  // Common wrapper logic for resizable block nodes
  const { layout, textAlign } = node.attrs || {};
  const width = layout?.width || 100;
  const align = textAlign || 'left';

  const wrapperStyle: CSSProperties = {
      width: `${width}%`,
  };

  if (align === 'center') {
      wrapperStyle.marginLeft = 'auto';
      wrapperStyle.marginRight = 'auto';
  } else if (align === 'right') {
      wrapperStyle.marginLeft = 'auto';
      wrapperStyle.marginRight = '0';
  } else { // left
      wrapperStyle.marginLeft = '0';
      wrapperStyle.marginRight = 'auto';
  }

  switch (node.type) {
    case 'heading':
      const level = node.attrs?.level || 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag style={hasStyle ? style : undefined}>{children}</Tag>;
    case 'paragraph': {
      // A paragraph should not contain block-level children according to the HTML spec.
      // If the Tiptap JSON has a block node inside a paragraph, we render the paragraph as a <div>
      // to prevent an invalid HTML structure like <p><div>...</div></p>, which causes hydration errors.
      const hasBlockChild = (node.content || []).some(childNode =>
        [
          'image', 'chartBlock', 'drawing', 'todoList', 'callout',
          'horizontalRule', 'interactiveTable', 'embed', 'progressBarBlock',
          'table', 'bulletList', 'orderedList', 'taskList', 'codeBlock', 'blockquote',
          'toggle'
        ].includes(childNode.type)
      );

      const ParagraphTag = hasBlockChild ? 'div' : 'p';
      
      const content = children || (ParagraphTag === 'p' ? <br/> : null);

      return <ParagraphTag style={hasStyle ? style : undefined}>{content}</ParagraphTag>;
    }
    case 'image': {
      const { caption } = node.attrs;
      return (
        <div style={wrapperStyle}>
          <figure className="my-4">
            <img src={node.attrs?.src} alt={node.attrs?.alt || caption || ''} className="rounded-lg w-full block" />
            {caption && (
              <figcaption className="mt-2 text-center text-sm text-gray-600 italic">
                {caption}
              </figcaption>
            )}
          </figure>
        </div>
      );
    }
    case 'bulletList':
        return <ul className="list-disc pl-6">{children}</ul>;
    case 'orderedList':
        return <ol className="list-decimal pl-6">{children}</ol>;
    case 'listItem':
        return <li style={hasStyle ? style : undefined}>{children}</li>;
    case 'codeBlock':
        return <pre className="bg-muted text-muted-foreground p-4 rounded-md overflow-x-auto"><code>{children}</code></pre>
    case 'blockquote':
        return <blockquote className="border-l-4 border-muted-foreground pl-4 italic my-4">{children}</blockquote>;
    case 'horizontalRule':
        return <hr className="my-4"/>
    case 'hardBreak':
        return <br />;
    case 'tableHeader':
        return <th className="border p-2 font-bold text-left bg-muted">{children}</th>;
    case 'tableCell':
        return <td className="border p-2">{children}</td>;
    case 'taskList':
        return <ul className="pl-0 space-y-2 list-none">{children}</ul>;
    case 'taskItem':
        const isCompleted = node.attrs?.checked;
        return (
            <li className="flex items-start gap-2">
                {isCompleted ? <CheckSquare className="h-5 w-5 mt-1 text-primary flex-shrink-0"/> : <Square className="h-5 w-5 mt-1 text-muted-foreground flex-shrink-0"/>}
                <div className={cn(isCompleted && 'line-through text-muted-foreground')}>{children}</div>
            </li>
        );
    case 'callout': {
        const type = node.attrs?.type || 'info';
        const iconMap = {
            info: <Info className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0"/>,
            warning: <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0"/>,
            danger: <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0"/>,
            success: <CheckCircle className="h-5 w-5 text-green-500 mt-1 flex-shrink-0"/>,
        };
        
        return (
            <div className={cn("my-4 p-4 border-l-4 rounded-r-lg flex items-start gap-3",
                type === 'info' && "border-blue-400 bg-blue-50",
                type === 'warning' && "border-yellow-400 bg-yellow-50",
                type === 'danger' && "border-red-400 bg-red-50",
                type === 'success' && "border-green-400 bg-green-50",
            )}>
                {iconMap[type as keyof typeof iconMap]}
                <div>{children}</div>
            </div>
        );
    }
    case 'drawing':
      return <StaticDrawing node={node} />;
    
    case 'chartBlock': {
      try {
        const chartHeight = layout?.height || 320;
        const chartData = JSON.parse(node.attrs?.chartData || '[]').map((d: any) => {
            const dataPoint = {...d};
            Object.keys(dataPoint).forEach(key => {
                const num = parseFloat(dataPoint[key]);
                if (!isNaN(num)) dataPoint[key] = num;
            });
            return dataPoint;
        });
        const chartConfig = JSON.parse(node.attrs?.chartConfig || '{}');
        const chartType = node.attrs?.chartType || 'bar';
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
        
        const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : PieChart;
        const SeriesComponent = chartType === 'bar' ? Bar : chartType === 'line' ? Line : Area;
        
        let processedData = chartData;
        if (chartType === 'pie') {
            const { valueKey } = chartConfig;
            if (valueKey) {
                processedData = chartData.map((d: any) => ({ ...d, [valueKey]: Number(d[valueKey]) })).filter((d: any) => !isNaN(d[valueKey]) && d[valueKey] > 0);
            }
        }
        
        return (
          <div style={wrapperStyle}>
            <div className="my-4 p-4 border rounded-lg not-prose">
            <h4 className="font-bold text-lg mb-2">{node.attrs?.title}</h4>
            <div style={{ height: `${chartHeight}px` }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie data={processedData} dataKey={chartConfig.valueKey} nameKey={chartConfig.nameKey} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                        {processedData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip/>
                    <Legend/>
                    </PieChart>
                ) : (
                    <ChartComponent data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={chartConfig.xAxisKey} tick={{fontSize: 12}}/>
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip />
                    <Legend />
                    {(chartConfig.dataKeys || []).map((key: string, index: number) => (
                        <SeriesComponent key={key} dataKey={key} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                    ))}
                    </ChartComponent>
                )}
                </ResponsiveContainer>
            </div>
            </div>
          </div>
        );
      } catch(e) {
        return <div className="my-4 p-4 border rounded-lg text-center text-destructive">[Invalid Chart Data]</div>
      }
    }

    case 'todoList': {
        return (
            <div style={wrapperStyle}>
                <div className="my-4 p-4 border rounded-lg not-prose">
                    <h4 className="font-bold text-xl mb-2">{node.attrs?.title}</h4>
                    <ul className="space-y-2 list-none pl-0">
                        {(node.attrs?.tasks || []).map((task: any) => (
                            <li key={task.id} className="flex items-center gap-2">
                                {task.completed ? <CheckSquare className="h-5 w-5 text-primary flex-shrink-0"/> : <Square className="h-5 w-5 text-muted-foreground flex-shrink-0"/>}
                                <span className={cn(task.completed && 'line-through text-muted-foreground')}>
                                    {task.text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
    
    case 'interactiveTable': {
      try {
        const { title, headers: headersJson, data: dataJson } = node.attrs;
        const headers = JSON.parse(headersJson || '[]');
        const data = JSON.parse(dataJson || '[]');
    
        return (
          <div style={wrapperStyle}>
            <div className="my-4 not-prose">
              <h4 className="font-bold text-lg mb-2">{title}</h4>
              <div className="overflow-x-auto border rounded-lg printable-table-container">
                <table className="min-w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      {headers.map((header: string, i: number) => (
                        <th key={i} className="p-2 font-semibold border-b">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data || []).map((row: string[], i: number) => (
                      <tr key={i} className="border-b">
                        {(row || []).map((cell: string, j: number) => (
                          <td key={j} className="p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      } catch (e) {
        return <div className="my-4 p-4 border rounded-lg text-center text-destructive">[Invalid Table Data]</div>;
      }
    }

    case 'embed': {
      const { src } = node.attrs;
      
      return (
        <div style={wrapperStyle}>
          <div className="my-4 p-4 border rounded-lg not-prose text-center bg-muted/30">
              <Download className="inline-block h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-semibold">Embedded Content</p>
              <a href={src} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">
                  {src}
              </a>
              <p className="text-xs text-muted-foreground mt-2">(Link will open in a new tab)</p>
          </div>
        </div>
      );
    }

    case 'progressBarBlock': {
      const { title, items } = node.attrs;
      return (
        <div style={wrapperStyle}>
          <div className="my-4 p-4 border rounded-lg not-prose">
            <h4 className="font-bold text-lg mb-4">{title}</h4>
            <div className="space-y-4">
              {(items || []).map((bar: any) => (
                <div key={bar.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{bar.label}</span>
                    <span className="text-sm font-medium text-gray-600">{bar.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full"
                      style={{ width: `${bar.value}%`, backgroundColor: bar.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'toggle': {
      const { title, isOpen } = node.attrs;
      return (
        <div className="my-2 border rounded-lg">
          <div className="flex items-center gap-1 p-2 bg-muted/50 rounded-t-lg">
            <ChevronRight className={cn("h-5 w-5 text-muted-foreground transition-transform", isOpen && 'rotate-90')} />
            <span className="font-bold">{title}</span>
          </div>
          {isOpen && (
            <div className="p-2 pl-8 border-l-2 ml-3">
              {children}
            </div>
          )}
        </div>
      );
    }

    default:
      // Fallback for unknown nodes or nodes that only contain other nodes
      if (node.content && node.content.length > 0) {
        return <>{children}</>;
      }
      return null;
  }
};

export const DocumentRenderer: FC<{ content: TiptapNode[] | undefined }> = ({ content }) => {
  return <>{renderNodes(content)}</>;
};

type PrintPreviewProps = {
  isOpen: boolean;
  onClose: () => void;
  content: TiptapNode | null;
};

export const PrintPreview: FC<PrintPreviewProps> = ({ isOpen, onClose, content }) => {
  if (!isOpen || !content?.content) {
    return null;
  }
  
  const handleOpenInNewTab = () => {
    if (!content) {
      alert("Cannot open an empty document.");
      return;
    }
    localStorage.setItem('documentToPrint', JSON.stringify(content));
    const printWindow = window.open('/print', '_blank');
    if (!printWindow) {
      alert("Please allow popups to open the document in a new tab.");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full h-full" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-2 text-white bg-black/50 rounded-full hover:bg-black/80"
              title="Download or Print"
            >
              <Download size={24} />
              <span className="sr-only">Download or Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white bg-black/50 rounded-full hover:bg-black/80"
              title="Close preview"
            >
              <X size={24} />
              <span className="sr-only">Close preview</span>
            </button>
        </div>

        <div className="h-full w-full overflow-y-auto py-12 px-4">
          {/* A4 Page Simulation */}
          <div className="mx-auto w-[210mm] min-h-[297mm] bg-white p-16 shadow-2xl">
            <div className="prose prose-sm sm:prose-base max-w-none">
              {renderNodes(content.content)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
