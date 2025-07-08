
"use client";

import Link from "next/link";
import { Github, Twitter, FileText, Image, AudioWaveform, Film, FileSliders, Voicemail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const Logo = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M4 8.5C4 6.567 5.567 5 7.5 5h9c1.933 0 3.5 1.567 3.5 3.5v7c0 1.933-1.567 3.5-3.5 3.5h-9C5.567 19 4 17.433 4 15.5v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)

const tools = [
  {
    title: "Document Hub",
    description: "Create, manage, and edit all your rich-text documents with AI-powered assistance.",
    href: "/documents",
    icon: FileText,
  },
  {
    title: "Text to Audio",
    description: "Convert any text into high-quality, natural-sounding speech with advanced AI voices.",
    href: "/text-to-audio",
    icon: Voicemail,
  },
  {
    title: "Image Converter",
    description: "Optimize and convert your images to modern formats like WebP for better performance.",
    href: "/image-converter",
    icon: Image,
  },
  {
    title: "Audio Converter",
    description: "Change the format of your audio files with our fast and reliable conversion tool.",
    href: "/audio-converter",
    icon: AudioWaveform,
  },
  {
    title: "Video to Audio",
    description: "Easily extract the audio track from any video file in just a few clicks.",
    href: "/video-to-audio",
    icon: Film,
  },
  {
    title: "PDF Toolkit",
    description: "Merge, split, watermark, and manage your PDF files with a suite of powerful tools.",
    href: "/pdf-tools",
    icon: FileSliders,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="absolute top-0 left-0 right-0 p-4">
        <div className="container mx-auto flex justify-end">
          <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Button variant="ghost" size="icon" asChild><a href="https://twitter.com" aria-label="Twitter" target="_blank" rel="noopener noreferrer"><Twitter className="h-5 w-5"/></a></Button>
              <Button variant="ghost" size="icon" asChild><a href="https://github.com" aria-label="GitHub" target="_blank" rel="noopener noreferrer"><Github className="h-5 w-5"/></a></Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="flex justify-center items-center gap-4 mb-6">
                <Logo />
                <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tighter text-primary">
                  ToolboxAI
                </h1>
            </div>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              Your complete suite of in-browser tools for documents, files, and creativity.
              No uploads, no waiting—just powerful tools right at your fingertips.
            </p>
          </div>
        </section>

        <section id="tools" className="pb-20 md:pb-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {tools.map((tool) => (
                <Link href={tool.href} key={tool.title} className="block group">
                  <Card className="h-full flex flex-col transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <div className="mb-4">
                        <tool.icon className="w-12 h-12 text-primary" />
                      </div>
                      <CardTitle className="text-2xl font-headline">{tool.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <CardDescription>{tool.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 bg-background border-t">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">&copy; {new Date().getFullYear()} ToolboxAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
