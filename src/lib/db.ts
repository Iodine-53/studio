import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'toolbox-ai-db';
const STORE_NAME = 'documents';
const DB_VERSION = 1;

// Define the structure of our Document object
export interface Document {
  id?: number;
  title: string;
  content: any; // Tiptap's JSON content
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
