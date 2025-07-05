
"use client";

import { X, CheckSquare, Square, AlertTriangle, ExternalLink } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";
import { Bar, BarChart, Area, AreaChart, Line, LineChart, Pie, PieChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type TiptapMark = {
    type: 'bold' | 'italic' | 'underline' | 'strike';
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

const renderNodes = (nodes: TiptapNode[] | undefined) => nodes?.map(renderNode);

const NodeRenderer: FC<{ node: TiptapNode }> = ({ node }) => {
    let children = renderNodes(node.content);

    if (node.marks) {
        for (const mark of node.marks) {
            switch(mark.type) {
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
            }
        }
    }

  switch (node.type) {
    case 'heading':
      const level = node.attrs?.level || 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag>{children}</Tag>;
    case 'paragraph':
      return <p>{children || <br/>}</p>;
    case 'text':
      return <>{node.text}</>;
    case 'image': {
      const layout = node.attrs?.layout || {};
      return (
        <div data-align={layout.align || 'center'} data-width={layout.width || 'default'} className="layout-wrapper">
          <img src={node.attrs?.src} alt={node.attrs?.alt || ''} className="max-w-full my-4 rounded-lg" />
        </div>
      );
    }
    case 'bulletList':
        return <ul className="list-disc pl-6">{children}</ul>;
    case 'orderedList':
        return <ol className="list-decimal pl-6">{children}</ol>;
    case 'listItem':
        return <li>{children}</li>;
    case 'codeBlock':
        return <pre className="bg-muted text-muted-foreground p-4 rounded-md overflow-x-auto"><code>{children}</code></pre>
    case 'horizontalRule':
        return <hr className="my-4"/>
    case 'table':
        return <table className="w-full my-4 border-collapse"><tbody>{children}</tbody></table>;
    case 'tableRow':
        return <tr className="border-b">{children}</tr>;
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
    case 'callout':
        return (
            <div className={cn("my-4 p-4 border-l-4 rounded-r-lg flex items-start gap-3",
                node.attrs?.type === 'info' && "border-blue-400 bg-blue-50",
                node.attrs?.type === 'warning' && "border-yellow-400 bg-yellow-50",
                node.attrs?.type === 'danger' && "border-red-400 bg-red-50",
                node.attrs?.type === 'success' && "border-green-400 bg-green-50",
            )}>
                <AlertTriangle className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                <div>{children}</div>
            </div>
        );
    case 'drawing': {
      const layout = node.attrs?.layout || {};
      return (
        <div data-align={layout.align || 'center'} data-width={layout.width || 'default'} className="layout-wrapper">
          <div className="my-4 p-4 border rounded-lg text-center text-muted-foreground w-full">[Drawing Content]</div>
        </div>
      );
    }
    
    case 'chartBlock': {
      try {
        const layout = node.attrs?.layout || {};
        const chartData = JSON.parse(node.attrs?.chartData || '[]');
        const chartConfig = JSON.parse(node.attrs?.chartConfig || '{}');
        const chartType = node.attrs?.chartType || 'bar';
        const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
        
        const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : PieChart;
        const SeriesComponent = chartType === 'bar' ? Bar : chartType === 'line' ? Line : Area;
        
        return (
          <div data-align={layout.align || 'center'} data-width={layout.width || 'default'} className="layout-wrapper">
            <div className="my-4 p-4 border rounded-lg not-prose w-full">
              <h4 className="font-bold text-lg mb-2">{node.attrs?.title}</h4>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'pie' ? (
                    <PieChart>
                      <Pie data={chartData} dataKey={chartConfig.valueKey} nameKey={chartConfig.nameKey} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                        {chartData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip/>
                      <Legend/>
                    </PieChart>
                  ) : (
                    <ChartComponent data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={chartConfig.xAxisKey} tick={{fontSize: 12}}/>
                      <YAxis tick={{fontSize: 12}} />
                      <Tooltip />
                      <Legend />
                      {chartConfig.dataKeys?.map((key: string, index: number) => (
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
    
    case 'accordion':
        return (
            <div className="my-4 p-4 border rounded-lg not-prose">
                <h3 className="font-bold text-xl">{node.attrs?.title}</h3>
                <p className="text-muted-foreground mb-4">{node.attrs?.subtitle}</p>
                <div className="space-y-3">
                    {node.attrs?.items.map((item: any) => (
                        <div key={item.id} className="border-t pt-2">
                            <h4 className="font-semibold">{item.title}</h4>
                            <div className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none">
                                {item.content.split('\n').map((line: string, i: number) => <p key={i}>{line}</p>)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )

    case 'todoList':
        return (
            <div className="my-4 p-4 border rounded-lg not-prose">
                <h4 className="font-bold text-xl mb-2">{node.attrs?.title}</h4>
                <ul className="space-y-2 list-none pl-0">
                    {node.attrs?.tasks.map((task: any) => (
                        <li key={task.id} className="flex items-center gap-2">
                            {task.completed ? <CheckSquare className="h-5 w-5 text-primary flex-shrink-0"/> : <Square className="h-5 w-5 text-muted-foreground flex-shrink-0"/>}
                            <span className={cn(task.completed && 'line-through text-muted-foreground')}>
                                {task.text}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        );

    default:
      console.warn(`Unsupported node type in PrintPreview: ${node.type}`);
      return <div className="hidden">{children}</div>;
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
              title="Open in new tab"
            >
              <ExternalLink size={24} />
              <span className="sr-only">Open in new tab</span>
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
