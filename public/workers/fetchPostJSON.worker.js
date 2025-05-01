// eslint-disable-next-line no-undef
self.onmessage = e => {
    // if is singular url
    if (typeof e.data === 'string') {
        // eslint-disable-next-line no-undef
        fetch(e.data)
            .then(res => res.json())
            .then(json => {
                // eslint-disable-next-line no-undef
                self.postMessage(json);
            })
            .catch(err => {
                // eslint-disable-next-line no-undef
                self.postMessage(null); // send null to indicate error

                throw new Error('Error fetching post json', err);
            });
    }
    // else if is array of urls
    else if (Array.isArray(e.data)) {
        // Array<{ id: string; path: string }>
        const results = {}; // Record<string, object>

        Promise.all(
            e.data.map(data =>
                // eslint-disable-next-line no-undef
                fetch(data.path)
                    .then(res => res.json())
                    .then(json => {
                        results[data.id] = json;
                    })
            )
        )
            .then(() => {
                // eslint-disable-next-line no-undef
                self.postMessage(results);
            })
            .catch(err => {
                // eslint-disable-next-line no-undef
                self.postMessage(null); // send null to indicate error

                throw new Error('Error fetching post jsons', err);
            });
    }
};
