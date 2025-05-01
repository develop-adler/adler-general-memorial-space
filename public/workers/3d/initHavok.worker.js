// eslint-disable-next-line
self.importScripts('https://cdn.babylonjs.com/havok/HavokPhysics_umd.js');

// eslint-disable-next-line
self.onmessage = e => {
    // eslint-disable-next-line
    HavokPhysics({ locateFile: () => e.data }).then((havok) => {
        // eslint-disable-next-line
        self.postMessage(havok);
    });
};