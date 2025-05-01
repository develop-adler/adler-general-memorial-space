// eslint-disable-next-line no-undef
self.onmessage = e => {
    // if is singular url
    if (typeof e.data === 'string') {
        // eslint-disable-next-line no-undef
        fetch(e.data)
            .then(res => res.arrayBuffer())
            .then(arrayBuffer => {
                // eslint-disable-next-line no-undef
                self.postMessage(arrayBuffer, [arrayBuffer]);
            })
            .catch(err => {
                // eslint-disable-next-line no-undef
                self.postMessage(null); // send null to indicate error

                throw new Error('Error loading url', err);
            });
    }
    // else if is array of urls
    else if (Array.isArray(e.data)) {
        // Array<{ name: string; url: string }>
        const results = {}; // Record<string, { fileURL: string; arrayBuffer: ArrayBuffer }>

        Promise.all(
            e.data.map(data =>
                // eslint-disable-next-line no-undef
                fetch(data.url)
                    .then(res => res.arrayBuffer())
                    .then(arrayBuffer => {
                        results[data.name] = {
                            fileURL: data.url,
                            arrayBuffer,
                        };
                    })
            )
        )
            .then(() => {
                // eslint-disable-next-line no-undef
                self.postMessage(
                    results,
                    Object.values(results).map(result => result.arrayBuffer)
                );
            })
            .catch(err => {
                // eslint-disable-next-line no-undef
                self.postMessage(null); // send null to indicate error

                throw new Error('Error loading urls', err);
            });
    }
};
