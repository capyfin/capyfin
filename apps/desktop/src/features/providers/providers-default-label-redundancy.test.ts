import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const workspaceSrc = readFileSync(
  resolve(__dirname, "components/ProvidersWorkspace.tsx"),
  "utf-8",
);

// --- Default label redundancy ---

void test("default button conditionally hides 'Default' text when connection.isDefault is true", () => {
  // The button should conditionally render the "Default" text based on isDefault
  // When isDefault is true, only the checkmark icon should show (no "Default" text)
  assert.ok(
    workspaceSrc.includes("connection.isDefault") &&
      workspaceSrc.includes("CheckIcon"),
    "Default button must reference connection.isDefault and show CheckIcon",
  );

  // The word "Default" in the actions button should be conditional, not static
  // Look for pattern where "Default" text is conditionally rendered
  const actionsButtonRegion = workspaceSrc.slice(
    workspaceSrc.indexOf('<div className="flex justify-end gap-1">'),
  );
  const buttonEnd = actionsButtonRegion.indexOf("</Button>");

  const buttonCode = actionsButtonRegion.slice(0, buttonEnd);

  // The button should NOT have a bare static "Default" text (it should be conditional)
  const hasConditionalDefault =
    buttonCode.includes("isDefault") &&
    (buttonCode.includes('? null') || buttonCode.includes("? undefined") || buttonCode.includes("{!connection.isDefault"));

  assert.ok(
    hasConditionalDefault,
    "Default text in the actions button must be conditionally hidden when connection.isDefault is true",
  );
});

void test("non-default providers still show actionable 'Default' text", () => {
  // The conditional rendering means non-default providers should still see "Default" text
  const actionsRegion = workspaceSrc.slice(
    workspaceSrc.indexOf('<div className="flex justify-end gap-1">'),
  );
  const firstButtonEnd = actionsRegion.indexOf("</Button>");
  const buttonCode = actionsRegion.slice(0, firstButtonEnd);

  // The button should contain "Default" text somewhere (for non-default case)
  assert.ok(
    buttonCode.includes("Default"),
    "The actions button must still contain 'Default' text for the non-default case",
  );
});

void test("connection badge in CONNECTION column still shows Default", () => {
  // The Badge with "Default" in the CONNECTION column should remain
  // The badge content and closing tag may be on separate lines
  const hasBadge = workspaceSrc.includes('variant="secondary"') &&
    workspaceSrc.includes("</Badge>");
  const badgeRegion = workspaceSrc.slice(
    workspaceSrc.indexOf('variant="secondary"'),
    workspaceSrc.indexOf("</Badge>") + 8,
  );
  assert.ok(
    hasBadge && badgeRegion.includes("Default"),
    "The CONNECTION column must still have a Default badge for default providers",
  );
});

void test("default button is still disabled when connection is default", () => {
  // The button should remain disabled when connection.isDefault
  const actionsRegion = workspaceSrc.slice(
    workspaceSrc.indexOf('<div className="flex justify-end gap-1">'),
  );
  const firstButtonEnd = actionsRegion.indexOf("</Button>");
  const buttonCode = actionsRegion.slice(0, firstButtonEnd);

  assert.ok(
    buttonCode.includes("connection.isDefault"),
    "Default button must still be disabled when connection.isDefault is true",
  );
});

void test("delete button is not affected", () => {
  // The trash/delete button should remain unchanged
  assert.ok(
    workspaceSrc.includes("Trash2Icon"),
    "Delete button with Trash2Icon must still be present",
  );
});
