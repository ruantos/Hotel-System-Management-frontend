import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allowedMethods } from "../src/lib/api/backend-routes.ts";

const contract = JSON.parse(readFileSync(new URL("./fixtures/api-routes.json", import.meta.url), "utf8"));

test("lista do BFF corresponde às 36 operações verificadas no OpenAPI publicado", () => {
  assert.equal(contract.operations.length, 36);
  for (const operation of contract.operations) {
    const path = operation.path.replaceAll("{id}", "1");
    assert.ok(allowedMethods(path).includes(operation.method), operation.method + " " + path);
  }
  for (const template of new Set(contract.operations.map((operation) => operation.path))) {
    const expected = contract.operations.filter((operation) => operation.path === template).map((operation) => operation.method).sort();
    assert.deepEqual([...allowedMethods(template.replaceAll("{id}", "1"))].sort(), expected);
  }
});
