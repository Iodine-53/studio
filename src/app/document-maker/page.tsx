import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import TiptapEditor from '@/components/tiptap-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
        <div className="flex items-center w-full gap-4 ml-auto md:ml-auto md:gap-2 lg:gap-4">
          <Button className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
            <FileDown className="w-4 h-4 mr-2" />
            Export Document
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-0">
              <TiptapEditor />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
