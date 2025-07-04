"use client";

import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import {
  Bar, BarChart, Area, AreaChart, Line, LineChart, Pie, PieChart,
  CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AreaChart as AreaChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, Upload, X } from 'lucide-react';
import { useState, useMemo, useRef, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

type ChartType = 'bar' | 'line' | 'area' | 'pie';

type ChartConfig = {
  xAxisKey?: string;
  dataKey?: string;
  // For Pie charts
  nameKey?: string;
  valueKey?: string;
};

const CHART_TYPES: { name: ChartType, icon: React.FC<any> }[] = [
  { name: 'bar', icon: BarChartIcon },
  { name: 'line', icon: LineChartIcon },
  { name: 'area', icon: AreaChartIcon },
  { name: 'pie', icon: PieChartIcon },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ChartNodeView = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const { chartType, title } = node.attrs;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize parsed data to avoid re-parsing on every render
  const chartData = useMemo(() => {
    try {
      return JSON.parse(node.attrs.chartData || '[]');
    } catch {
      return [];
    }
  }, [node.attrs.chartData]);

  const chartConfig: ChartConfig = useMemo(() => {
    try {
      return JSON.parse(node.attrs.chartConfig || '{}');
    } catch {
      return {};
    }
  }, [node.attrs.chartConfig]);

  const [availableKeys, setAvailableKeys] = useState<string[]>([]);
  
  useMemo(() => {
    if (chartData.length > 0) {
      setAvailableKeys(Object.keys(chartData[0]));
    } else {
        setAvailableKeys([]);
    }
  }, [chartData]);
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const onComplete = (data: any[], fields?: string[]) => {
      updateAttributes({ chartData: JSON.stringify(data) });
      const keys = fields || (data.length > 0 ? Object.keys(data[0]) : []);
      setAvailableKeys(keys);
      // Auto-select keys if possible
      if (keys.length >= 2) {
        if (chartType === 'pie') {
            updateAttributes({ chartConfig: JSON.stringify({ nameKey: keys[0], valueKey: keys[1] }) });
        } else {
            updateAttributes({ chartConfig: JSON.stringify({ xAxisKey: keys[0], dataKey: keys[1] }) });
        }
      }
    };

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => onComplete(result.data, result.meta.fields),
        error: (err) => console.error("CSV Parsing Error:", err),
      });
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result as string);
          if (Array.isArray(json)) {
            onComplete(json);
          } else {
            console.error("JSON file must be an array of objects.");
          }
        } catch (err) {
          console.error("Error parsing JSON file:", err);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Unsupported file type. Please upload a CSV or JSON file.");
    }
    // Reset file input
    if(event.target) event.target.value = '';
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
            <Upload className="h-12 w-12 mb-4"/>
            <p className="font-semibold">No data yet.</p>
            <p className="text-sm">Click "Upload Data" to get started.</p>
        </div>
      );
    }
    
    const { xAxisKey, dataKey, nameKey, valueKey } = chartConfig;

    switch (chartType) {
      case 'bar':
        if (!xAxisKey || !dataKey) return <p className="text-center p-4">Please select an X-Axis and a Data Key.</p>;
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={COLORS[0]} />
          </BarChart>
        );
      case 'line':
        if (!xAxisKey || !dataKey) return <p className="text-center p-4">Please select an X-Axis and a Data Key.</p>;
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={COLORS[1]} />
          </LineChart>
        );
      case 'area':
        if (!xAxisKey || !dataKey) return <p className="text-center p-4">Please select an X-Axis and a Data Key.</p>;
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey={dataKey} stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.3} />
          </AreaChart>
        );
      case 'pie':
        if (!nameKey || !valueKey) return <p className="text-center p-4">Please select a Name Key and a Value Key.</p>;
        // Ensure value key is a number
        const pieData = chartData.map(d => ({ ...d, [valueKey]: Number(d[valueKey]) })).filter(d => !isNaN(d[valueKey]));
        return (
          <PieChart>
            <Pie data={pieData} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} fill={COLORS[2]}>
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        );
      default:
        return null;
    }
  };

  const currentConfigKey = chartType === 'pie' ? chartConfig.nameKey : chartConfig.xAxisKey;
  const currentValueKey = chartType === 'pie' ? chartConfig.valueKey : chartConfig.dataKey;


  return (
    <NodeViewWrapper>
      <Card className="my-4 overflow-hidden relative group/chart">
        <Button size="icon" variant="ghost" className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover/chart:opacity-100" onClick={deleteNode}>
          <X className="h-4 w-4"/>
          <span className="sr-only">Delete Chart</span>
        </Button>
        <CardHeader>
          <Input 
            className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0"
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder="Chart Title"
          />
          <CardDescription>Use the controls below to configure your chart.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-4 border-b pb-4 mb-4">
                {/* Chart Type Selector */}
                <div className="flex items-center gap-2">
                    <Label className="mr-2">Type:</Label>
                    {CHART_TYPES.map(type => (
                    <Button key={type.name} variant={chartType === type.name ? 'default' : 'outline'} size="icon" onClick={() => updateAttributes({ chartType: type.name })}>
                        <type.icon className="h-4 w-4"/>
                        <span className="sr-only">{type.name} chart</span>
                    </Button>
                    ))}
                </div>
                {/* Data Upload */}
                <div>
                    <input type="file" accept=".csv, .json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Upload Data
                    </Button>
                </div>
            </div>

            {chartData.length > 0 && (
                 <div className="grid sm:grid-cols-2 gap-4 mb-4">
                     <div>
                        <Label>{chartType === 'pie' ? 'Name Key' : 'X-Axis'}</Label>
                        <Select
                            value={currentConfigKey}
                            onValueChange={key => updateAttributes({ chartConfig: JSON.stringify(chartType === 'pie' ? {...chartConfig, nameKey: key} : {...chartConfig, xAxisKey: key}) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select a key..." /></SelectTrigger>
                            <SelectContent>
                                {availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                      <div>
                        <Label>{chartType === 'pie' ? 'Value Key' : 'Data Key'}</Label>
                        <Select
                            value={currentValueKey}
                             onValueChange={key => updateAttributes({ chartConfig: JSON.stringify(chartType === 'pie' ? {...chartConfig, valueKey: key} : {...chartConfig, dataKey: key}) })}
                        >
                            <SelectTrigger><SelectValue placeholder="Select a value..." /></SelectTrigger>
                            <SelectContent>
                                {availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                            </SelectContent>
                        </Select>
                     </div>
                 </div>
            )}
           
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
    </NodeViewWrapper>
  );
};
