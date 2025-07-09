
"use client";

import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import {
  Bar, BarChart, Area, AreaChart, Line, LineChart, Pie, PieChart,
  CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Brush
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
import { AreaChart as AreaChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, Upload, X, Plus, Trash2, Settings, Check as CheckIcon, Settings2, GripVertical, Wand2 } from 'lucide-react';
import { useState, useMemo, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';
import { GenerateChartDataDialog } from '../GenerateChartDataDialog';
import { useToast } from '@/hooks/use-toast';

type ChartType = 'bar' | 'line' | 'area' | 'pie';

type ChartConfig = {
  xAxisKey?: string;
  dataKeys?: string[];
  nameKey?: string;
  valueKey?: string;
};

const CHART_TYPES: { name: ChartType, icon: React.FC<any> }[] = [
  { name: 'bar', icon: BarChartIcon },
  { name: 'line', icon: LineChartIcon },
  { name: 'area', icon: AreaChartIcon },
  { name: 'pie', icon: PieChartIcon },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-border rounded-lg shadow-lg">
          <p className="font-semibold text-foreground">{`${label}`}</p>
          {payload.map((p: any, index: number) => (
             <p key={index} style={{ color: p.color }}>{`${p.name}: ${p.value}`}</p>
          ))}
        </div>
      );
    }
    return null;
};

const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 p-2 bg-background/50 rounded-lg text-xs">
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export const ChartNodeView = ({ node, updateAttributes, deleteNode, selected }: NodeViewProps) => {
  const { textAlign, layout } = node.attrs;
  const width = layout?.width || 100;
  const height = layout?.height || 400;

  // State for the component's own editing mode
  const [isEditing, setIsEditing] = useState(false);
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  
  // States for edit mode content
  const [title, setTitle] = useState(node.attrs.title);
  const [chartType, setChartType] = useState(node.attrs.chartType);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig>({});
  const [viewConfig, setViewConfig] = useState({ legend: true, tooltip: true, grid: true, brush: true });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  const { toast } = useToast();
  
  // When Tiptap selection changes, close the editor if the node is no longer selected
  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
    }
  }, [selected]);
  
  // When entering edit mode, load the current node attributes into local state
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

  
  useMemo(() => {
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
    setIsEditing(false); // Close the editor UI
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

  const renderChart = useCallback((data: any[], type: string, config: ChartConfig, vc: any) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
            <BarChartIcon className="h-12 w-12 mb-4"/>
            <p className="font-semibold">No data yet.</p>
            <p className="text-sm">Select to open the editor and add data.</p>
        </div>
      );
    }
    
    const { xAxisKey, dataKeys = [], nameKey, valueKey } = config;

    // Common Axis and Grid components
    const commonAxisProps = {
        stroke: "hsl(var(--muted-foreground))",
        fontSize: 12,
        tickLine: false,
        axisLine: false,
    };
    const commonXAxisProps = {
        ...commonAxisProps,
        dataKey: xAxisKey,
        angle: -45,
        textAnchor: "end",
        height: 80,
    };
    const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.8} />;

    const defs = (
        <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={1} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                <stop offset="100%" stopColor="#60A5FA" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
            <filter id="shadow">
                <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.1"/>
            </filter>
        </defs>
    );

    switch (type) {
      case 'bar': {
        const processedData = data.map(row => {
            const newRow: {[key:string]: any} = { ...row };
            dataKeys.forEach(key => {
              const value = parseFloat(row[key]);
              if (!isNaN(value)) newRow[key] = value;
            });
            return newRow;
        });
        return (
          <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {defs}
            {vc.grid && commonGrid}
            <XAxis {...commonXAxisProps} />
            <YAxis {...commonAxisProps} />
            {vc.tooltip && <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", opacity: 0.3 }} />}
            {vc.legend && <Legend content={<CustomLegend />} />}
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill="url(#barGradient)" radius={[4, 4, 0, 0]} filter="url(#shadow)" />
            ))}
            {vc.brush && <Brush dataKey={xAxisKey} height={30} stroke="#3B82F6" />}
          </BarChart>
        );
      }
      case 'line': {
        const processedData = data.map(row => {
            const newRow: {[key:string]: any} = { ...row };
            dataKeys.forEach(key => {
              const value = parseFloat(row[key]);
              if (!isNaN(value)) newRow[key] = value;
            });
            return newRow;
        });
         return (
          <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {defs}
            {vc.grid && commonGrid}
            <XAxis {...commonXAxisProps} />
            <YAxis {...commonAxisProps} />
            {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
            {vc.legend && <Legend content={<CustomLegend />} />}
            {dataKeys.map((key, index) => (
              <Line key={key} type="monotone" dataKey={key} stroke="url(#lineGradient)" strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, stroke: '#FFFFFF', r: 6, filter: 'url(#shadow)' }}
                  activeDot={{ r: 8, fill: '#1D4ED8', stroke: '#FFFFFF', strokeWidth: 2, filter: 'url(#shadow)' }}
              />
            ))}
            {vc.brush && <Brush dataKey={xAxisKey} height={30} stroke="#3B82F6" />}
          </LineChart>
        );
      }
      case 'area': {
        const processedData = data.map(row => {
            const newRow: {[key:string]: any} = { ...row };
            dataKeys.forEach(key => {
              const value = parseFloat(row[key]);
              if (!isNaN(value)) newRow[key] = value;
            });
            return newRow;
        });
        return (
          <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {defs}
            {vc.grid && commonGrid}
            <XAxis {...commonXAxisProps} />
            <YAxis {...commonAxisProps} />
            {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
            {vc.legend && <Legend content={<CustomLegend />} />}
            {dataKeys.map((key, index) => (
              <Area key={key} type="monotone" dataKey={key} stroke="#3B82F6" strokeWidth={3}
                fill="url(#areaGradient)" filter="url(#areaShadow)" />
            ))}
            {vc.brush && <Brush dataKey={xAxisKey} height={30} stroke="#3B82F6" />}
          </AreaChart>
        );
      }
      case 'pie': {
        const pieData = data.map((d, i) => ({ ...d, [valueKey || '']: Number(d[valueKey || '']), color: COLORS[i % COLORS.length] })).filter(d => !isNaN(d[valueKey || '']) && d[valueKey || ''] > 0);
        return (
          <PieChart>
             <defs>
              <filter id="pieShadow">
                <feDropShadow dx="2" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1"/>
              </filter>
              {pieData.map((entry, index) => (
                <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                  <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <Pie data={pieData} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2} filter="url(#pieShadow)">
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={`url(#pieGradient-${index})`} stroke="#FFFFFF" strokeWidth={2} />)}
            </Pie>
            {vc.tooltip && <Tooltip content={<CustomTooltip />} />}
            {vc.legend && <Legend content={<CustomLegend />} />}
          </PieChart>
        );
      }
      default: return null;
    }
  }, []);

  if (isEditing) {
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
                              <div className="flex-grow"><Label>Chart Type</Label><div className="flex items-center gap-2 mt-1">{CHART_TYPES.map(type => (<Button key={type.name} variant={chartType === type.name ? 'default' : 'outline'} size="icon" onClick={() => setChartType(type.name)}><type.icon className="h-4 w-4"/><span className="sr-only">{type.name} chart</span></Button>))}</div></div>
                              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><Settings2 className="mr-2 h-4 w-4" /> View Options</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Display Elements</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={viewConfig.legend} onCheckedChange={(checked) => setViewConfig(v => ({...v, legend: checked}))}>Show Legend</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={viewConfig.tooltip} onCheckedChange={(checked) => setViewConfig(v => ({...v, tooltip: checked}))}>Show Tooltip</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={viewConfig.grid && chartType !== 'pie'} onCheckedChange={(checked) => setViewConfig(v => ({...v, grid: checked}))} disabled={chartType === 'pie'}>Show Grid</DropdownMenuCheckboxItem><DropdownMenuCheckboxItem checked={viewConfig.brush && chartType !== 'pie'} onCheckedChange={(checked) => setViewConfig(v => ({...v, brush: checked}))} disabled={chartType === 'pie'}>Show Brush</DropdownMenuCheckboxItem></DropdownMenuContent></DropdownMenu>
                          </div>
                          {chartType === 'pie' ? (<div className="grid sm:grid-cols-2 gap-4"><div><Label>Name Key</Label><Select value={chartConfig.nameKey} onValueChange={key => setChartConfig({ ...chartConfig, nameKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div><div><Label>Value Key</Label><Select value={chartConfig.valueKey} onValueChange={key => setChartConfig({ ...chartConfig, valueKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div></div>) : (<><div><Label>X-Axis</Label><Select value={chartConfig.xAxisKey} onValueChange={key => setChartConfig({ ...chartConfig, xAxisKey: key })}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select></div><div><Label>Series (Y-Axis)</Label><div className="space-y-2 rounded-md border p-4 max-h-40 overflow-y-auto">{availableKeys.filter(k => k !== chartConfig.xAxisKey).map(key => (<div key={key} className="flex items-center space-x-2"><Checkbox id={`key-${key}`} checked={chartConfig.dataKeys?.includes(key)} onCheckedChange={(checked) => handleDataKeyChange(key, !!checked)} /><label htmlFor={`key-${key}`} className="text-sm font-medium leading-none">{key}</label></div>))}{availableKeys.filter(k => k !== chartConfig.xAxisKey).length === 0 && (<p className="text-sm text-muted-foreground">Select an X-Axis key or add more columns.</p>)}</div></div></>)}
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

  // View Mode
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
