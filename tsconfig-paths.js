const tsConfig =require("./tsconfig.json");
const tsConfigPaths = require("tsconfig-paths");
const baseUrl = "./build/src/"; // Either absolute or relative path
const cleanup = tsConfigPaths.register({
  "baseUrl": baseUrl,
  "paths": tsConfig.compilerOptions.paths,
});
// When path registration is no longer needed
