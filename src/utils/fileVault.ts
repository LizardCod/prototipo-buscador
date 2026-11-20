export interface UploadedVaultFile {
  id: string;
  moduleId: string;
  name: string;
  size: number;
  mimeType: string;
  note?: string;
  uploadedAt: string;
  blob: Blob;
}

const DB_NAME = 'regis_excel_files_vault_v1';
const STORE_NAME = 'uploaded_files';
const DB_VERSION = 1;

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('moduleId', 'moduleId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllVaultFiles(): Promise<UploadedVaultFile[]> {
  try {
    const db = await openVaultDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as UploadedVaultFile[]) || [];
        items.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function saveVaultFile(file: UploadedVaultFile): Promise<void> {
  const db = await openVaultDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(file);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVaultFile(id: string): Promise<void> {
  const db = await openVaultDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export function triggerVaultFileDownload(item: UploadedVaultFile): void {
  const url = URL.createObjectURL(item.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
