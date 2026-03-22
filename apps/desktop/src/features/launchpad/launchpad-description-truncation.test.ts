import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(filename: string): string {
  return readFileSync(resolve(__dirname, "components", filename), "utf-8");
}

// ---------------------------------------------------------------------------
// Description truncation — card descriptions are clamped to 2 lines
// ---------------------------------------------------------------------------

void test("ActionCardItem applies line-clamp-2 to the promise text", () => {
  const src = readComponent("ActionCardItem.tsx");

  assert.ok(
    src.includes("line-clamp-2"),
    "ActionCardItem must include line-clamp-2 to truncate description text to 2 lines",
  );
});

void test("ActionCardItem keeps heading fully visible without line clamping", () => {
  const src = readComponent("ActionCardItem.tsx");

  // The h3 heading element must NOT have line-clamp applied
  // Extract the h3 tag content
  const h3Match = /<h3[^>]*>/.exec(src);
  assert.ok(h3Match, "ActionCardItem must contain an h3 element for the title");
  assert.ok(
    !h3Match[0].includes("line-clamp"),
    "The h3 heading must not have line-clamp — headings should always be fully visible",
  );
});

void test("line-clamp-2 is applied to the description paragraph, not the card container", () => {
  const src = readComponent("ActionCardItem.tsx");

  // The line-clamp class must be on the <p> element that renders card.promise,
  // not on the outer Card or wrapper div
  const pMatch = /<p[\s\S]*?card\.promise[\s\S]*?<\/p>/.exec(src);
  assert.ok(
    pMatch,
    "ActionCardItem must have a <p> element rendering card.promise",
  );

  // Find the <p> tag opening that contains card.promise
  const pTagOpening =
    /<p\s+className="[^"]*"[^>]*>[\s\S]*?\{card\.promise\}/.exec(src);
  assert.ok(
    pTagOpening,
    "card.promise must be rendered inside a <p> with className",
  );
  assert.ok(
    pTagOpening[0].includes("line-clamp-2"),
    "line-clamp-2 must be on the <p> element that renders card.promise",
  );
});
