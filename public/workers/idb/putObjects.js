// eslint-disable-next-line no-undef
self.onmessage = e => {
    // { 
    //     dbName: string,
    //     dbVersion: number
    //     storeName: string,
    //     objects: object[]
    // }
    const msg = e.data;

    let db;
    // eslint-disable-next-line no-undef
    const request = indexedDB.open(msg.dbName, msg.dbVersion);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request.onerror = e => {
        throw new Error('Unable to open IndexedDB:', e);
    };
    request.onsuccess = e => {
        db = e.target['result'];

        const trans = db.transaction(msg.storeName, 'readwrite');
        const store = trans.objectStore(msg.storeName);
        trans.oncomplete = () => {
            db.close();
            // eslint-disable-next-line no-undef
            self.postMessage(true);
        };
        msg.objects.forEach(object => {
            store.put(JSON.stringify(object), object.id);
        });
    };
};
