// eslint-disable-next-line no-undef
self.onmessage = e => {
    // {
    //     dbName: string,
    //     dbVersion: number,
    //     storeName: string
    //     names?: string[]
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

        const trans = db.transaction(msg.storeName, 'readonly');
        const store = trans.objectStore(msg.storeName);
        const nameList = [];
        const base64List = [];
        trans.oncomplete = () => {
            db.close();
            // eslint-disable-next-line no-undef
            self.postMessage({ nameList, base64List });
        };
        const cursorRequest = store.openCursor();
        // cursorRequest.onerror = error => {
        //     // eslint-disable-next-line no-undef
        //     if (clientSettings.DEBUG) console.log(error);
        // };
        cursorRequest.onsuccess = e => {
            const cursor = e.target['result'];
            if (cursor) {
                const name = cursor.key;
                const base64 = cursor.value;

                if (msg.names && !msg.names.includes(name)) {
                    cursor.continue();
                    return;
                }

                nameList.push(name);
                base64List.push(base64);
                cursor.continue();
            }
        };
    };
};
