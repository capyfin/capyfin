import assert from "node:assert/strict";
import test from "node:test";
import { resolveBrowserDevConnection } from "./connection";

void test("resolveBrowserDevConnection returns a dev browser connection", () => {
  const connection = resolveBrowserDevConnection(
    {
      DEV: true,
      VITE_CAPYFIN_BROWSER_SIDECAR_PASSWORD: "dev-secret",
      VITE_CAPYFIN_BROWSER_SIDECAR_URL: "http://127.0.0.1:19110",
      VITE_CAPYFIN_BROWSER_SIDECAR_USERNAME: "capyfin",
    },
    false,
  );

  assert.deepEqual(connection, {
    isSidecar: true,
    password: "dev-secret",
    url: "http://127.0.0.1:19110",
    username: "capyfin",
  });
});

void test("resolveBrowserDevConnection stays disabled outside browser dev mode", () => {
  assert.equal(
    resolveBrowserDevConnection(
      {
        DEV: false,
      },
      false,
    ),
    null,
  );

  assert.equal(
    resolveBrowserDevConnection(
      {
        DEV: true,
      },
      true,
    ),
    null,
  );
});
