
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AreaChart as AreaChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, PieChart as PieChartIcon, Upload, X, Plus, Trash2 } from 'lucide-react';
import { useState, useMemo, useRef, ChangeEvent } from 'react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF5733', '#C70039', '#900C3F', '#581845'];

export const ChartNodeView = ({ node, updateAttributes, deleteNode }: NodeViewProps) => {
  const { chartType, title } = node.attrs;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(node.attrs.chartData || '[]');
    } catch {
      return [];
    }
  }, [node.attrs.chartData]);

  const [chartData, setChartData] = useState(parsedData);

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
      const allKeys = chartData.reduce((keys, row) => {
        Object.keys(row).forEach(key => {
          if (!keys.includes(key)) {
            keys.push(key);
          }
        });
        return keys;
      }, [] as string[]);
      setAvailableKeys(allKeys);
    } else {
      setAvailableKeys([]);
    }
  }, [chartData]);
  
  const onFileComplete = (data: any[], fields?: string[]) => {
      setChartData(data);
      updateAttributes({ chartData: JSON.stringify(data) });
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
          updateAttributes({ chartConfig: JSON.stringify(newConfig) });
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
          const json = JSON.parse(e.target.result as string);
          if (Array.isArray(json)) onFileComplete(json);
        } catch (err) {
          console.error("Error parsing JSON file:", err);
        }
      };
      reader.readAsText(file);
    }
    if(event.target) event.target.value = '';
  };

  const handleTableChange = (rowIndex: number, key: string, value: string) => {
    const newData = [...chartData];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    setChartData(newData);
    updateAttributes({ chartData: JSON.stringify(newData) });
  };

  const handleAddRow = () => {
    if (availableKeys.length === 0) {
        const newData = [{ 'label': 'New Item', 'value': 10 }];
        setChartData(newData);
        updateAttributes({ chartData: JSON.stringify(newData) });
    } else {
        const newRow = availableKeys.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
        const newData = [...chartData, newRow];
        setChartData(newData);
        updateAttributes({ chartData: JSON.stringify(newData) });
    }
  };
  
  const handleAddColumn = () => {
    let i = 1;
    let newColumnName;
    do {
      newColumnName = `NewColumn${i}`;
      i++;
    } while (availableKeys.includes(newColumnName));

    const newData = chartData.map(row => ({
      ...row,
      [newColumnName]: ''
    }));
    
    if (newData.length === 0) {
      newData.push({ [newColumnName]: '' });
    }

    setChartData(newData);
    updateAttributes({ chartData: JSON.stringify(newData) });
  };

  const handleRemoveRow = (rowIndex: number) => {
    const newData = chartData.filter((_, index) => index !== rowIndex);
    setChartData(newData);
    updateAttributes({ chartData: JSON.stringify(newData) });
  };
  
  const handleRemoveColumn = (keyToRemove: string) => {
    if (window.confirm(`Are you sure you want to delete the "${keyToRemove}" column? This cannot be undone.`)) {
        const newData = chartData.map(row => {
            const newRow = {...row};
            delete newRow[keyToRemove as keyof typeof newRow];
            return newRow;
        });
        setChartData(newData);
        updateAttributes({ chartData: JSON.stringify(newData) });
        
        const newConfig = { ...chartConfig };
        if (newConfig.dataKeys) {
            newConfig.dataKeys = newConfig.dataKeys.filter(k => k !== keyToRemove);
        }
        if (newConfig.xAxisKey === keyToRemove) {
            delete newConfig.xAxisKey;
        }
        if (newConfig.nameKey === keyToRemove) {
            delete newConfig.nameKey;
        }
         if (newConfig.valueKey === keyToRemove) {
            delete newConfig.valueKey;
        }
        updateAttributes({ chartConfig: JSON.stringify(newConfig) });
    }
  }
  
  const handleDataKeyChange = (key: string, checked: boolean) => {
    const currentKeys = chartConfig.dataKeys || [];
    const newKeys = checked 
      ? [...currentKeys, key]
      : currentKeys.filter(k => k !== key);
    
    updateAttributes({ chartConfig: JSON.stringify({ ...chartConfig, dataKeys: newKeys }) });
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
            <BarChartIcon className="h-12 w-12 mb-4"/>
            <p className="font-semibold">No data yet.</p>
            <p className="text-sm">Upload a file or add data manually.</p>
        </div>
      );
    }
    
    const { xAxisKey, dataKeys = [], nameKey, valueKey } = chartConfig;

    switch (chartType) {
      case 'bar':
      case 'line':
      case 'area':
        if (!xAxisKey || dataKeys.length === 0) return <p className="text-center p-4">Please select an X-Axis and at least one Data Series.</p>;
        
        const processedData = chartData.map(row => {
            const newRow: {[key: string]: any} = { ...row };
            dataKeys.forEach(key => {
              const value = parseFloat(row[key]);
              if (!isNaN(value)) {
                newRow[key] = value;
              }
            });
            return newRow;
        });

        const ChartComponent = chartType === 'bar' ? BarChart : chartType === 'line' ? LineChart : AreaChart;
        const SeriesComponent = chartType === 'bar' ? Bar : chartType === 'line' ? Line : Area;
        
        return (
          <ChartComponent data={processedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} tick={{fontSize: 12}} />
            <YAxis tick={{fontSize: 12}} />
            <Tooltip />
            <Legend iconSize={12} wrapperStyle={{fontSize: '12px', paddingTop: '10px'}}/>
            {dataKeys.map((key, index) => (
              <SeriesComponent 
                key={key} 
                type="monotone"
                dataKey={key} 
                fill={COLORS[index % COLORS.length]}
                stroke={COLORS[index % COLORS.length]}
                fillOpacity={chartType === 'area' ? 0.3 : 1}
              />
            ))}
          </ChartComponent>
        );
      case 'pie':
        if (!nameKey || !valueKey) return <p className="text-center p-4">Please select a Name Key and a Value Key.</p>;
        const pieData = chartData.map(d => ({ ...d, [valueKey]: Number(d[valueKey]) })).filter(d => !isNaN(d[valueKey]) && d[valueKey] > 0);
        return (
          <PieChart>
            <Pie 
              data={pieData} 
              dataKey={valueKey} 
              nameKey={nameKey} 
              cx="40%"
              cy="50%" 
              outerRadius="80%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                if (percent < 0.05) return null;
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}`, name]} />
            <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right" 
                iconSize={12}
                iconType="circle"
                wrapperStyle={{ 
                    maxHeight: '90%',
                    overflowY: 'auto',
                    paddingLeft: '20px',
                    fontSize: '12px',
                    lineHeight: '20px'
                }}
            />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <NodeViewWrapper>
      <Card className="my-4 overflow-hidden relative group/chart">
        <Button size="icon" variant="ghost" className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 group-hover/chart:opacity-100" onClick={deleteNode}>
          <X className="h-4 w-4"/><span className="sr-only">Delete Chart</span>
        </Button>
        <CardHeader>
          <Input className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0" value={title} onChange={(e) => updateAttributes({ title: e.target.value })} placeholder="Chart Title"/>
          <CardDescription>Use the controls below to configure your chart.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            <TabsContent value="data" className="mt-4 space-y-4">
              <div className="flex gap-2">
                <input type="file" accept=".csv, .json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4"/>Upload Data
                </Button>
              </div>
              {chartData.length > 0 && (
                <div className="max-h-60 overflow-auto border rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                      <TableRow>
                        {availableKeys.map(key => (
                            <TableHead key={key}>
                                <div className="flex items-center gap-1">
                                    <span>{key}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveColumn(key)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chartData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {availableKeys.map(key => (
                            <TableCell key={key}>
                              <Input
                                type="text"
                                value={row[key] || ''}
                                onChange={(e) => handleTableChange(rowIndex, key, e.target.value)}
                                className="h-8"
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveRow(rowIndex)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
               <div className="flex gap-2">
                <Button onClick={handleAddRow} size="sm">
                  <Plus className="mr-2 h-4 w-4"/>Add Row
                </Button>
                <Button onClick={handleAddColumn} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4"/>Add Column
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="appearance" className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                  <Label className="mr-2">Type:</Label>
                  {CHART_TYPES.map(type => (
                  <Button key={type.name} variant={chartType === type.name ? 'default' : 'outline'} size="icon" onClick={() => updateAttributes({ chartType: type.name })}>
                      <type.icon className="h-4 w-4"/><span className="sr-only">{type.name} chart</span>
                  </Button>
                  ))}
              </div>
             
              {chartType === 'pie' ? (
                 <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Name Key</Label>
                      <Select value={chartConfig.nameKey} onValueChange={key => updateAttributes({ chartConfig: JSON.stringify({ ...chartConfig, nameKey: key }) })}>
                          <SelectTrigger><SelectValue placeholder="Select a key..." /></SelectTrigger>
                          <SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value Key</Label>
                      <Select value={chartConfig.valueKey} onValueChange={key => updateAttributes({ chartConfig: JSON.stringify({ ...chartConfig, valueKey: key }) })}>
                          <SelectTrigger><SelectValue placeholder="Select a value..." /></SelectTrigger>
                          <SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                </div>
              ) : (
                <>
                  <div>
                      <Label>X-Axis</Label>
                      <Select value={chartConfig.xAxisKey} onValueChange={key => updateAttributes({ chartConfig: JSON.stringify({ ...chartConfig, xAxisKey: key }) })}>
                          <SelectTrigger><SelectValue placeholder="Select a key..." /></SelectTrigger>
                          <SelectContent>{availableKeys.map(key => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent>
                      </Select>
                  </div>
                   <div>
                      <Label>Series (Y-Axis)</Label>
                      <div className="space-y-2 rounded-md border p-4">
                        {availableKeys.filter(k => k !== chartConfig.xAxisKey).map(key => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`key-${key}`} 
                              checked={chartConfig.dataKeys?.includes(key)}
                              onCheckedChange={(checked) => handleDataKeyChange(key, !!checked)}
                            />
                            <label htmlFor={`key-${key}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {key}
                            </label>
                          </div>
                        ))}
                        {availableKeys.filter(k => k !== chartConfig.xAxisKey).length === 0 && (
                            <p className="text-sm text-muted-foreground">Select an X-Axis key first or add more columns.</p>
                        )}
                      </div>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
           
          <div className="h-80 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                  {renderChart()}
              </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </NodeViewWrapper>
  );
};
