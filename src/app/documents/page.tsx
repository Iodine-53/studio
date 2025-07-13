
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiKeyDialog } from "@/components/ApiKeyDialog";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreVertical, FileEdit, Trash2, Search, ArrowLeft, Share2, Upload, Download, Loader2, Archive, ArchiveRestore, History, AlertTriangle, Settings, Tag, X, File, FilePlus2, Users, Target } from "lucide-react";
import { type Document, getAllDocuments, saveDocument, deleteDocument, deleteTrashedDocs, exportAllData, importData, getAllTags, getDocsByTag } from "@/lib/db";
import { useToast } from "@/hooks/use-toast";
import { saveAs } from 'file-saver';
import { useDocumentSearch } from "@/hooks/useDocumentSearch";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { type DocumentTemplate, documentTemplates } from "@/lib/templates";

type DocStatus = 'active' | 'archived' | 'trashed';

// Helper to map icon string names to actual components
const iconMap: { [key: string]: React.FC<any> } = {
  File: File,
  FilePlus2: FilePlus2,
  Users: Users,
  Target: Target,
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DocStatus>('active');
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [docToRename, setDocToRename] = useState<Document | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);
  const [isEmptingTrash, setIsEmptyingTrash] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isNewDocDialogOpen, setIsNewDocDialogOpen] = useState(false);


  const [allTags, setAllTags] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);


  const { results: filteredDocuments, search } = useDocumentSearch(documents);


  const fetchDocuments = useCallback(async (status: DocStatus, tag?: string | null) => {
    setIsLoading(true);
    setSearchTerm(""); // Reset search on tab change/filter
    try {
      let docs;
      if (tag) {
          docs = await getDocsByTag(tag);
      } else {
          docs = await getAllDocuments(status);
      }
      setDocuments(docs);
      
      const tags = await getAllTags();
      setAllTags(tags);

    } catch (error) {
      console.error("Failed to fetch documents:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load documents." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDocuments(activeTab, activeTag);
  }, [activeTab, activeTag, fetchDocuments]);
  

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
    if(importInputRef.current) importInputRef.current.value = "";
  };

  const handleCreateNew = async (templateId?: string) => {
    setIsNewDocDialogOpen(false); // Close the dialog immediately
    
    let docPayload: Partial<Document> = {
      title: "Untitled Document",
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
      metadata: {},
      tags: [],
    };

    if (templateId) {
      const template = documentTemplates.find(t => t.id === templateId);
      if (template) {
        docPayload = {
          title: `Untitled ${template.label}`,
          content: template.content,
          metadata: template.metadata,
          tags: [], // Start with empty tags for templates
        };
      }
    }

    try {
      const newDocId = await saveDocument(docPayload);
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
      await fetchDocuments(activeTab, activeTag);
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
      toast({ title: "Document Permanently Deleted", description: `"${docToDelete.title}" has been deleted forever.` });
      await fetchDocuments(activeTab, activeTag);
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to delete document." });
    } finally {
        setDocToDelete(null);
    }
  };
  
  const handleEmptyTrash = async () => {
      if (!window.confirm("Are you absolutely sure? This will permanently delete all items in the trash. This action cannot be undone.")) return;
      setIsEmptyingTrash(true);
      try {
        await deleteTrashedDocs();
        toast({ title: "Trash Emptied", description: "All trashed documents have been deleted." });
        await fetchDocuments('trashed');
      } catch (error) {
        console.error("Failed to empty trash:", error);
        toast({ variant: 'destructive', title: "Error", description: "Could not empty the trash." });
      } finally {
        setIsEmptyingTrash(false);
      }
  };
  
  const handleStatusChange = async (doc: Document, status: DocStatus) => {
      if (!doc.id) return;
      try {
        await saveDocument({ id: doc.id, status });
        toast({ title: "Document Updated", description: `"${doc.title}" moved to ${status}.` });
        await fetchDocuments(activeTab, activeTag);
      } catch (error) {
         console.error("Failed to update status:", error);
         toast({ variant: 'destructive', title: "Error", description: "Could not update document status." });
      }
  }

  const handleTagClick = (tag: string) => {
    setActiveTag(tag);
    setActiveTab('active'); // Filtering by tag only makes sense for active documents
  };

  const clearTagFilter = () => {
    setActiveTag(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    search(query);
  }

  const renderDropdownItems = (doc: Document) => {
    switch(activeTab) {
        case 'active':
            return (
                <>
                <DropdownMenuItem onClick={() => handleStatusChange(doc, 'archived')}><Archive className="mr-2 h-4 w-4"/> Archive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(doc, 'trashed')} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Move to Trash</DropdownMenuItem>
                </>
            );
        case 'archived':
            return (
                <>
                <DropdownMenuItem onClick={() => handleStatusChange(doc, 'active')}><ArchiveRestore className="mr-2 h-4 w-4"/> Unarchive</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(doc, 'trashed')} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Move to Trash</DropdownMenuItem>
                </>
            );
        case 'trashed':
            return (
                <>
                <DropdownMenuItem onClick={() => handleStatusChange(doc, 'active')}><History className="mr-2 h-4 w-4"/> Restore</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteInitiate(doc)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4"/> Delete Permanently</DropdownMenuItem>
                </>
            );
        default:
            return null;
    }
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-primary/5">
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background md:px-6">
            <div className="flex items-center gap-4 text-lg font-medium md:gap-2 md:text-sm">
                <Button variant="outline" size="icon" className="shrink-0" asChild>
                    <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Home</span>
                    </Link>
                </Button>
                <h1 className="text-xl font-bold font-headline text-primary">
                    Document Hub
                </h1>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsApiDialogOpen(true)} aria-label="Settings">
                    <Settings className="h-5 w-5"/>
                </Button>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="container mx-auto">
                <div className="mb-8 flex flex-col md:flex-row items-start justify-between gap-6">
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
                        <Dialog open={isNewDocDialogOpen} onOpenChange={setIsNewDocDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="lg" className="shrink-0">
                                    <PlusCircle className="mr-2 h-5 w-5" />
                                    Create New Document
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>New Document</DialogTitle>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                <p className="text-sm text-muted-foreground">Start from a blank canvas or use a template to get going faster.</p>
                                <div className="space-y-2">
                                    <button onClick={() => handleCreateNew()} className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-4">
                                        <div className="p-2 bg-primary/10 rounded-md"><File className="h-5 w-5 text-primary" /></div>
                                        <div><div className="font-medium">Blank Document</div></div>
                                    </button>
                                    <h4 className="text-sm font-semibold text-muted-foreground px-3 pt-2">Templates</h4>
                                    {documentTemplates.map((template) => {
                                        const Icon = iconMap[template.icon] || FilePlus2;
                                        return (
                                            <button key={template.id} onClick={() => handleCreateNew(template.id)} className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-4">
                                                <div className="p-2 bg-primary/10 rounded-md"><Icon className="h-5 w-5 text-primary" /></div>
                                                <div><div className="font-medium">{template.label}</div></div>
                                            </button>
                                        );
                                    })}
                                </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar for Tags */}
                    <aside className="w-full md:w-64">
                        <h3 className="text-lg font-semibold mb-4">Tags</h3>
                        <div className="space-y-2">
                            {allTags.map(tag => (
                                <button key={tag} onClick={() => handleTagClick(tag)} className={cn("w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors", activeTag === tag ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                                    #{tag}
                                </button>
                            ))}
                            {allTags.length === 0 && (
                                <p className="text-sm text-muted-foreground px-3">No tags yet. Add some in the editor!</p>
                            )}
                            {activeTag && (
                                <Button variant="ghost" size="sm" onClick={clearTagFilter} className="w-full justify-start text-destructive hover:text-destructive mt-4">
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filter
                                </Button>
                            )}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocStatus)}>
                            <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <TabsList>
                                    <TabsTrigger value="active" onClick={() => setActiveTag(null)}>Active</TabsTrigger>
                                    <TabsTrigger value="archived" onClick={() => setActiveTag(null)}>Archived</TabsTrigger>
                                    <TabsTrigger value="trashed" onClick={() => setActiveTag(null)}>Trash</TabsTrigger>
                                </TabsList>
                                 <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                    <div className={cn("relative w-full sm:w-64", activeTab === 'trashed' && 'invisible')}>
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input type="search" placeholder="Search documents..." className="w-full pl-10" value={searchTerm} onChange={handleSearchChange} />
                                    </div>
                                    <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImportFile} />
                                    <div className="flex w-full sm:w-auto gap-2">
                                        <Button onClick={handleImportClick} variant="outline" disabled={isImporting} className="flex-1 sm:flex-none">
                                            {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4" />}
                                            Import
                                        </Button>
                                        <Button onClick={handleExport} variant="outline" disabled={isExporting} className="flex-1 sm:flex-none">
                                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                                            Export All
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            <TabsContent value={activeTab} className="mt-4">
                                {isLoading ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {Array.from({ length: 4 }).map((_, i) => (
                                            <Card key={i}><CardHeader><Skeleton className="h-7 w-3/4" /></CardHeader><CardContent><Skeleton className="h-5 w-1/2" /><div className="flex gap-2 mt-2"><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-20" /></div></CardContent></Card>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {activeTab === 'trashed' && documents.length > 0 && (
                                            <div className="mb-6 flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                                                <div className="flex items-center gap-3">
                                                    <AlertTriangle className="h-6 w-6 text-destructive" />
                                                    <p className="text-sm font-medium text-destructive">Items in the trash will be deleted automatically after 30 days.</p>
                                                </div>
                                                <Button onClick={handleEmptyTrash} variant="destructive" disabled={isEmptingTrash}>
                                                    {isEmptingTrash ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4"/>}
                                                    Empty Trash
                                                </Button>
                                            </div>
                                        )}
                                        {filteredDocuments.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {filteredDocuments.map((doc) => (
                                                doc.id && (
                                                    <Card key={doc.id} className="flex flex-col bg-card relative group transition-all duration-300 hover:border-primary hover:shadow-xl hover:-translate-y-1">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100" onClick={(e) => e.stopPropagation()}>
                                                                    <MoreVertical className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                                <DropdownMenuItem onClick={() => handleRenameInitiate(doc)}><FileEdit className="mr-2 h-4 w-4"/> Rename</DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                {renderDropdownItems(doc)}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        
                                                        <div onClick={() => router.push(`/editor/${doc.id}`)} className="flex flex-col flex-grow h-full cursor-pointer p-6">
                                                            <CardHeader className="p-0 flex-grow"><CardTitle className="truncate text-2xl font-headline group-hover:underline">{doc.title}</CardTitle></CardHeader>
                                                            <CardContent className="p-0 mt-4">
                                                                <CardDescription>Updated: {format(new Date(doc.updatedAt), 'PP')}</CardDescription>
                                                                <div className="flex flex-wrap gap-2 mt-3">
                                                                    {(doc.tags || []).map(tag => (
                                                                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={(e) => { e.stopPropagation(); handleTagClick(tag); }}>{tag}</Badge>
                                                                    ))}
                                                                </div>
                                                            </CardContent>
                                                        </div>
                                                    </Card>
                                                )
                                            ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed bg-card/50">
                                                <h4 className="text-2xl font-bold font-headline">This folder is empty</h4>
                                                <p className="text-muted-foreground mt-2 mb-6">There are no documents with the status '{activeTab}'.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </main>
      </div>

      <Dialog open={!!docToRename} onOpenChange={() => setDocToRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename Document</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4"><div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="doc-title" className="text-right">Title</Label><Input id="doc-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="col-span-3" onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()} /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setDocToRename(null)}>Cancel</Button><Button onClick={handleRenameConfirm}>Save changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the document titled "{docToDelete?.title}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Continue</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ApiKeyDialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen} />
    </>
  );
}
