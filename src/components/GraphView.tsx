
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
      try {
        // Only fetch 'active' documents for the graph
        const allDocs = await getAllDocuments('active');
        
        const nodes = new DataSet(
          allDocs.map(doc => ({
            id: doc.id,
            label: doc.title || 'Untitled',
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
                  border: '#4682B4', // SteelBlue
                  background: '#E6E9ED', // A light grey-blue
                  highlight: {
                    border: '#4682B4',
                    background: '#cce0f1', 
                  },
                  hover: {
                    border: '#4682B4',
                    background: '#d9e8f5',
                  }
              },
              font: { 
                  color: '#2c3e50', // Dark slate gray
                  size: 16,
                  face: 'Inter, sans-serif'
              }
            },
            edges: {
              color: {
                color: '#bdc3c7', // A neutral gray
                highlight: '#4682B4',
                hover: '#95a5a6',
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

          network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
              const nodeId = params.nodes[0];
              router.push(`/editor/${nodeId}`);
            }
          });

          const allNodes = nodes.get({ returnType: 'Object' });
          
          network.on('hoverNode', params => {
            const nodeId = params.node;
            const connectedNodes = network.getConnectedNodes(nodeId) as (string | number)[];
            
            const nodeUpdates = Object.keys(allNodes).map(id => {
              const isConnected = String(id) === String(nodeId) || connectedNodes.includes(String(id));
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
      } catch (error) {
        console.error("Failed to generate knowledge graph:", error);
      } finally {
        setIsLoading(false);
      }
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
