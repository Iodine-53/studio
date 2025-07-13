
"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Network, DataSet } from 'vis-network/standalone/esm/vis-network';
import 'vis-network/styles/vis-network.css';
import { getAllDocuments, type Document, type TiptapNode } from '@/lib/db';
import { Loader2 } from 'lucide-react';

export const GraphView = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    const generateGraph = async () => {
      const allDocs = await getAllDocuments();
      
      const nodes = new DataSet(
        allDocs.map(doc => ({
          id: doc.id,
          label: doc.title || 'Untitled',
          shape: 'box',
          margin: 10,
        }))
      );

      const edges = new DataSet();
      
      const findLinks = (docId: number, content: TiptapNode[]) => {
        content.forEach(node => {
          if (node.type === 'docLink' && node.attrs?.docId) {
            const targetId = parseInt(node.attrs.docId, 10);
            if (docId !== targetId && !isNaN(targetId)) {
                edges.add({
                    from: docId,
                    to: targetId,
                    arrows: 'to',
                });
            }
          }
          if (node.content) {
            findLinks(docId, node.content);
          }
        });
      };

      allDocs.forEach(doc => {
        if (doc.id && doc.content && doc.content.content) {
          findLinks(doc.id, doc.content.content);
        }
      });

      if (containerRef.current) {
        const options = {
          nodes: {
            borderWidth: 2,
            shape: 'box',
            margin: 12,
            color: {
                border: '#4338ca', // indigo-700
                background: '#e0e7ff', // indigo-100
                highlight: {
                  border: '#4338ca',
                  background: '#a5b4fc', // indigo-300
                },
                hover: {
                  border: '#4338ca',
                  background: '#c7d2fe', // indigo-200
                }
            },
            font: { 
                color: '#1e293b', // slate-800
                size: 16,
                face: 'Inter, sans-serif'
            }
          },
          edges: {
            color: {
              color: '#94a3b8', // slate-400
              highlight: '#4f46e5', // indigo-600
              hover: '#64748b', // slate-500
            },
            width: 1.5,
            smooth: {
              type: 'dynamic'
            }
          },
          physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
              gravitationalConstant: -50,
              centralGravity: 0.005,
              springLength: 230,
              springConstant: 0.18,
              avoidOverlap: 1.5,
            },
            stabilization: {
              iterations: 150
            }
          },
          interaction: {
            hover: true,
            tooltipDelay: 200,
          },
        };
        
        const network = new Network(containerRef.current, { nodes, edges }, options);
        networkRef.current = network;

        network.on('selectNode', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            router.push(`/editor/${nodeId}`);
          }
        });

        const allNodes = nodes.get({ returnType: 'Object' });
        
        network.on('hoverNode', params => {
          const nodeId = params.node;
          const connectedNodes = network.getConnectedNodes(nodeId) as string[];
          
          const nodeUpdates = Object.keys(allNodes).map(id => {
            const isConnected = id === String(nodeId) || connectedNodes.includes(id);
            return {
              id: id,
              color: isConnected ? undefined : { border: '#e5e7eb', background: '#f9fafb' },
              font: { color: isConnected ? undefined : '#d1d5db' }
            };
          });
          nodes.update(nodeUpdates as any);
        
          const allEdges = edges.get();
          const edgeUpdates = allEdges.map(edge => {
            const isConnected = edge.from === nodeId || edge.to === nodeId;
            return {
              id: edge.id,
              color: isConnected ? undefined : '#f3f4f6'
            };
          });
          edges.update(edgeUpdates);
        });
        
        network.on('blurNode', () => {
          const nodeUpdates = Object.keys(allNodes).map(id => ({ id: id, color: undefined, font: { color: undefined } }));
          nodes.update(nodeUpdates as any);
        
          const allEdges = edges.get();
          const edgeUpdates = allEdges.map(edge => ({ id: edge.id, color: undefined }));
          edges.update(edgeUpdates);
        });
      }
      setIsLoading(false);
    };

    if (containerRef.current) {
        generateGraph();
    }
    
    return () => {
        networkRef.current?.destroy();
        networkRef.current = null;
    }
  }, [router]);

  return (
    <div className="w-full h-full relative">
        {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Building knowledge graph...</p>
                </div>
            </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
