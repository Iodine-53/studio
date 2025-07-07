
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from 'date-fns';
import { BrainstormForm } from "@/components/brainstorm-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrainCircuit, Github, Twitter, PlusCircle, MoreVertical, FileEdit, Trash2, Search } from "lucide-react";
import { type Document, getAllDocuments, saveDocument, deleteDocument } from "@/lib/db";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";


const Logo = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
        <path d="M4 8.5C4 6.567 5.567 5 7.5 5h9c1.933 0 3.5 1.567 3.5 3.5v7c0 1.933-1.567 3.5-3.5 3.5h-9C5.567 19 4 17.433 4 15.5v-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
)


export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // State for document management
  const [searchTerm, setSearchTerm] = useState("");
  const [docToRename, setDocToRename] = useState<Document | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await getAllDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateNew = async () => {
    try {
      const newDocId = await saveDocument({
        title: "Untitled Document",
        content: { type: 'doc', content: [{ type: 'paragraph' }] },
      });
      router.push(`/editor/${newDocId}`);
    } catch (error) {
      console.error("Failed to create new document:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to create new document." });
    }
  };

  // --- Document Management Handlers ---

  const handleRenameInitiate = (doc: Document) => {
    setDocToRename(doc);
    setNewTitle(doc.title);
  };

  const handleRenameConfirm = async () => {
    if (!docToRename || !newTitle.trim()) return;
    try {
      await saveDocument({ ...docToRename, title: newTitle.trim() });
      toast({ title: "Success", description: `Renamed to "${newTitle.trim()}"` });
      await fetchDocuments();
    } catch (error) {
      console.error("Failed to rename document:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to rename document." });
    } finally {
        setDocToRename(null);
    }
  };

  const handleDeleteInitiate = (doc: Document) => {
    setDocToDelete(doc);
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete?.id) return;
    try {
      await deleteDocument(docToDelete.id);
      toast({ title: "Document Deleted", description: `"${docToDelete.title}" has been moved to trash.` });
      await fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete document." });
    } finally {
        setDocToDelete(null);
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Your Document Dashboard & Creative Suite
            </h2>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              Welcome back! Manage your documents or explore our suite of tools. Everything you need, right here in your browser.
            </p>
          </div>
        </section>

        <section id="documents" className="pb-20 md:pb-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-grow">
                    <h3 className="text-3xl md:text-4xl font-bold font-headline">My Documents</h3>
                    <p className="text-lg text-muted-foreground mt-2">Create, edit, and manage your work.</p>
                </div>
                <Button onClick={handleCreateNew} size="lg" className="shrink-0">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create New Document
                </Button>
            </div>
            
            <div className="relative mb-8 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search documents by title..."
                    className="w-full pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-7 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-5 w-1/2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredDocuments.map((doc) => (
                  doc.id && (
                    <Card 
                        key={doc.id} 
                        className="flex flex-col bg-card relative group transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1"
                    >
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => handleRenameInitiate(doc)}>
                                    <FileEdit className="mr-2 h-4 w-4" />
                                    <span>Rename</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteInitiate(doc)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <div onClick={() => router.push(`/editor/${doc.id}`)} className="flex flex-col flex-grow h-full cursor-pointer">
                            <CardHeader className="flex-grow">
                                <CardTitle className="truncate text-2xl font-headline group-hover:underline">{doc.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Updated: {format(new Date(doc.updatedAt), 'PP')}
                                </CardDescription>
                            </CardContent>
                        </div>
                    </Card>
                  )
                ))}
              </div>
            ) : (
                <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed bg-card/50">
                    <h4 className="text-2xl font-bold font-headline">Your workspace is empty</h4>
                    <p className="text-muted-foreground mt-2 mb-6">Click the button to create your first document.</p>
                    <Button onClick={handleCreateNew}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create a Document
                    </Button>
                </div>
            )}
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
          <div className="flex gap-2 mt-4 sm:mt-0 items-center">
            <ThemeToggle />
            <Button variant="ghost" size="icon" asChild><a href="https://twitter.com" aria-label="Twitter"><Twitter className="h-5 w-5"/></a></Button>
            <Button variant="ghost" size="icon" asChild><a href="https://github.com" aria-label="GitHub"><Github className="h-5 w-5"/></a></Button>
          </div>
        </div>
      </footer>

      {/* Dialog for Renaming Document */}
      <Dialog open={!!docToRename} onOpenChange={() => setDocToRename(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-title" className="text-right">
                Title
              </Label>
              <Input
                id="doc-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
                onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocToRename(null)}>Cancel</Button>
            <Button onClick={handleRenameConfirm}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog for Deleting Document */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document titled "{docToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
