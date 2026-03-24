import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readComponent(): string {
  return readFileSync(resolve(__dirname, "EmptyState.tsx"), "utf-8");
}

// ---------------------------------------------------------------------------
// Shared EmptyState component — structure tests
// ---------------------------------------------------------------------------

void test("EmptyState component is exported", async () => {
  const mod = await import("./EmptyState");
  assert.equal(typeof mod.EmptyState, "function");
});

void test("COLOR_VARIANTS is exported with all workspace colors", async () => {
  const mod = await import("./EmptyState");
  assert.ok(mod.COLOR_VARIANTS, "COLOR_VARIANTS should be exported");
  for (const color of ["emerald", "violet", "blue", "amber"]) {
    assert.ok(
      (mod.COLOR_VARIANTS as Record<string, unknown>)[color],
      `COLOR_VARIANTS should include ${color}`,
    );
  }
});

void test("EmptyState renders glow pattern classes", () => {
  const src = readComponent();
  assert.ok(src.includes("blur-xl"), "Should use blur-xl for glow effect");
  assert.ok(
    src.includes("-inset-3"),
    "Glow layer should use -inset-3 positioning",
  );
  assert.ok(
    src.includes("rounded-2xl"),
    "Icon container should use rounded-2xl",
  );
});

void test("EmptyState renders icon container with size-14", () => {
  const src = readComponent();
  assert.ok(src.includes("size-14"), "Icon container should be size-14");
});

void test("EmptyState renders icon with size-6", () => {
  const src = readComponent();
  assert.ok(src.includes("size-6"), "Icon should be size-6");
});

void test("EmptyState renders heading with text-[17px] font-semibold", () => {
  const src = readComponent();
  assert.ok(
    src.includes("text-[17px]") && src.includes("font-semibold"),
    "Heading should use text-[17px] font-semibold",
  );
});

void test("EmptyState renders description with text-[13px] text-muted-foreground", () => {
  const src = readComponent();
  assert.ok(
    src.includes("text-[13px]") && src.includes("text-muted-foreground"),
    "Description should use text-[13px] text-muted-foreground",
  );
});

void test("EmptyState renders description with max-w-sm", () => {
  const src = readComponent();
  assert.ok(
    src.includes("max-w-sm"),
    "Description should constrain width with max-w-sm",
  );
});

void test("EmptyState uses centered flex layout with gap-5", () => {
  const src = readComponent();
  assert.ok(
    src.includes("items-center") &&
      src.includes("justify-center") &&
      src.includes("gap-5"),
    "Should use centered flex layout with gap-5",
  );
});

void test("EmptyState supports children for action buttons", () => {
  const src = readComponent();
  assert.ok(
    src.includes("children"),
    "Should accept children prop for custom actions",
  );
});

void test("EmptyState supports className override", () => {
  const src = readComponent();
  assert.ok(
    src.includes("className"),
    "Should accept className prop for wrapper customization",
  );
});

void test("Each color variant has glow, container, and icon classes", async () => {
  const mod = await import("./EmptyState");
  const variants = mod.COLOR_VARIANTS as Record<
    string,
    { glow: string; container: string; icon: string }
  >;
  for (const [name, variant] of Object.entries(variants)) {
    assert.ok(variant.glow, `${name} should have glow classes`);
    assert.ok(variant.container, `${name} should have container classes`);
    assert.ok(variant.icon, `${name} should have icon classes`);
    assert.ok(
      variant.glow.includes("blur-xl"),
      `${name} glow should include blur-xl`,
    );
  }
});
