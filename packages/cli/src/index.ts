#!/usr/bin/env node

import { runCli } from "./app";

const exitCode = await runCli();

if (exitCode !== 0) {
  process.exitCode = exitCode;
}
