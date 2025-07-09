import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import React, { useState, useRef, useEffect } from 'react'

// React component for the dual block layout
const DualBlockComponent = ({ node, updateAttributes, editor }) => {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeType, setResizeType] = useState(null)
  const containerRef = useRef(null)
  const leftBlockRef = useRef(null)
  const rightBlockRef = useRef(null)

  const { width = 400, height = 300, leftWidth = 50 } = node.attrs

  const handleMouseDown = (e, type) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeType(type)
    
    const handleMouseMove = (e) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      
      if (type === 'width') {
        // Resize main container width
        const newWidth = Math.max(200, Math.min(800, e.clientX - containerRect.left))
        updateAttributes({ width: newWidth })
      } else if (type === 'height') {
        // Resize main container height
        const newHeight = Math.max(150, Math.min(600, e.clientY - containerRect.top))
        updateAttributes({ height: newHeight })
      } else if (type === 'divider') {
        // Resize left/right split
        const newLeftWidth = Math.max(20, Math.min(80, ((e.clientX - containerRect.left) / containerRect.width) * 100))
        updateAttributes({ leftWidth: newLeftWidth })
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeType(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div 
      ref={containerRef}
      className="dual-block-container"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: '2px solid #e2e8f0',
        borderRadius: '8px',
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        background: '#f8fafc'
      }}
    >
      {/* Left Block */}
      <div 
        ref={leftBlockRef}
        className="left-block"
        style={{
          width: `${leftWidth}%`,
          height: '100%',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          margin: '8px',
          background: 'white',
          padding: '12px',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div 
          contentEditable
          suppressContentEditableWarning={true}
          className="block-content"
          style={{
            outline: 'none',
            minHeight: '100%',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          onBlur={(e) => {
            updateAttributes({ leftContent: e.target.innerHTML })
          }}
          dangerouslySetInnerHTML={{ __html: node.attrs.leftContent || 'Left block content...' }}
        >
        </div>
      </div>

      {/* Vertical Divider */}
      <div
        className="vertical-divider"
        style={{
          width: '4px',
          height: '100%',
          background: '#64748b',
          cursor: 'col-resize',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'divider')}
      >
        <div style={{
          width: '2px',
          height: '20px',
          background: '#475569',
          borderRadius: '1px'
        }} />
      </div>

      {/* Right Block */}
      <div 
        ref={rightBlockRef}
        className="right-block"
        style={{
          width: `${100 - leftWidth}%`,
          height: '100%',
          border: '1px solid #cbd5e1',
          borderRadius: '4px',
          margin: '8px',
          background: 'white',
          padding: '12px',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div 
          contentEditable
          suppressContentEditableWarning={true}
          className="block-content"
          style={{
            outline: 'none',
            minHeight: '100%',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
          onBlur={(e) => {
            updateAttributes({ rightContent: e.target.innerHTML })
          }}
          dangerouslySetInnerHTML={{ __html: node.attrs.rightContent || 'Right block content...' }}
        >
        </div>
      </div>

      {/* Width Resize Handle */}
      <div
        className="width-resize-handle"
        style={{
          position: 'absolute',
          right: '-6px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '12px',
          height: '40px',
          background: '#3b82f6',
          borderRadius: '6px',
          cursor: 'ew-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'width')}
      >
        <div style={{
          width: '2px',
          height: '20px',
          background: 'white',
          borderRadius: '1px'
        }} />
      </div>

      {/* Height Resize Handle */}
      <div
        className="height-resize-handle"
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '40px',
          height: '12px',
          background: '#3b82f6',
          borderRadius: '6px',
          cursor: 'ns-resize',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseDown={(e) => handleMouseDown(e, 'height')}
      >
        <div style={{
          width: '20px',
          height: '2px',
          background: 'white',
          borderRadius: '1px'
        }} />
      </div>

      {/* Resize indicator */}
      {isResizing && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: '#1f2937',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          pointerEvents: 'none'
        }}>
          {resizeType === 'width' && `Width: ${width}px`}
          {resizeType === 'height' && `Height: ${height}px`}
          {resizeType === 'divider' && `Split: ${leftWidth.toFixed(1)}% / ${(100 - leftWidth).toFixed(1)}%`}
        </div>
      )}
    </div>
  )
}

// TipTap Node Definition
export const DualBlockNode = Node.create({
  name: 'dualBlock',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      width: {
        default: 400,
        parseHTML: element => parseInt(element.getAttribute('data-width')) || 400,
        renderHTML: attributes => ({
          'data-width': attributes.width,
        }),
      },
      height: {
        default: 300,
        parseHTML: element => parseInt(element.getAttribute('data-height')) || 300,
        renderHTML: attributes => ({
          'data-height': attributes.height,
        }),
      },
      leftWidth: {
        default: 50,
        parseHTML: element => parseFloat(element.getAttribute('data-left-width')) || 50,
        renderHTML: attributes => ({
          'data-left-width': attributes.leftWidth,
        }),
      },
      leftContent: {
        default: '',
        parseHTML: element => element.querySelector('.left-block .block-content')?.innerHTML || '',
        renderHTML: attributes => ({
          'data-left-content': attributes.leftContent,
        }),
      },
      rightContent: {
        default: '',
        parseHTML: element => element.querySelector('.right-block .block-content')?.innerHTML || '',
        renderHTML: attributes => ({
          'data-right-content': attributes.rightContent,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-dual-block]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-dual-block': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(DualBlockComponent)
  },

  addCommands() {
    return {
      insertDualBlock: (attributes = {}) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: attributes,
        })
      },
    }
  },
})
