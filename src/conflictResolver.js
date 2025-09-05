// Future: plug-in conflict resolver(s). For now LWW used by syncHandler.
module.exports = {
  // Example interface: resolve(localContent, remoteContent) => { winner: 'local' | 'remote', mergedContent }
  resolve: (localContent, remoteContent) => ({
    winner: "remote",
    mergedContent: remoteContent,
  }),
};
