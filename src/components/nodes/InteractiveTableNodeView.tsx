
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Upload, Download, Plus, Trash2, Check } from 'lucide-react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

export const InteractiveTableNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { textAlign, layout } = node.attrs;
  const width = layout?.width || 100;

  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing
  const [title, setTitle] = useState(node.attrs.title);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [newColumnName, setNewColumnName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseJsonOrReturn = (jsonString: string, defaultValue: any) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return defaultValue;
    }
  };

  useEffect(() => {
    if (selected) {
      setTitle(node.attrs.title);
      setHeaders(parseJsonOrReturn(node.attrs.headers, []));
      setData(parseJsonOrReturn(node.attrs.data, []));
    } else {
        setIsEditing(false);
    }
  }, [selected, node.attrs]);

  const handleSave = () => {
    updateAttributes({
      title,
      headers: JSON.stringify(headers),
      data: JSON.stringify(data),
    });
    setIsEditing(false);
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsEditing(true);
  };

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const addRow = () => {
    const newRow = Array(headers.length).fill('');
    setData([...data, newRow]);
  };

  const addColumn = () => {
    if (newColumnName.trim() === '') {
      alert('Please enter a column name.');
      return;
    }
    setHeaders([...headers, newColumnName]);
    setData(data.map(row => [...row, '']));
    setNewColumnName('');
  };

  const deleteRow = (index: number) => {
    if (window.confirm('Are you sure you want to delete this row?')) {
      setData(data.filter((_, i) => i !== index));
    }
  };

  const deleteColumn = (index: number) => {
    if (window.confirm('Are you sure you want to delete this column?')) {
      setHeaders(headers.filter((_, i) => i !== index));
      setData(data.map(row => row.filter((_, i) => i !== index)));
    }
  };

  const handleExport = () => {
    const csvData = [headers, ...data];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${title || 'table'}.csv`);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<string[]>(file, {
        complete: (results) => {
          const [importedHeaders, ...importedData] = results.data;
          if (importedHeaders && importedData) {
            setHeaders(importedHeaders);
            setData(importedData.filter(row => row.some(cell => cell.trim() !== ''))); // Filter out empty rows
          }
        },
      });
    }
  };

  const savedHeaders = useMemo(() => parseJsonOrReturn(node.attrs.headers, []), [node.attrs.headers]);
  const savedData = useMemo(() => parseJsonOrReturn(node.attrs.data, []), [node.attrs.data]);

  if (isEditing) {
    return (
      <NodeViewWrapper
        className="my-4 custom-node-wrapper"
        data-align={textAlign}
        style={{ width: `${width}%` }}
      >
        <Card className="overflow-hidden w-full ring-2 ring-primary">
          <CardHeader className="bg-muted/50 p-3 space-y-2">
            <div className="flex justify-between items-center">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto"
                  placeholder="Table Title"
                />
                <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm"><Check className="mr-2 h-4 w-4" /> Save</Button>
                    <Button onClick={() => setIsEditing(false)} size="sm" variant="ghost">Cancel</Button>
                </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="outline"><Upload className="mr-2 h-4 w-4" /> Import CSV</Button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".csv" className="hidden" />
              <Button onClick={handleExport} size="sm" variant="outline"><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
              <Button onClick={addRow} size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Row</Button>
              <div className="flex gap-1">
                <Input placeholder="New Column..." value={newColumnName} onChange={(e) => setNewColumnName(e.target.value)} className="h-9 w-32" />
                <Button onClick={addColumn} size="sm"><Plus className="mr-2 h-4 w-4" /> Add Col</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header, colIndex) => (
                      <TableHead key={colIndex}>
                        <div className="flex items-center gap-1">
                           <Input value={header} onChange={e => handleHeaderChange(colIndex, e.target.value)} className="font-bold"/>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => deleteColumn(colIndex)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-[50px] sticky right-0 bg-muted/95"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, colIndex) => (
                        <TableCell key={colIndex}>
                          <Input value={cell} onChange={e => handleCellChange(rowIndex, colIndex, e.target.value)} />
                        </TableCell>
                      ))}
                      <TableCell className="sticky right-0 bg-card">
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => deleteRow(rowIndex)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className="my-4 custom-node-wrapper"
      data-align={textAlign}
      style={{ width: `${width}%` }}
    >
      <Card className={cn("overflow-hidden w-full relative group", selected && "ring-2 ring-primary")}>
        <CardHeader>
          <CardTitle>{node.attrs.title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                        {savedHeaders.map((header: string, i: number) => <TableHead key={i}>{header}</TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {savedData.map((row: string[], i: number) => (
                        <TableRow key={i}>
                            {row.map((cell: string, j: number) => <TableCell key={j}>{cell}</TableCell>)}
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
        {selected && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" onClick={handleEditClick}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Table
                </Button>
            </div>
        )}
      </Card>
    </NodeViewWrapper>
  );
};
