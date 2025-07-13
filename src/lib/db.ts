
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'toolbox-ai-db';
const DOC_STORE_NAME = 'documents';
const VERSION_STORE_NAME = 'document_versions';
const DB_VERSION = 4;

// Define the structure of a Tiptap node for type safety
export type TiptapNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: TiptapNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
};

// Define the structure of our Document object
export interface Document {
  id?: number;
  title: string;
  content: TiptapNode; // Tiptap's JSON content
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'trashed';
  tags?: string[];
}

// Define the structure for a document version
export interface DocumentVersion {
    id?: number;
    docId: number;
    title: string;
    content: TiptapNode;
    timestamp: Date;
}

// Define the schema for our database
interface ToolboxAiDb extends DBSchema {
  [DOC_STORE_NAME]: {
    key: number;
    value: Document;
    indexes: { 'updatedAt': Date; 'status': string; 'tags': string };
  };
  [VERSION_STORE_NAME]: {
    key: number;
    value: DocumentVersion;
    indexes: { 'docId': number; 'timestamp': Date };
  }
}

let dbPromise: Promise<IDBPDatabase<ToolboxAiDb>> | null = null;

const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = openDB<ToolboxAiDb>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, tx) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
      
      let docStore;
      if (!db.objectStoreNames.contains(DOC_STORE_NAME)) {
        docStore = db.createObjectStore(DOC_STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      } else {
        docStore = tx.objectStore(DOC_STORE_NAME);
      }
      
      if (oldVersion < 2 && !docStore.indexNames.contains('status')) {
        docStore.createIndex('status', 'status');
      }
      if (oldVersion < 3 && !docStore.indexNames.contains('tags')) {
        docStore.createIndex('tags', 'tags', { multiEntry: true });
        tx.objectStore(DOC_STORE_NAME).iterate(doc => {
          if (doc && !doc.tags) {
            doc.tags = [];
            docStore.put(doc);
          }
        });
      }

      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains(VERSION_STORE_NAME)) {
            const versionStore = db.createObjectStore(VERSION_STORE_NAME, {
                keyPath: 'id',
                autoIncrement: true,
            });
            versionStore.createIndex('docId', 'docId');
            versionStore.createIndex('timestamp', 'timestamp');
        }
      }
    },
  });
  return dbPromise;
};

// --- Document Functions ---

export const saveDocument = async (doc: Partial<Document>): Promise<number> => {
  const db = await initDB();
  const now = new Date();

  if (doc.id) {
    const existingDoc = await db.get(DOC_STORE_NAME, doc.id);
    if (existingDoc) {
      const updatedDoc = { ...existingDoc, ...doc, updatedAt: now };
      return db.put(DOC_STORE_NAME, updatedDoc);
    }
  }

  const newDoc: Document = {
    title: doc.title || 'Untitled Document',
    content: doc.content || { type: 'doc', content: [{ type: 'paragraph' }] },
    createdAt: now,
    updatedAt: now,
    status: doc.status || 'active',
    tags: doc.tags || [],
  };
  return db.add(DOC_STORE_NAME, newDoc);
};

export const getAllDocuments = async (status?: 'active' | 'archived' | 'trashed'): Promise<Document[]> => {
  const db = await initDB();
  let docs;
  if (status) {
    docs = await db.getAllFromIndex(DOC_STORE_NAME, 'status', status);
  } else {
    docs = await db.getAll(DOC_STORE_NAME);
  }
  return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDocsByTag = async (tag: string): Promise<Document[]> => {
    const db = await initDB();
    const docs = await db.getAllFromIndex(DOC_STORE_NAME, 'tags', tag);
    return docs
        .filter(doc => doc.status === 'active')
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getAllTags = async (): Promise<string[]> => {
    const db = await initDB();
    const allDocs = await db.getAllFromIndex(DOC_STORE_NAME, 'status', 'active');
    const allTags = new Set<string>();
    allDocs.forEach(doc => {
        if (doc.tags) {
            doc.tags.forEach(tag => allTags.add(tag));
        }
    });
    return Array.from(allTags).sort();
};

export const getDocument = async (id: number): Promise<Document | undefined> => {
  const db = await initDB();
  return db.get(DOC_STORE_NAME, id);
};

export const deleteDocument = async (id: number): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction([DOC_STORE_NAME, VERSION_STORE_NAME], 'readwrite');
  const versionsToDelete = await tx.objectStore(VERSION_STORE_NAME).index('docId').getAll(id);
  const versionIds = versionsToDelete.map(v => v.id!);
  await Promise.all([
      tx.objectStore(DOC_STORE_NAME).delete(id),
      ...versionIds.map(vid => tx.objectStore(VERSION_STORE_NAME).delete(vid))
  ]);
  await tx.done;
};

export const deleteTrashedDocs = async (): Promise<void> => {
    const db = await initDB();
    const trashedDocs = await db.getAllFromIndex(DOC_STORE_NAME, 'status', 'trashed');
    const tx = db.transaction([DOC_STORE_NAME, VERSION_STORE_NAME], 'readwrite');
    await Promise.all(
        trashedDocs.map(doc => {
            if (doc.id) {
                // Also delete associated versions
                return deleteDocument(doc.id); 
            }
        })
    );
    await tx.done;
};

// --- Version History Functions ---

export const addDocVersion = async (version: Omit<DocumentVersion, 'id' | 'timestamp'>): Promise<number> => {
    const db = await initDB();
    const newVersion: DocumentVersion = {
        ...version,
        timestamp: new Date(),
    };
    return db.add(VERSION_STORE_NAME, newVersion);
};

export const getVersionsForDoc = async (docId: number): Promise<DocumentVersion[]> => {
    const db = await initDB();
    const versions = await db.getAllFromIndex(VERSION_STORE_NAME, 'docId', docId);
    return versions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};


// --- Export/Import/Delete Functions ---

export const exportAllData = async (): Promise<Blob> => {
  try {
    const db = await initDB();
    const allDocs = await db.getAll(DOC_STORE_NAME);
    const backupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      documents: allDocs,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    return new Blob([jsonString], { type: 'application/json' });
  } catch (error) {
    console.error("Failed to export data:", error);
    throw new Error("Data export failed.");
  }
};

export const importData = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        const backupData = JSON.parse(jsonString);

        if (!backupData.documents || !Array.isArray(backupData.documents)) {
          throw new Error("Invalid backup file format. Missing 'documents' array.");
        }
        
        const db = await initDB();
        const tx = db.transaction(DOC_STORE_NAME, 'readwrite');
        await tx.store.clear();
        await Promise.all(backupData.documents.map((doc: Document) => {
            doc.createdAt = new Date(doc.createdAt);
            doc.updatedAt = new Date(doc.updatedAt);
            doc.status = doc.status || 'active';
            doc.tags = doc.tags || [];
            if (doc.id) delete doc.id;
            return tx.store.add(doc);
        }));
        await tx.done;
        resolve();
      } catch (error) {
        console.error("Failed to import data:", error);
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};

export const deleteDatabase = async (): Promise<void> => {
    if (dbPromise) {
        const db = await dbPromise;
        db.close();
        dbPromise = null;
    }
    await new Promise<void>((resolve, reject) => {
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
            console.log(`Database "${DB_NAME}" deleted successfully.`);
            resolve();
        };
        deleteRequest.onerror = (event) => {
            console.error(`Error deleting database "${DB_NAME}":`, event);
            reject(deleteRequest.error);
        };
        deleteRequest.onblocked = () => {
            console.warn(`Database "${DB_NAME}" delete blocked. Please close other tabs with this app open.`);
            reject(new Error('Database deletion was blocked.'));
        };
    });
};
