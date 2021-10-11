import { readFile } from 'fs/promises';
import { appendFileSync, readFileSync, writeFileSync } from 'fs';

import { isLeft } from 'fp-ts/lib/Either';
import { IHttpRequest, IHttpResponse } from '@stoplight/prism-http';
import route from '@stoplight/prism-http/dist/router';
import { validateInput, validateOutput } from '@stoplight/prism-http/dist/validator';
import { getHttpOperationsFromSpec } from '@stoplight/prism-cli/dist/operations';

import * as pkg from '../node_modules/@stoplight/prism-cli/package.json'

const start = async () => {

  const spec = JSON.parse(await readFile(__dirname + '/openapi.json', 'utf8')) as Record<string, unknown>;
  const resources = await getHttpOperationsFromSpec(spec);

  const inputRequest: IHttpRequest = {
    method: "get",
    url: {
      path: "/specific/echo/tests/something",
      baseUrl: undefined,
      query: {},
    },
    headers: { "x-tenant-id": "north-eu" },
  };

  const inputResponse: IHttpResponse = {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: {
      "now": 1631006011556,
    }
  };

  const path = __dirname + "/out.tsv";
  writeFileSync(path, "i\tHeapUsed\r\n", "utf8");

  const r = route({ resources, input: inputRequest });
  if (isLeft(r)) {
    throw new Error("Unmatched request");
  }

  let resource = r.right;

  global.gc();

  for (let i = 0; i < 5000; i++) {

    if (i % 10 === 0) {
      // Regularly update the list of operations
      // from a new version of the spec
      const resources = await getHttpOperationsFromSpec(spec);
      const r = route({ resources, input: inputRequest });
      if (isLeft(r)) {
        throw new Error("Unmatched request");
      }

      resource = r.right;
    }

    validateInput({ resource, element: inputRequest });
    validateOutput({ resource, element: inputResponse });

    if (i % 10 === 0) {
      const mem = process.memoryUsage();
      global.gc();
      appendFileSync(path, `${i}\t${mem.heapUsed}\r\n`);
    }
  }

  console.log();

  const content = readFileSync(path, "utf8");
  console.log(content);

  console.log(`Running prism v${pkg.version}`)
};

void (async function () {
  await start();
})();
