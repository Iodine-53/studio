
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { NodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import VisNetwork from 'vis-network-react';
import type { Options, Data, Node, Edge } from 'vis-network';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '../ui/label';

type MindMapData = {
  nodes: Node[];
  edges: Edge[];
};

export const MindMapNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, selected }) => {
  const { title, data, textAlign, layout, instanceId } = node.attrs;
  const { width = 100, height = 500 } = layout || {};
  
  const [isEditing, setIsEditing] = useState(false);
  const [editNode, setEditNode] = useState<Node | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  
  const isSelected = selected;

  useEffect(() => {
    if (!isSelected) {
      setIsEditing(false);
    }
  }, [isSelected]);
  
  const updateMindMapData = (newData: Partial<MindMapData>) => {
    updateAttributes({ data: { ...data, ...newData } });
  };
  
  const handleAddNode = () => {
    const newNodeId = data.nodes.length > 0 ? Math.max(...data.nodes.map((n: Node) => Number(n.id))) + 1 : 1;
    const newNode: Node = { id: newNodeId, label: 'New Topic' };
    const newNodes = [...data.nodes, newNode];
    
    // Connect to the last selected node if possible, otherwise to the first node
    const lastSelected = data.nodes.length > 0 ? data.nodes[data.nodes.length - 1].id : null;
    let newEdges = [...data.edges];
    if (lastSelected) {
        newEdges.push({ from: lastSelected, to: newNodeId });
    }
    
    updateMindMapData({ nodes: newNodes, edges: newEdges });
  };
  
  const handleDeleteNode = () => {
    if (!editNode) return;
    const newNodes = data.nodes.filter((n: Node) => n.id !== editNode.id);
    const newEdges = data.edges.filter((e: Edge) => e.from !== editNode.id && e.to !== editNode.id);
    updateMindMapData({ nodes: newNodes, edges: newEdges });
    setEditNode(null);
  };
  
  const handleUpdateNodeLabel = () => {
    if (!editNode || !newNodeLabel) return;
    const newNodes = data.nodes.map((n: Node) => n.id === editNode.id ? { ...n, label: newNodeLabel } : n);
    updateMindMapData({ nodes: newNodes });
    setEditNode(null);
    setNewNodeLabel('');
  };
  
  const handleDoubleClick = (params: any) => {
    if (isEditing && params.nodes.length > 0) {
      const nodeId = params.nodes[0];
      const nodeToEdit = data.nodes.find((n: Node) => n.id === nodeId);
      if (nodeToEdit) {
        setEditNode(nodeToEdit);
        setNewNodeLabel(nodeToEdit.label || '');
      }
    }
  };

  const handleDragEnd = (params: any) => {
      if (isEditing && params.nodes.length > 0) {
          const nodeId = params.nodes[0];
          const newPositions = params.pointer.canvas;
          const newNodes = data.nodes.map((n: Node) => {
              if (n.id === nodeId) {
                  return { ...n, x: newPositions.x, y: newPositions.y };
              }
              return n;
          });
          updateMindMapData({ nodes: newNodes });
      }
  };

  const options: Options = useMemo(() => ({
    autoResize: true,
    nodes: { shape: 'box', size: 150, font: { size: 16 }, borderWidth: 2, shadow: true, shapeProperties: { borderRadius: 4 } },
    edges: { width: 2, color: '#94a3b8', arrows: 'to', smooth: { type: 'cubicBezier' } },
    physics: { enabled: !isEditing, barnesHut: { gravitationalConstant: -4000, centralGravity: 0.1, springLength: 120 } },
    interaction: { dragNodes: isEditing, dragView: true, zoomView: true },
    manipulation: {
        enabled: isEditing,
        addEdge: (edgeData, callback) => {
            const newEdges = [...data.edges, edgeData];
            updateMindMapData({ edges: newEdges });
            callback(edgeData);
        },
        deleteEdge: (edgeData, callback) => {
            const newEdges = data.edges.filter((e: Edge) => e.id !== edgeData.edges[0]);
            updateMindMapData({ edges: newEdges });
            callback(edgeData);
        }
    }
  }), [isEditing, data.edges]);

  return (
    <>
      <NodeViewWrapper
        className="my-4 custom-node-wrapper"
        data-align={textAlign}
        style={{ width: `${width}%` }}
      >
        <Card className={cn('overflow-hidden w-full h-full flex flex-col', isSelected && 'ring-2 ring-primary')}>
          <CardHeader className="bg-muted/50 p-3 flex-row justify-between items-center">
            <h4 className="font-bold text-lg">{title}</h4>
            {isSelected && (
              <div className="flex gap-2 items-center">
                {isEditing ? (
                  <>
                    <Button onClick={handleAddNode} size="sm"><Plus className="mr-2" /> Node</Button>
                    <Button onClick={() => setIsEditing(false)} size="sm" variant="secondary">Done</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} size="sm" variant="secondary"><Edit className="mr-2" /> Edit</Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0 flex-grow" style={{ height: `${height}px` }}>
            <div id={instanceId} className="w-full h-full">
                <VisNetwork
                    data={data}
                    options={options}
                    events={{ doubleClick: handleDoubleClick, dragEnd: handleDragEnd }}
                />
            </div>
          </CardContent>
        </Card>
      </NodeViewWrapper>
      
      <Dialog open={!!editNode} onOpenChange={() => setEditNode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Node</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="node-label">Node Label</Label>
            <Input id="node-label" value={newNodeLabel} onChange={(e) => setNewNodeLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUpdateNodeLabel()} />
          </div>
          <DialogFooter className="justify-between">
            <Button variant="destructive" onClick={handleDeleteNode}><Trash2 className="mr-2"/>Delete Node</Button>
            <Button onClick={handleUpdateNodeLabel}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
