import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const messageSrc = readFileSync(
  resolve(__dirname, "../../components/ai-elements/message.tsx"),
  "utf-8",
);

const chatWorkspaceSrc = readFileSync(
  resolve(__dirname, "components/ChatWorkspace.tsx"),
  "utf-8",
);

// --- Message component tests ---

void test("Message component does NOT use max-w-[95%] (too wide at large viewports)", () => {
  assert.ok(
    !messageSrc.includes("max-w-[95%]"),
    "Message must not use max-w-[95%] — text runs too wide on large screens",
  );
});

// --- ChatWorkspace centering wrapper tests ---

void test("messages area has a centering wrapper with max-w-3xl", () => {
  // The messages scroll area should contain a centered inner wrapper
  assert.ok(
    chatWorkspaceSrc.includes("max-w-3xl"),
    "Messages area must include a max-w-3xl constraint for readable line lengths",
  );
});

void test("messages centering wrapper uses mx-auto for horizontal centering", () => {
  // Find the messages wrapper section (between the messages area div and the messages mapping)
  const messagesAreaIdx = chatWorkspaceSrc.indexOf("Messages area");
  const relevantSection = chatWorkspaceSrc.slice(messagesAreaIdx, messagesAreaIdx + 600);
  assert.ok(
    relevantSection.includes("mx-auto"),
    "Messages wrapper must use mx-auto to center within the full-width scroll area",
  );
});

// --- Alignment tests ---

void test("user messages remain right-aligned with ml-auto", () => {
  assert.ok(
    messageSrc.includes("ml-auto"),
    "User messages must retain ml-auto for right-alignment",
  );
});

void test("assistant messages remain left-aligned (no ml-auto)", () => {
  // The assistant branch should not include ml-auto
  const assistantClass = /"is-assistant[^"]*"/.exec(messageSrc);
  assert.ok(assistantClass, "Message must have an is-assistant class branch");
  assert.ok(
    !assistantClass[0].includes("ml-auto"),
    "Assistant messages must not have ml-auto — they stay left-aligned",
  );
});

// --- Input bar unaffected ---

void test("input bar retains its own max-w-3xl (unaffected)", () => {
  const inputSection = chatWorkspaceSrc.slice(
    chatWorkspaceSrc.indexOf("Chat input"),
    chatWorkspaceSrc.indexOf("Chat input") + 800,
  );
  assert.ok(
    inputSection.includes("max-w-3xl"),
    "Input bar must retain max-w-3xl independently",
  );
});
