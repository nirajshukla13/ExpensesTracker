// No-op placeholder Babel plugin to disable Emergent/visual-edit metadata injection.
// Keeping this file present prevents build errors where the plugin is referenced.

module.exports = function babelMetadataPluginNoop() {
  return {
    name: "element-metadata-plugin-noop",
    visitor: {},
  };
};
