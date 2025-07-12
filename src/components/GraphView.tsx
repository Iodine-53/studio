
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

  useEffect(() => {
    const generateGraph = async () => {
      const allDocs = await getAllDocuments();
      
      const nodes = new DataSet(
        allDocs.map(doc => ({
          id: doc.id,
          label: doc.title || 'Untitled',
          shape: 'box',
          margin: 10,
          font: {
            size: 16,
            face: 'Inter',
          }
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
        const network = new Network(
          containerRef.current,
          { nodes, edges },
          {
            nodes: {
              borderWidth: 2,
              color: {
                  border: 'hsl(var(--primary))',
                  background: 'hsl(var(--card))',
                  highlight: {
                    border: 'hsl(var(--primary))',
                    background: 'hsl(var(--accent))',
                  },
                  hover: {
                    border: 'hsl(var(--primary))',
                    background: 'hsl(var(--accent))',
                  }
              },
              font: { color: 'hsl(var(--foreground))' }
            },
            edges: {
              color: {
                color: 'hsl(var(--border))',
                highlight: 'hsl(var(--primary))',
                hover: 'hsl(var(--primary))',
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
          }
        );

        network.on('doubleClick', (params) => {
          if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            router.push(`/editor/${nodeId}`);
          }
        });

        // Add a click listener to open on single click for mobile-friendliness
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                router.push(`/editor/${nodeId}`);
            }
        });
      }
      setIsLoading(false);
    };

    generateGraph();
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
