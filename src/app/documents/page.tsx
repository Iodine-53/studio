
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { format } from 'date-fns';
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
import { PlusCircle, MoreVertical, FileEdit, Trash2, Search, ArrowLeft, Share2, Upload, Download, Loader2 } from "lucide-react";
import { type Document, getAllDocuments, saveDocument, deleteDocument, exportAllData, importData } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from 'file-saver';
import { useDocumentSearch } from "@/hooks/useDocumentSearch";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [docToRename, setDocToRename] = useState<Document | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const { results: filteredDocuments, search } = useDocumentSearch(documents);


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
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
        const blob = await exportAllData();
        const date = new Date().toISOString().split('T')[0];
        saveAs(blob, `toolbox-ai-backup-${date}.json`);
        toast({ title: "Export Successful", description: "Your data has been downloaded." });
    } catch (error) {
        console.error("Export failed:", error);
        toast({ variant: 'destructive', title: "Export Failed", description: "Could not export your data." });
    } finally {
        setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Are you sure? Importing will overwrite all your current documents. This action cannot be undone.")) {
        // Clear the input value so the same file can be selected again
        if(importInputRef.current) importInputRef.current.value = "";
        return;
    }
    
    setIsImporting(true);
    try {
        await importData(file);
        toast({ title: "Import Successful", description: "Your data has been restored. The page will now reload." });
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        console.error("Import failed:", error);
        toast({ variant: 'destructive', title: "Import Failed", description: (error as Error).message || "Could not import the selected file." });
        setIsImporting(false);
    }
    // Clear the input value
    if(importInputRef.current) importInputRef.current.value = "";
  };


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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    search(query);
  }

  return (
    <>
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
                    Document Hub
                </h1>
            </nav>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="container mx-auto">
                <div className="mb-12 flex flex-col md:flex-row items-start justify-between gap-6">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">My Documents</h2>
                        <p className="text-lg text-muted-foreground mt-2">Create, edit, and manage all of your work.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="lg" asChild>
                            <Link href="/graph">
                                <Share2 className="mr-2 h-5 w-5" />
                                View Graph
                            </Link>
                        </Button>
                        <Button onClick={handleCreateNew} size="lg" className="shrink-0">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create New Document
                        </Button>
                    </div>
                </div>

                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="relative max-w-lg w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search document titles and content..."
                            className="w-full pl-10"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
                        <Button onClick={handleImportClick} variant="outline" disabled={isImporting}>
                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                            Import
                        </Button>
                        <Button onClick={handleExport} variant="outline" disabled={isExporting}>
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                            Export All
                        </Button>
                    </div>
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
        </main>
      </div>

      <Dialog open={!!docToRename} onOpenChange={() => setDocToRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Document</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="doc-title" className="text-right">Title</Label>
              <Input id="doc-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="col-span-3" onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocToRename(null)}>Cancel</Button>
            <Button onClick={handleRenameConfirm}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the document titled "{docToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
