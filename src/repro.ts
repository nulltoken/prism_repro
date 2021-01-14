import Fs from 'fs';
import { getHttpOperationsFromSpec } from '@stoplight/prism-cli/dist/operations';
import * as pkg from '../node_modules/@stoplight/prism-cli/package.json'

const start = async () => {

  const filepath = __dirname + '/local-openapi.json';
  const content = JSON.parse(await Fs.promises.readFile(filepath, 'utf8'));

  console.log(`Running prism v${pkg.version}`)
  const timer2 = `Converting to Prism format`;
  console.time(timer2);
  const x = await getHttpOperationsFromSpec(content);
  console.timeEnd(timer2);
  console.log("Number of processed (basic) endpoints", x.length)
};

void (async function () {
  await start();
})();
