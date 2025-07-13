
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'toolbox-ai-db';
const STORE_NAME = 'documents';
const DB_VERSION = 2; // Version bump for schema change

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
  status: 'active' | 'archived' | 'trashed'; // New status field
}

// Define the schema for our database
interface ToolboxAiDb extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Document;
    indexes: { 'updatedAt': Date; 'status': string }; // New index for status
  };
}

// A promise that resolves to the database connection.
// We keep it in a module-level variable to avoid re-initializing.
let dbPromise: Promise<IDBPDatabase<ToolboxAiDb>> | null = null;

const initDB = () => {
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = openDB<ToolboxAiDb>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, tx) {
      if (oldVersion < 1) {
        // This runs if the database is being created for the first time
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (oldVersion < 2) {
        // This runs if the user has version 1 and needs to upgrade to version 2
        const store = tx.objectStore(STORE_NAME);
        store.createIndex('status', 'status');
      }
    },
  });
  return dbPromise;
};

export const saveDocument = async (doc: Partial<Document>): Promise<number> => {
  const db = await initDB();
  const now = new Date();

  // If the document has an ID, it's an update.
  if (doc.id) {
    const existingDoc = await db.get(STORE_NAME, doc.id);
    if (existingDoc) {
      const updatedDoc = { ...existingDoc, ...doc, updatedAt: now };
      return db.put(STORE_NAME, updatedDoc);
    }
  }

  // If no ID, it's a new document.
  const newDoc: Document = {
    title: doc.title || 'Untitled Document',
    content: doc.content || { type: 'doc', content: [{ type: 'paragraph' }] },
    createdAt: now,
    updatedAt: now,
    status: doc.status || 'active', // Default status for new docs
  };
  return db.add(STORE_NAME, newDoc);
};

export const getAllDocuments = async (status: 'active' | 'archived' | 'trashed' = 'active'): Promise<Document[]> => {
  const db = await initDB();
  const docs = await db.getAllFromIndex(STORE_NAME, 'status', status);
  // Sort by updatedAt descending manually after fetching
  return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDocument = async (id: number): Promise<Document | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const deleteDocument = async (id: number): Promise<void> => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

export const deleteTrashedDocs = async (): Promise<void> => {
    const db = await initDB();
    const trashedDocs = await db.getAllFromIndex(STORE_NAME, 'status', 'trashed');
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all(trashedDocs.map(doc => doc.id && tx.store.delete(doc.id)));
    await tx.done;
};


// New function to export all data from the 'documents' table
export const exportAllData = async (): Promise<Blob> => {
  try {
    const db = await initDB();
    const allDocs = await db.getAll(STORE_NAME);
    
    // Create a structured backup object
    const backupData = {
      version: 1, // Add a version number for future migrations
      exportedAt: new Date().toISOString(),
      documents: allDocs,
    };

    // Convert the array of objects to a JSON string
    const jsonString = JSON.stringify(backupData, null, 2); // null, 2 for pretty-printing

    // Create a Blob from the JSON string
    return new Blob([jsonString], { type: 'application/json' });
  } catch (error) {
    console.error("Failed to export data:", error);
    throw new Error("Data export failed.");
  }
};


// New function to import data from a JSON file
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
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        
        // 1. Clear all existing data
        await store.clear();
        
        // 2. Add all new data from the backup
        // Note: idb doesn't have a bulkAdd, so we iterate. 
        // The transaction ensures this is atomic.
        await Promise.all(backupData.documents.map((doc: Document) => {
            // Re-instantiate dates which are lost in JSON serialization
            doc.createdAt = new Date(doc.createdAt);
            doc.updatedAt = new Date(doc.updatedAt);
            // Ensure status is set, default to active if missing
            doc.status = doc.status || 'active';
            return store.add(doc);
        }));

        await tx.done; // Commit the transaction
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
