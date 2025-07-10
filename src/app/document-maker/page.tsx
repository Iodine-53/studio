import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TiptapEditor from '@/components/tiptap-editor';

export default function DocumentMakerPage() {
  return (
    <div className="flex flex-col min-h-screen bg-primary/5">
      <header className="sticky top-0 z-10 flex items-center h-16 px-4 border-b bg-background md:px-6">
        <nav className="flex items-center gap-4 text-lg font-medium md:gap-2 md:text-sm">
          <Button variant="outline" size="icon" className="shrink-0" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to Home</span>
            </Link>
          </Button>
          <h1 className="text-xl font-bold font-headline text-primary">
            Document Maker
          </h1>
        </nav>
      </header>
      {/* Main container to center the editor */}
      <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 md:p-8">
        
        {/* Wrapper to control the width and visual appearance of the editor's container */}
        <div className="w-full max-w-4xl glassmorphism rounded-2xl shadow-2xl overflow-hidden border">
          
          {/* Our Tiptap editor component is rendered here */}
          <TiptapEditor />

        </div>
      </main>
    </div>
  );
}
