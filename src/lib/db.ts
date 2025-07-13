
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'toolbox-ai-db';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

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
}

// Define the schema for our database
interface ToolboxAiDb extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Document;
    indexes: { 'updatedAt': Date };
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
    upgrade(db) {
      // This upgrade callback runs only when the DB is first created or the version number is increased.
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // Create an index to query/sort by the 'updatedAt' field.
        store.createIndex('updatedAt', 'updatedAt');
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
  };
  return db.add(STORE_NAME, newDoc);
};

export const getAllDocuments = async (): Promise<Document[]> => {
  const db = await initDB();
  // Use the 'updatedAt' index to get all docs and sort them in reverse order (newest first).
  return db.getAllFromIndex(STORE_NAME, 'updatedAt').then(docs => docs.reverse());
};

export const getDocument = async (id: number): Promise<Document | undefined> => {
  const db = await initDB();
  return db.get(STORE_NAME, id);
};

export const deleteDocument = async (id: number): Promise<void> => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
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
