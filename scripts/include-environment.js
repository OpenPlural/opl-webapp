const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const environmentPath = path.join(__dirname, '../src/environment.ts');

let content = '';
const environment = makeEnvironment();
for (const key of Object.keys(environment)) {
  const value = environment[key];
  content += `export const ${key}: string = '${value}';\n`;
}
fs.writeFileSync(environmentPath, content);

function makeEnvironment() {
  return {
    VERSION: packageJson.version,
  };
}
