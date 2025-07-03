import Link from "next/link";
import { BrainstormForm } from "@/components/brainstorm-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileAudio, FileSpreadsheet, FileText, FileVideo, Image as ImageIcon, Layers, BrainCircuit, Github, Twitter } from "lucide-react";

const tools = [
  {
    title: "Document Maker",
    description: "Create and export rich text documents right in your browser.",
    icon: <FileText className="w-10 h-10" />,
    link: "/document-maker",
  },
  {
    title: "Spreadsheet Generator",
    description: "Generate and download spreadsheets for your data needs.",
    icon: <FileSpreadsheet className="w-10 h-10" />,
    link: "#",
  },
  {
    title: "Image Converter",
    description: "Convert images between JPEG, PNG, WebP and more.",
    icon: <ImageIcon className="w-10 h-10" />,
    link: "#",
  },
  {
    title: "Audio Converter",
    description: "Switch audio formats like MP3, WAV, and AAC effortlessly.",
    icon: <FileAudio className="w-10 h-10" />,
    link: "#",
  },
  {
    title: "Video Converter",
    description: "Convert videos between MP4, MOV, AVI, and other formats.",
    icon: <FileVideo className="w-10 h-10" />,
    link: "#",
  },
  {
    title: "PDF Manipulator",
    description: "Merge, watermark, or compress your PDF files with ease.",
    icon: <Layers className="w-10 h-10" />,
    link: "#",
  },
];

const Logo = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M4 8.5C4 6.567 5.567 5 7.5 5h9c1.933 0 3.5 1.567 3.5 3.5v7c0 1.933-1.567 3.5-3.5 3.5h-9C5.567 19 4 17.433 4 15.5v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex justify-center items-center gap-4 mb-6">
                <Logo />
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter text-primary">
                ToolboxAI
                </h1>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-headline tracking-tighter mb-4">
              All Your Frontend Tools, One Click Away.
            </h2>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              ToolboxAI brings you a powerful suite of free, browser-based utilities. From document creation to file conversions, we've got you covered. No installations, no hidden fees.
            </p>
          </div>
        </section>

        <section id="tools" className="pb-20 md:pb-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h3 className="text-3xl md:text-4xl font-bold font-headline">A Tool for Every Task</h3>
              <p className="text-lg text-muted-foreground mt-2">Discover our collection of powerful and easy-to-use utilities.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {tools.map((tool) => (
                <Card key={tool.title} className="flex flex-col group overflow-hidden rounded-2xl border-2 border-transparent hover:border-primary transition-all duration-300 shadow-md hover:shadow-xl bg-card">
                    <CardHeader className="items-center text-center p-6">
                        <div className="p-4 bg-primary/10 rounded-full text-primary mb-4 transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                        {tool.icon}
                        </div>
                        <CardTitle className="font-headline text-2xl">{tool.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center flex-grow p-6 pt-0">
                        <p className="text-muted-foreground">{tool.description}</p>
                    </CardContent>
                    <CardFooter className="justify-center p-6 pt-0">
                        <Button asChild variant="outline" className="group-hover:bg-accent group-hover:text-accent-foreground group-hover:border-accent transition-colors duration-300">
                          <Link href={tool.link}>Use Tool</Link>
                        </Button>
                    </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="ai-brainstorm" className="py-20 md:py-32 bg-primary/5">
           <div className="container mx-auto px-4 md:px-6">
             <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <BrainCircuit className="w-16 h-16 text-primary mb-4" />
                <h3 className="text-3xl md:text-4xl font-bold font-headline">Unleash Your Creativity</h3>
                <p className="text-lg text-muted-foreground mt-4 mb-6">
                  Stuck on an idea? Let our AI brainstorming partner help you generate creative and innovative ideas for any topic. Just enter a keyword and watch the magic happen.
                </p>
              </div>
              <div className="bg-card p-8 rounded-2xl shadow-lg">
                <BrainstormForm />
              </div>
            </div>
           </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} ToolboxAI. All rights reserved.</p>
          <div className="flex gap-2 mt-4 sm:mt-0">
             <Button variant="ghost" size="icon" asChild><a href="#" aria-label="Twitter"><Twitter className="h-5 w-5"/></a></Button>
             <Button variant="ghost" size="icon" asChild><a href="#" aria-label="GitHub"><Github className="h-5 w-5"/></a></Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
