const fs = require('fs');
const path = require('path');
const packageJson = require('../package.json');

const environmentPath = path.join(__dirname, '../src/environment.ts');

let content = '';
const environment = makeEnvironment();
for (const key of Object.keys(environment)) {
  const value = environment[key];
  const type = typeof value;
  content += `export const ${key}: ${typeof value} = `;
  if (type === 'string') {
    content += `'${value}';\n`;
  } else {
    content += `${value};\n`;
  }
}
fs.writeFileSync(environmentPath, content);

function makeEnvironment() {
  let branch = fs.readFileSync('.git/HEAD', 'utf8').trim();
  if (!branch.startsWith('ref: refs/heads/')) {
    throw new Error('Unexpected .git/HEAD format: ' + branch);
  }
  branch = branch.substring(16);
  return {
    VERSION: packageJson.version,
    BRANCH: branch,
    IS_STAGING: branch !== 'master',
    WEBSITE_URL: 'https://openplural.webbiii.cc',
  };
}
