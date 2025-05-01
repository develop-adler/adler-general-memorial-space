function arrayBufferToBase64(arrayBuffer) {
    let base64 = '';
    const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    const bytes = new Uint8Array(arrayBuffer);
    const byteLength = bytes.byteLength;
    const byteRemainder = byteLength % 3;
    const mainLength = byteLength - byteRemainder;

    let a, b, c, d, chunk;

    // Main loop deals with bytes in chunks of 3
    for (let i = 0; i < mainLength; i = i + 3) {
        // Combine the three bytes into a single integer
        chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

        // Use bitmasks to extract 6-bit segments from the triplet
        a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
        b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
        c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
        d = chunk & 63; // 63       = 2^6 - 1

        // Convert the raw binary segments to the appropriate ASCII encoding
        base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
        chunk = bytes[mainLength];

        a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

        // Set the 4 least significant bits to zero
        b = (chunk & 3) << 4; // 3   = 2^2 - 1

        base64 += encodings[a] + encodings[b] + '==';
    } else if (byteRemainder == 2) {
        chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

        a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
        b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

        // Set the 2 least significant bits to zero
        c = (chunk & 15) << 2; // 15    = 2^4 - 1

        base64 += encodings[a] + encodings[b] + encodings[c] + '=';
    }

    return base64;
}

// eslint-disable-next-line no-undef
self.onmessage = e => {
    // {
    //     dbName: string,
    //     dbVersion: number
    //     storeName: string,
    //     resources: { name: string, url: string }[]
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

        // check if any of the resources already exist in the store
        const getTrans = db.transaction(msg.storeName, 'readonly');
        const getStore = getTrans.objectStore(msg.storeName);
        const getRequest = getStore.getAllKeys();
        getRequest.onsuccess = e => {
            const names = e.target['result'];

            const results = {}; // Record<string, string>

            // remove existing names from resources list
            const remainingResources = msg.resources.filter(resource => !names.includes(resource.name));

            // if all resources already exist in IDB, just fetch all and return the urls
            if (remainingResources.length === 0) {
                const existingResources = msg.resources.filter(resource => names.includes(resource.name));
                Promise.all(
                    existingResources.map(resource =>
                        // eslint-disable-next-line no-undef
                        fetch(resource.url)
                            .then(res => {
                                if (res.ok) results[resource.name] = resource.url;
                                return res.arrayBuffer();
                            })
                            .then(arrayBuffer => ({
                                name: resource.name,
                                arrayBuffer: arrayBuffer,
                            }))
                    )
                )
                    .then(resources => {
                        // free memory
                        resources.forEach(resource => {
                            // eslint-disable-next-line no-undef
                            URL.revokeObjectURL(URL.createObjectURL(new Blob([resource.arrayBuffer])));
                        });

                        // eslint-disable-next-line no-undef
                        self.postMessage(results);
                    })
                    .catch(err => {
                        // eslint-disable-next-line no-undef
                        self.postMessage(false); // send false to indicate error

                        throw new Error('Error loading urls', err);
                    })
                    .finally(() => {
                        db.close();
                    });

                return;
            }

            // fetch remaining resources from url
            Promise.all(
                remainingResources.map(resource =>
                    // eslint-disable-next-line no-undef
                    fetch(resource.url)
                        .then(res => {
                            if (res.ok) results[resource.name] = resource.url;
                            return res.arrayBuffer();
                        })
                        .then(arrayBuffer => ({
                            name: resource.name,
                            arrayBuffer: arrayBuffer,
                        }))
                )
            )
                .then(resources => {
                    // put resources in IDB
                    const writeTrans = db.transaction(msg.storeName, 'readwrite');
                    const writeStore = writeTrans.objectStore(msg.storeName);
                    writeTrans.oncomplete = () => {
                        db.close();
                    };
                    resources.forEach(resource => {
                        writeStore.put(
                            'data:application/octet-stream;base64,' + arrayBufferToBase64(resource.arrayBuffer),
                            resource.name
                        );
                        // free up memory
                        // eslint-disable-next-line no-undef
                        URL.revokeObjectURL(URL.createObjectURL(new Blob([resource.arrayBuffer])));
                    });
                })
                .finally(() => {
                    if (remainingResources.length < msg.resources.length) {
                        // also fetch url of existing resources to preload
                        const existingResources = msg.resources.filter(resource =>
                            names.includes(resource.name)
                        );
                        Promise.all(
                            existingResources.map(resource =>
                                // eslint-disable-next-line no-undef
                                fetch(resource.url)
                                    .then(res => {
                                        if (res.ok) results[resource.name] = resource.url;
                                        return res.arrayBuffer();
                                    })
                                    .then(arrayBuffer => ({
                                        name: resource.name,
                                        arrayBuffer: arrayBuffer,
                                    }))
                            )
                        ).then(resources => {
                            resources.forEach(resource => {
                                // free up memory
                                // eslint-disable-next-line no-undef
                                URL.revokeObjectURL(URL.createObjectURL(new Blob([resource.arrayBuffer])));
                            });

                            // eslint-disable-next-line no-undef
                            self.postMessage(results);
                        });
                    } else {
                        // eslint-disable-next-line no-undef
                        self.postMessage(results);
                    }
                });
        };
    };
};
