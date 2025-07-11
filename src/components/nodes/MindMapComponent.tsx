
"use client";

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import 'vis-network/dist/vis-network.min.css';

const MindMapComponent = ({ node, updateAttributes, editor }: NodeViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);

  useEffect(() => {
    if (containerRef.current && !networkRef.current) {
      const data = {
        nodes: node.attrs.nodes,
        edges: node.attrs.edges,
      };

      const options = {
        interaction: {
          dragNodes: true,
          zoomView: true,
          dragView: true,
        },
        manipulation: {
          // A simple way to add nodes/edges without a complex UI
          enabled: true,
          addNode: (nodeData: any, callback: (data: any) => void) => {
            nodeData.label = window.prompt("Enter node label", "New Idea") || "New Idea";
            callback(nodeData); // Add the node to the network
            updateState();
          },
          addEdge: (edgeData: any, callback: (data: any) => void) => {
            callback(edgeData); // Add the edge
            updateState();
          },
          editNode: (nodeData: any, callback: (data: any) => void) => {
            nodeData.label = window.prompt("Edit node label", nodeData.label) || nodeData.label;
            callback(nodeData);
            updateState();
          },
          deleteNode: (data: any, callback: (data: any) => void) => {
            callback(data);
            updateState();
          },
          deleteEdge: (data: any, callback: (data: any) => void) => {
            callback(data);
            updateState();
          }
        },
        nodes: {
            shape: 'box',
            margin: 10,
            font: {
                size: 14,
            },
            borderWidth: 1,
        },
        edges: {
            arrows: 'to',
            color: {
                inherit: 'from'
            }
        }
      };

      const network = new Network(containerRef.current, data, options);
      networkRef.current = network;

      // Helper function to get current data and save it to Tiptap
      const updateState = () => {
        if (networkRef.current) {
          const networkData = (networkRef.current as any).body.data;
          // Generate a data URL of the canvas to save for exporting
          const imageBase64 = networkRef.current.canvas.getContext().canvas.toDataURL();

          updateAttributes({
            nodes: networkData.nodes.get(),
            edges: networkData.edges.get(),
            imageBase64,
          });
        }
      };

      network.on('afterDrawing', updateState);
    }
    
    return () => {
        // Cleanup on unmount
        if (networkRef.current) {
            networkRef.current.destroy();
            networkRef.current = null;
        }
    }
  }, [node.attrs.nodes, node.attrs.edges, updateAttributes]);

  return (
    <NodeViewWrapper>
      <div 
        ref={containerRef} 
        className="w-full h-[500px] border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 my-4"
      />
      <div className="text-xs text-center text-gray-500 p-2">
        Double-click empty space to add a node. Drag from a node to another to connect.
      </div>
    </NodeViewWrapper>
  );
};

export default MindMapComponent;
