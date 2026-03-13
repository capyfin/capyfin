#!/usr/bin/env node

import { runCli } from "./app.ts";

const exitCode = await runCli();

if (exitCode !== 0) {
  process.exitCode = exitCode;
}
