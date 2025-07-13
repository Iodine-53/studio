
import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'toolbox-ai-db';
const STORE_NAME = 'documents';
const DB_VERSION = 3; // IMPORTANT: Version bump for schema change

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

// Define the schema for our database
interface ToolboxAiDb extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: Document;
    indexes: { 'updatedAt': Date; 'status': string; 'tags': string };
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
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
      
      let store;
      if (oldVersion < 1) {
        store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      } else {
        store = tx.objectStore(STORE_NAME);
      }
      
      if (oldVersion < 2) {
          if (!store.indexNames.contains('updatedAt')) {
            store.createIndex('updatedAt', 'updatedAt');
          }
          if (!store.indexNames.contains('status')) {
            store.createIndex('status', 'status');
          }
      }
      if (oldVersion < 3) {
        if (!store.indexNames.contains('tags')) {
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
        // Add default tags array to existing documents
        tx.objectStore(STORE_NAME).iterate(doc => {
          if (doc && !doc.tags) {
            doc.tags = [];
            store.put(doc);
          }
        });
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
    status: doc.status || 'active',
    tags: doc.tags || [],
  };
  return db.add(STORE_NAME, newDoc);
};

export const getAllDocuments = async (status?: 'active' | 'archived' | 'trashed'): Promise<Document[]> => {
  const db = await initDB();
  let docs;
  if (status) {
    docs = await db.getAllFromIndex(STORE_NAME, 'status', status);
  } else {
    docs = await db.getAll(STORE_NAME);
  }
  // Sort by updatedAt descending manually after fetching
  return docs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDocsByTag = async (tag: string): Promise<Document[]> => {
    const db = await initDB();
    const docs = await db.getAllFromIndex(STORE_NAME, 'tags', tag);
    // Filter for active docs and sort
    return docs
        .filter(doc => doc.status === 'active')
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getAllTags = async (): Promise<string[]> => {
    const db = await initDB();
    const allDocs = await db.getAllFromIndex(STORE_NAME, 'status', 'active');
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
    const jsonString = JSON.stringify(backupData, (key, value) => {
      // The content object from tiptap can be circular, so we handle it.
      if (key === 'editor') return undefined;
      return value;
    }, 2);

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
            // Ensure tags are set, default to empty array if missing
            doc.tags = doc.tags || [];
            // Remove the ID to allow auto-incrementing to work correctly on a fresh import
            if (doc.id) delete doc.id;
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

// New function to completely delete the database
export const deleteDatabase = async (): Promise<void> => {
    // Close the connection if it's open
    if (dbPromise) {
        const db = await dbPromise;
        db.close();
        dbPromise = null; // Nullify the promise to allow re-initialization
    }
    // Use indexedDB's native deleteDatabase function
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
            // You might want to reject or alert the user here
            reject(new Error('Database deletion was blocked.'));
        };
    });
};
