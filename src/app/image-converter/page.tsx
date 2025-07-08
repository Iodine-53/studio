
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageConverterPage() {
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
            Image Converter & Compressor
          </h1>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Coming Soon!</h2>
          <p className="text-muted-foreground">This feature is under construction.</p>
        </div>
      </main>
    </div>
  );
}
