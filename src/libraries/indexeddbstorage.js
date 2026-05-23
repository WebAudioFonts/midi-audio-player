const DB_NAME = "MidiAudioPlayer";
const STORE_NAME = "KeyValues";
const DEFAULT_VERSION = 1;

let dbInstance = null;
let currentVersion = DEFAULT_VERSION;

async function getDB(version = currentVersion) {
    if (dbInstance && version !== currentVersion) {
        dbInstance.close();
        dbInstance = null;
        currentVersion = version;
    }
    if (dbInstance) return dbInstance;
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, version);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
        request.onsuccess = (e) => {
            dbInstance = e.target.result;
            resolve(dbInstance);
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

const indexedDbStorage = {
    async setVersion(version) {
        await getDB(version);
    },

    async setItem(key, value, compress = false) {
        const db = await getDB();
        let finalData = value;
        let isCompressed = false;

        if (compress) {
            const stringData = JSON.stringify(value);
            const stream = new Blob([stringData]).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
            const response = new Response(compressedStream);
            finalData = await response.arrayBuffer();
            isCompressed = true;
        }

        const record = { data: finalData, isCompressed };

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(record, key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getItem(key) {
        const db = await getDB();
        const record = await new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!record) return null;

        if (record.isCompressed) {
            const stream = new Blob([record.data]).stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
            const response = new Response(decompressedStream);
            const text = await response.text();
            return JSON.parse(text);
        }

        return record.data;
    },

    async removeItem(key) {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async clear() {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};

export default indexedDbStorage;