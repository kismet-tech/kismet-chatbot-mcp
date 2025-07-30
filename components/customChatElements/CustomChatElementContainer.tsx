import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface CustomChatElementContainerProps {
  children: React.ReactNode;
}

export function CustomChatElementContainer({ children }: CustomChatElementContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleEnterFullscreen = () => setIsFullscreen(true);
  const handleExitFullscreen = () => setIsFullscreen(false);

  // Normal mode rendering
  const normalContent = (
    <div 
      className="kismet-custom-chat-element-container w-full overflow-hidden rounded-lg"
      style={{ 
        maxWidth: 'var(--kismet-custom-element-width, 500px)',
        '--kismet-custom-element-width': '500px' // EASY TO ADJUST: Change this value to test different widths (e.g., '400px', '600px', '80%')
      } as React.CSSProperties}
    >
      <div className="relative group">
        {/* Expand Button - positioned over the child content */}
        <button
          onClick={handleEnterFullscreen}
          className="
            absolute 
            top-2 
            right-2 
            w-8 
            h-8 
            bg-black/20 
            hover:bg-black/40 
            text-white 
            rounded 
            flex 
            items-center 
            justify-center 
            transition-all 
            duration-200
            z-10
            opacity-0 
            group-hover:opacity-100
          "
          aria-label="Enter fullscreen"
          title="Enter fullscreen"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M6 2H2v4M10 2h4v4M14 10v4h-4M6 14H2v-4" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        {children}
      </div>
    </div>
  );

  // Fullscreen mode rendering (using portal to break out of chat bounds)
  const fullscreenContent = (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Close Button - positioned over the child content */}
        <button
          onClick={handleExitFullscreen}
          className="
            absolute 
            top-2 
            right-2 
            w-8 
            h-8 
            bg-black/20 
            hover:bg-black/40 
            text-white 
            rounded 
            flex 
            items-center 
            justify-center 
            transition-colors 
            duration-200
            z-50
          "
          aria-label="Exit fullscreen"
          title="Exit fullscreen"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M12 4L4 12M4 4l8 8" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        </button>
        
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );

  // Render normal content always, and portal fullscreen when needed
  return (
    <>
      {normalContent}
      {isFullscreen && typeof window !== 'undefined' && createPortal(
        fullscreenContent,
        document.body
      )}
    </>
  );
} 