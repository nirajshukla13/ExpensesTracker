// visual-edits dev server setup removed for local development.
// This file previously allowed Emergent visual-edit features and referenced external services.
// Keeping a minimal no-op export so the project doesn't break if this plugin is imported.

module.exports = function setupDevServer(config) {
  // No-op: visual edits disabled in this fork for local development.
  return config;
};
