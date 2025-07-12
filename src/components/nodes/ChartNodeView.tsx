

"use client";

import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import {
  Bar, BarChart, Area, AreaChart, Line, LineChart, Pie, PieChart, ComposedChart,
  Scatter, ScatterChart, Radar, RadarChart, RadialBar, RadialBarChart, Treemap, Funnel, FunnelChart,
  CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, ZAxis, Brush,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, RadarGrid, LabelList
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { 
    AreaChart as AreaChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, Upload, X, Plus, Trash2, Settings, Check as CheckIcon, Settings2, GripVertical, Wand2,
    BarChartHorizontal, Shapes, Radar as RadarIcon, Target, LayoutGrid, Filter, GitMerge
} from 'lucide-react';
import { useState, useMemo, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { GenerateChartDataDialog } from '../GenerateChartDataDialog';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider, Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'horizontalBar' | 'scatter' | 'radar' | 'radialBar' | 'treemap' | 'funnel' | 'mixed';

type ChartConfig = {
  xAxisKey?: string;
  yAxisKey?: string;
  zAxisKey?: string;
  dataKeys?: string[];
  nameKey?: string;
  valueKey?: string;
  childrenKey?: string;
  mixedChartTypes?: { [key: string]: 'line' | 'bar' | 'area' };
};

const CHART_TYPES: { name: ChartType, label: string, icon: React.FC<any>, isAxisBased: boolean, isHierarchical?: boolean }[] = [
  { name: 'bar', label: 'Bar Chart', icon: BarChartIcon, isAxisBased: true },
  { name: 'line', label: 'Line Chart', icon: LineChartIcon, isAxisBased: true },
  { name: 'area', label: 'Area Chart', icon: AreaChartIcon, isAxisBased: true },
  { name: 'mixed', label: 'Mixed Chart', icon: GitMerge, isAxisBased: true },
  { name: 'horizontalBar', label: 'Horizontal Bar', icon: BarChartHorizontal, isAxisBased: true },
  { name: 'scatter', label: 'Scatter Plot', icon: Shapes, isAxisBased: true },
  { name: 'radar', label: 'Radar Chart', icon: RadarIcon, isAxisBased: false },
  { name: 'pie', label: 'Pie Chart', icon: PieChartIcon, isAxisBased: false },
  { name: 'radialBar', label: 'Radial Bar', icon: Target, isAxisBased: false },
  { name: 'treemap', label: 'Treemap', icon: LayoutGrid, isAxisBased: false, isHierarchical: true },
  { name: 'funnel', label: 'Funnel Chart', icon: Filter, isAxisBased: false },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{`${label}`}</p>
          {payload.map((p: any, index: number) => (
             <p key={index} style={{ color: p.color || p.payload.fill, fontWeight: '500' }}>
              {`${p.name}: ${p.value.toLocaleString()}`}
             </p>
          ))}
        </div>
      );
    }
    return null;
};

// Tooltip for Funnel Chart
const FunnelTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-background p-3 border border-border rounded-lg shadow-lg text-sm">
                <p className="font-semibold text-foreground mb-1">{data.name}</p>
                <p style={{ color: data.fill }}>
                    Value: {data.value.toLocaleString()}
                </p>
                {data.percentOfPrevious !== undefined && (
                    <p className="text-muted-foreground">
                        {data.percentOfPrevious.toFixed(1)}% of previous stage
                    </p>
                )}
            </div>
        );
    }
    return null;
};

// Truncate label to 11 characters + ellipsis if longer
const truncateLabel = (value: string) => {
    if (typeof value !== 'string') return value;
    if (value.length > 11) {
      return `${value.substring(0, 11)}...`;
    }
    return value;
};

// Custom tick component for X-axis that applies smart truncation
const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    
    const truncatedText = truncateLabel(payload.value);
    
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="hsl(var(--muted-foreground))" transform={`rotate(-45)`} fontSize={12}>
                {truncatedText}
            </text>
        </g>
    );
};

const CustomizedTreemapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, rank, name } = props;
    
    // Add a check for payload to prevent errors
    if (!payload || !payload.name) {
        return null;
    }

    const item = root.children && root.children[index] ? root.children[index] : payload;
    
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: COLORS[index % COLORS.length],
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {width > 30 && height > 30 && (
            <>
                <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={14} className="pointer-events-none">
                    {item.name}
                </text>
                <text x={x + 4} y={y + 18} fill="#fff" fontSize={12} fillOpacity={0.7} className="pointer-events-none">
                    {item.size}
                </text>
            </>
        )}
      </g>
    );
  };


export const ChartNodeView = ({ node, updateAttributes, deleteNode, selected }: NodeViewProps) => {
  const { textAlign, layout } = node.attrs;
  const width = layout?.width || 100;
  const height = layout?.height || 400;

  const [isEditing, setIsEditing] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  
  const [title, setTitle] = useState(node.attrs.title);
  const [chartType, setChartType] = useState<ChartType>(node.attrs.chartType);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [viewConfig, setViewConfig] = useState({ legend: true, tooltip: true, grid: true, brush: true });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
    }
  }, [selected]);
  
  useEffect(() => {
    if (isEditing) {
      setTitle(node.attrs.title);
      setChartType(node.attrs.chartType);
      try {
        setChartData(JSON.parse(node.attrs.chartData || '[]'));
        setChartConfig(JSON.parse(node.attrs.chartConfig || '{}'));
        setViewConfig(JSON.parse(node.attrs.viewConfig || '{"legend":true,"tooltip":true,"grid":true,"brush":true}'));
      } catch (e) {
        console.error("Failed to parse chart attributes", e);
        setChartData([]);
        setChartConfig({});
      }
    }
  }, [isEditing, node.attrs]);

  const numericDataKeys = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    const firstRow = chartData[0];
    if (!firstRow) return [];
    return Object.keys(firstRow).filter(key => 
        chartData.every(row => row && (typeof row[key] === 'number' || (typeof row[key] === 'string' && !isNaN(parseFloat(row[key])))))
    );
  }, [chartData]);
  
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  
  useEffect(() => {
    if (chartData.length > 0) {
      const allKeys = chartData.reduce((keys, row) => {
        Object.keys(row).forEach(key => {
          if (!keys.includes(key)) keys.push(key);
        });
        return keys;
      }, [] as string[]);
      setAvailableKeys(allKeys);
    } else {
      setAvailableKeys([]);
    }
  }, [chartData]);
  
  const handleSaveAndClose = () => {
    updateAttributes({
      title,
      chartType,
      chartData: JSON.stringify(chartData),
      chartConfig: JSON.stringify(chartConfig),
      viewConfig: JSON.stringify(viewConfig),
    });
    setIsEditing(false);
  };

  const handleAiGenerate = (generatedData: any[]) => {
    if (!generatedData || generatedData.length === 0) {
      toast({
        variant: 'destructive',
        title: 'AI Generation Failed',
        description: 'The AI did not return any data. Please try a different prompt.',
      });
      return;
    }
    
    setChartData(generatedData);
    
    const keys = Object.keys(generatedData[0]);
    if (keys.length > 0) {
      const newConfig: ChartConfig = {};
      newConfig.xAxisKey = keys[0];
      newConfig.nameKey = keys[0];
      
      const numericKey = keys.find(key => typeof generatedData[0][key] === 'number');
      if (numericKey) {
        newConfig.dataKeys = [numericKey];
        newConfig.valueKey = numericKey;
      } else if (keys.length > 1) {
        newConfig.dataKeys = [keys[1]];
        newConfig.valueKey = keys[1];
      }
      setChartConfig(newConfig);
    }
    
    toast({
      title: 'AI Data Generated',
      description: 'The chart data has been populated. Configure the appearance as needed.',
    });
  };

  const onFileComplete = (data: any[], fields?: string[]) => {
      setChartData(data);
      const keys = fields || (data.length > 0 ? Object.keys(data[0]) : []);
      if (keys.length > 0) {
        setAvailableKeys(keys);
        if (keys.length >= 2) {
          const newConfig = { 
            xAxisKey: keys[0], 
            dataKeys: [keys[1]],
            nameKey: keys[0], 
            valueKey: keys[1]
          };
          setChartConfig(newConfig);
        }
      }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => onFileComplete(result.data, result.meta.fields),
        error: (err) => console.error("CSV Parsing Error:", err),
      });
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          if (Array.isArray(json)) onFileComplete(json);
        } catch (err) {
          console.error("Error parsing JSON file:", err);
        }
      };
      reader.readAsText(file);
    }
    if(event.target) event.target.value = "";
  };
  
  const handleTableChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...chartData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setChartData(newData);
  };

  const handleAddRow = () => {
    if (availableKeys.length === 0) {
        setChartData([{ 'label': 'New Item', 'value': 10 }]);
    } else {
        const newRow = availableKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
        setChartData(prev => [...prev, newRow]);
    }
  };

  const handleAddColumn = () => {
    let i = 1, newColumnName;
    do { newColumnName = `NewColumn${i++}`; } while (availableKeys.includes(newColumnName));
    const newData = chartData.map(row => ({ ...row, [newColumnName]: '' }));
    if (newData.length === 0) newData.push({ [newColumnName]: '' });
    setChartData(newData);
  };
  
  const handleRemoveRow = (rowIndex: number) => setChartData(chartData.filter((_, index) => index !== rowIndex));
  
  const handleRemoveColumn = (keyToRemove: string) => {
    if (window.confirm(`Are you sure you want to delete the "${keyToRemove}" column?`)) {
        const newData = chartData.map(row => {
            const newRow = {...row};
            delete newRow[keyToRemove as keyof typeof newRow];
            return newRow;
        });
        setChartData(newData);
        const newConfig = { ...chartConfig };
        if (newConfig.dataKeys) newConfig.dataKeys = newConfig.dataKeys.filter(k => k !== keyToRemove);
        if (newConfig.xAxisKey === keyToRemove) delete newConfig.xAxisKey;
        if (newConfig.nameKey === keyToRemove) delete newConfig.nameKey;
        if (newConfig.valueKey === keyToRemove) delete newConfig.valueKey;
        setChartConfig(newConfig);
    }
  };
  
  const handleDataKeyChange = (key: string, checked: boolean) => {
    const currentKeys = chartConfig.dataKeys || [];
    const newKeys = checked ? [...currentKeys, key] : currentKeys.filter(k => k !== key);
    setChartConfig({ ...chartConfig, dataKeys: newKeys });
  };
  
  const handleMixedChartTypeChange = (key: string, type: 'line' | 'bar' | 'area') => {
    const currentTypes = chartConfig.mixedChartTypes || {};
    const newTypes = { ...currentTypes, [key]: type };
    setChartConfig({ ...chartConfig, mixedChartTypes: newTypes });
  };

  const renderChart = useCallback((data: any[], type: ChartType, config: ChartConfig, vc: any) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
            <BarChartIcon className="h-12 w-12 mb-4"/>
            <p className="font-semibold">No data yet.</p>
            <p className="text-sm">Select to open the editor and add data.</p>
            <p className="text-xs text-muted-foreground/50 mt-2">Last updated October 2023</p>
        </div>
      );
    }
    
    const { xAxisKey, yAxisKey, zAxisKey, dataKeys = [], nameKey, valueKey, childrenKey, mixedChartTypes = {} } = config;
    const isHorizontal = type === 'horizontalBar';
    
    const YAxisComponent = <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} type={isHorizontal ? 'category' : 'number'} dataKey={isHorizontal ? yAxisKey : undefined} />;
    const XAxisComponent = <XAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} type={isHorizontal ? 'number' : 'category'} dataKey={isHorizontal ? undefined : xAxisKey} height={80} interval={0} tick={<CustomAxisTick />} />;
    const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.8} />;
    const defs = ( <defs> {dataKeys.map((key, index) => ( <linearGradient key={`gradient-${key}`} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1"> <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} /> <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.2} /> </linearGradient> ))} <filter id="shadow"> <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1"/> </filter> </defs> );
    const brushComponent = <Brush dataKey={xAxisKey || nameKey} height={30} stroke="#3B82F6" tickFormatter={(value) => truncateLabel(value)} />;

    switch (type) {
      case 'bar':
      case 'line':
      case 'area':
      case 'mixed': {
        const ChartComponent = type === 'mixed' ? ComposedChart : type === 'bar' ? BarChart : type === 'line' ? LineChart : AreaChart;
        return (
          <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {defs}
            {vc.grid && commonGrid}
            {XAxisComponent}
            {YAxisComponent}
            {vc.tooltip && <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }} />}
            {vc.legend && <Legend />}
            {dataKeys.map((key, index) => {
              const seriesType = type === 'mixed' ? (mixedChartTypes[key] || 'bar') : type;
              if (seriesType === 'bar') return <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} filter="url(#shadow)" />;
              if (seriesType === 'line') return <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={3} dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, stroke: '#FFFFFF', r: 6, filter: 'url(#shadow)' }} activeDot={{ r: 8, fill: COLORS[index % COLORS.length], stroke: '#FFFFFF', strokeWidth: 2, filter: 'url(#shadow)' }} />;
              if (seriesType === 'area') return <Area key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={3} fill={`url(#gradient-${key})`} filter="url(#shadow)" />;
              return null;
            })}
            {vc.brush && brushComponent}
          </ChartComponent>
        );
      }
      case 'horizontalBar':
        return (
            <BarChart data={data} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                {vc.grid && commonGrid}
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey={nameKey} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
                {vc.legend && <Legend />}
                {dataKeys.map((key, index) => <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[0, 4, 4, 0]} />)}
            </BarChart>
        );
      case 'scatter':
        return (
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                {vc.grid && <CartesianGrid />}
                <XAxis type="number" dataKey={xAxisKey} name={xAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis type="number" dataKey={yAxisKey} name={yAxisKey} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                {zAxisKey && <ZAxis type="number" dataKey={zAxisKey} range={[60, 400]} name={zAxisKey} />}
                {vc.tooltip && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
                {vc.legend && <Legend />}
                <Scatter name="Data Points" data={data} fill="#8884d8" />
            </ScatterChart>
        );
      case 'radar':
          return (
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                  {vc.grid && <PolarGrid />}
                  <PolarAngleAxis dataKey={nameKey} />
                  <PolarRadiusAxis />
                  {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
                  {vc.legend && <Legend />}
                  {dataKeys.map((key, index) => <Radar key={key} name={key} dataKey={key} stroke={COLORS[index % COLORS.length]} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />)}
              </RadarChart>
          );
      case 'radialBar': {
        const radialData = (data || []).map(item => ({
            ...item,
            fill: COLORS[data.indexOf(item) % COLORS.length]
        }));
        return (
            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={10} data={radialData}>
                <RadialBar
                    label={{ position: 'insideStart', fill: '#fff', fontSize: '12px' }}
                    background
                    dataKey={valueKey}
                />
                {vc.legend && <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: -10, top: '50%', transform: 'translateY(-50%)' }} formatter={(value, entry) => <span style={{ color: entry.color }}>{entry.payload[nameKey]}</span>} />}
                {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
            </RadialBarChart>
        );
      }
      case 'treemap':
          return (
              <Treemap
                  data={data}
                  dataKey={valueKey}
                  nameKey={nameKey}
                  childrenDataKey={childrenKey}
                  aspectRatio={4 / 3}
                  stroke="#fff"
                  fill="#8884d8"
                  content={<CustomizedTreemapContent />}
              />
          );
      case 'funnel': {
        const funnelData = (data || []).map((item, index, arr) => ({
            ...item,
            fill: COLORS[index % COLORS.length],
            percentOfPrevious: index > 0 && arr[index - 1][valueKey] > 0 ? (item[valueKey] / arr[index - 1][valueKey]) * 100 : 100,
        }));
        return (
            <FunnelChart>
                {vc.tooltip && <Tooltip content={<FunnelTooltip />} />}
                <Funnel dataKey={valueKey} data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#000" stroke="none" dataKey={nameKey} />
                    <LabelList position="center" fill="#fff" stroke="none" dataKey={valueKey} formatter={(value: number) => value.toLocaleString()} />
                </Funnel>
            </FunnelChart>
        );
      }
      case 'pie': {
        const pieData = data.map((d) => ({
          ...d,
          [valueKey || '']: Number(d[valueKey || '']),
        })).filter(d => !isNaN(d[valueKey || '']) && d[valueKey || ''] > 0);

        return (
          <PieChart>
             <defs>
              <filter id="pieShadow">
                <feDropShadow dx="2" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1"/>
              </filter>
              {pieData.map((_entry, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                  </linearGradient>
                )
              })}
            </defs>
            <Pie data={pieData} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2} filter="url(#pieShadow)">
              {pieData.map((_entry, index) => <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index})`} stroke="#FFFFFF" strokeWidth={2} />)}
            </Pie>
            {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
            {vc.legend && <Legend />}
          </PieChart>
        );
      }
      default: return null;
    }
  }, []);

  if (isEditing) {
      const currentChartInfo = CHART_TYPES.find(c => c.name === chartType);
      const isHierarchical = currentChartInfo?.isHierarchical;
      const isAxisBased = currentChartInfo?.isAxisBased;
      
      return (
          <>
            <NodeViewWrapper 
              className="my-4 custom-node-wrapper"
              data-align={textAlign}
              style={{ width: `${width}%` }}
            >
              <Card 
                className="overflow-hidden relative w-full ring-2 ring-primary"
              >
                <CardHeader className="flex-row items-center justify-between bg-muted/50 p-3">
                    <Input className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Chart Title"/>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveAndClose} size="sm"><CheckIcon className="mr-2 h-4 w-4" /> Save & Close</Button>
                      <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">Cancel</Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <Tabs defaultValue="data" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="data">Data</TabsTrigger>
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                      </TabsList>
                      <TabsContent value="data" className="mt-4 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <input type="file" accept=".csv, .json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>Upload</Button>
                          <Button variant="secondary" size="sm" onClick={() => setIsAiDialogOpen(true)}><Wand2 className="mr-2 h-4 w-4"/>AI Generate</Button>
                        </div>
                        {chartData.length > 0 && <div className="max-h-60 overflow-auto border rounded-lg"><Table><TableHeader className="sticky top-0 bg-muted"><TableRow>{availableKeys.map(key => (<TableHead key={key}><div className="flex items-center gap-1"><span>{key}</span><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveColumn(key)}><Trash2 className="h-3 w-3" /></Button></div></TableHead>))}<TableHead className="w-[50px]"></TableHead></TableRow></TableHeader><TableBody>{chartData.map((row, rowIndex) => (<TableRow key={rowIndex}>{availableKeys.map(key => (<TableCell key={key}><Input type="text" value={row[key] || ''} onChange={(e) => handleTableChange(rowIndex, key, e.target.value)} className="h-8" /></TableCell>))}<TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveRow(rowIndex)}><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>))}</TableBody></Table></div>}
                        <div className="flex gap-2"><Button onClick={handleAddRow} size="sm"><Plus className="mr-2 h-4 w-4"/>Add Row</Button><Button onClick={handleAddColumn} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4"/>Add Column</Button></div>
                      </TabsContent>
                      <TabsContent value="appearance" className="mt-4 space-y-4">
                          <div className="flex items-end gap-4">
                              <div className="flex-grow">
                                <Label>Chart Type</Label>
                                <TooltipProvider>
                                  <div className="flex items-center gap-1 flex-wrap mt-1">
                                    {CHART_TYPES.map(type => (
                                      <UiTooltip key={type.name}>
                                        <TooltipTrigger asChild>
                                          <Button variant={chartType === type.name ? 'default' : 'outline'} size="icon" onClick={() => setChartType(type.name)}><type.icon className="h-4 w-4"/><span className="sr-only">{type.label}</span></Button>
                                        </TooltipTrigger>
                                        <TooltipContent><p>{type.label}</p></TooltipContent>
                                      </UiTooltip>
                                    ))}
                                  </div>
                                </TooltipProvider>
                              </div>
                              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><Settings2 className="mr-2 h-4 w-4" /> View Options</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Display Elements</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={viewConfig.legend} onCheckedChange={(checked) => setViewConfig(v => ({...v, legend: checked}))}>Show Legend</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={viewConfig.tooltip} onCheckedChange={(checked) => setViewConfig(v => ({...v, tooltip: checked}))}>Show Tooltip</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={viewConfig.grid && chartType !== 'pie'} onCheckedChange={(checked) => setViewConfig(v => ({...v, grid: checked}))} disabled={chartType === 'pie'}>Show Grid</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={viewConfig.brush && chartType !== 'pie'} onCheckedChange={(checked) => setViewConfig(v => ({...v, brush: checked}))} disabled={chartType === 'pie'}>Show Brush</DropdownMenuCheckboxItem></DropdownMenuContent></DropdownMenu>
                          </div>
                          
                          {isAxisBased ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {chartType === 'scatter' ? (
                                      <>
                                      <div><Label>X-Axis (Numeric)</Label><Select value={chartConfig.xAxisKey} onValueChange={key => setChartConfig({ ...chartConfig, xAxisKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{numericDataKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                                      <div><Label>Y-Axis (Numeric)</Label><Select value={chartConfig.yAxisKey} onValueChange={key => setChartConfig({ ...chartConfig, yAxisKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{numericDataKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                                      <div><Label>Z-Axis (Bubble Size)</Label><Select value={chartConfig.zAxisKey} onValueChange={key => setChartConfig({ ...chartConfig, zAxisKey: key })}><SelectTrigger><SelectValue placeholder="Optional..." /></SelectTrigger><SelectContent>{numericDataKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                                      </>
                                  ) : (
                                      <>
                                        <div><Label>{chartType === 'horizontalBar' ? 'Category Axis' : 'X-Axis'}</Label><Select value={chartConfig.xAxisKey} onValueChange={key => setChartConfig({ ...chartConfig, xAxisKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                                        <div>
                                            <Label>Series (Y-Axis)</Label>
                                            <div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">{availableKeys.filter(k => k !== chartConfig.xAxisKey).map(key => (<div key={key} className="flex items-center space-x-2"><Checkbox id={`key-${key}`} checked={chartConfig.dataKeys?.includes(key)} onCheckedChange={(checked) => handleDataKeyChange(key, !!checked)} /><label htmlFor={`key-${key}`} className="text-sm font-medium leading-none">{key}</label>
                                            {chartType === 'mixed' && chartConfig.dataKeys?.includes(key) && (
                                                <div className="ml-auto"><Select value={chartConfig.mixedChartTypes?.[key] || 'bar'} onValueChange={(type: 'line' | 'bar' | 'area') => handleMixedChartTypeChange(key, type)}><SelectTrigger className="h-7 w-24"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="bar">Bar</SelectItem><SelectItem value="line">Line</SelectItem><SelectItem value="area">Area</SelectItem></SelectContent></Select></div>
                                            )}
                                            </div>))}{availableKeys.filter(k => k !== chartConfig.xAxisKey).length === 0 && (<p className="text-sm text-muted-foreground">Select an X-Axis key or add more columns.</p>)}</div>
                                        </div>
                                      </>
                                  )}
                              </div>
                          ) : (
                             <div className="grid sm:grid-cols-2 gap-4">
                                <div><Label>Name Key</Label><Select value={chartConfig.nameKey} onValueChange={key => setChartConfig({ ...chartConfig, nameKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>Value Key</Label><Select value={chartConfig.valueKey} onValueChange={key => setChartConfig({ ...chartConfig, valueKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{numericDataKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>
                                {isHierarchical && <div><Label>Children Key</Label><Select value={chartConfig.childrenKey} onValueChange={key => setChartConfig({ ...chartConfig, childrenKey: key })}><SelectTrigger><SelectValue placeholder="Optional..." /></SelectTrigger><SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div>}
                            </div>
                          )}
                      </TabsContent>
                    </Tabs>
                    <div style={{ height: `${height}px` }} className="w-full mt-6 bg-muted/30 rounded-lg p-2">
                      <ResponsiveContainer width="100%" height="100%">
                        {renderChart(chartData, chartType, chartConfig, viewConfig)}
                      </ResponsiveContainer>
                    </div>
                </CardContent>
              </Card>
            </NodeViewWrapper>
            <GenerateChartDataDialog
              open={isAiDialogOpen}
              onOpenChange={setIsAiDialogOpen}
              onGenerate={handleAiGenerate}
            />
          </>
      );
  }

  const savedChartData = JSON.parse(node.attrs.chartData || '[]');
  const savedChartConfig = JSON.parse(node.attrs.chartConfig || '{}');
  const savedViewConfig = JSON.parse(node.attrs.viewConfig || '{"legend":true,"tooltip":true,"grid":true}');

  return (
    <NodeViewWrapper 
        className="my-4 custom-node-wrapper"
        data-align={textAlign}
        style={{ width: `${width}%` }}
    >
      <div 
        className={cn("relative group/chart-view w-full p-4 border rounded-lg not-prose bg-card", selected && 'ring-2 ring-primary')}
        data-drag-handle
      >
         <h4 className="font-bold text-xl mb-4 text-center">{node.attrs.title}</h4>
         <div className="w-full" style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(savedChartData, node.attrs.chartType, savedChartConfig, savedViewConfig)}
            </ResponsiveContainer>
         </div>
         {selected && (
            <div className="absolute top-2 right-2 opacity-0 group-hover/chart-view:opacity-100 transition-opacity">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => setIsEditing(true)}>
                    <Settings className="h-4 w-4" />
                </Button>
            </div>
         )}
      </div>
    </NodeViewWrapper>
  );
};
