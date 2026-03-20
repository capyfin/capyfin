import { createInterface } from "node:readline/promises";
import readline from "node:readline";

export interface CliIo {
  readonly isInteractive: boolean;
  prompt(message: string): Promise<string>;
  promptSecret(message: string): Promise<string>;
  stderr(message: string): void;
  stdout(message: string): void;
}

export function createProcessCliIo(): CliIo {
  return {
    get isInteractive() {
      return process.stdin.isTTY && process.stdout.isTTY;
    },
    async prompt(message: string): Promise<string> {
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error(
          "Interactive input is unavailable in the current terminal.",
        );
      }

      const terminal = createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      try {
        return (await terminal.question(message)).trim();
      } finally {
        terminal.close();
      }
    },
    async promptSecret(message: string): Promise<string> {
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new Error(
          "Interactive secret input is unavailable in the current terminal.",
        );
      }

      return promptHidden(message, process.stdin, process.stdout);
    },
    stderr(message: string): void {
      process.stderr.write(message);
    },
    stdout(message: string): void {
      process.stdout.write(message);
    },
  };
}

async function promptHidden(
  message: string,
  input: NodeJS.ReadStream,
  output: NodeJS.WriteStream,
): Promise<string> {
  readline.emitKeypressEvents(input);

  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  output.write(message);

  return new Promise<string>((resolve, reject) => {
    let value = "";

    const cleanup = (): void => {
      input.off("keypress", onKeypress);
      input.setRawMode(wasRaw);
      output.write("\n");
    };

    const onKeypress = (keyValue: string, key: readline.Key): void => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Prompt cancelled by user."));
        return;
      }

      if (key.name === "return" || key.name === "enter") {
        cleanup();
        resolve(value.trim());
        return;
      }

      if (key.name === "backspace") {
        if (value.length === 0) {
          return;
        }

        value = value.slice(0, -1);
        output.write("\b \b");
        return;
      }

      if (keyValue.length !== 1 || key.ctrl || key.meta) {
        return;
      }

      value += keyValue;
      output.write("*");
    };

    input.on("keypress", onKeypress);
  });
}
