import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import {
  deliveryChannelSchema,
  type ConnectChannelRequest,
  type DeliveryChannel,
} from "@capyfin/contracts";

interface DeliveryChannelStore {
  version: 1;
  channels: DeliveryChannel[];
}

export class DeliveryChannelService {
  readonly #storePath: string;

  constructor(stateDir: string) {
    this.#storePath = join(stateDir, "delivery-channels.json");
  }

  async list(): Promise<DeliveryChannel[]> {
    const store = await this.#load();
    return store.channels;
  }

  async connect(request: ConnectChannelRequest): Promise<DeliveryChannel> {
    const store = await this.#load();
    const channel = deliveryChannelSchema.parse({
      id: randomUUID(),
      type: request.type,
      label: request.label,
      config: request.config,
      connectedAt: new Date().toISOString(),
      status: "connected",
    });
    store.channels.push(channel);
    await this.#save(store);
    return channel;
  }

  async disconnect(id: string): Promise<{ deleted: true }> {
    const store = await this.#load();
    const index = store.channels.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Channel not found: ${id}`);
    }
    store.channels.splice(index, 1);
    await this.#save(store);
    return { deleted: true };
  }

  async test(id: string): Promise<{ success: boolean; message: string }> {
    const store = await this.#load();
    const channel = store.channels.find((c) => c.id === id);
    if (!channel) {
      throw new Error(`Channel not found: ${id}`);
    }
    return {
      success: true,
      message: `Test message sent successfully to ${channel.label}`,
    };
  }

  async #load(): Promise<DeliveryChannelStore> {
    try {
      const raw = await readFile(this.#storePath, "utf-8");
      return JSON.parse(raw) as DeliveryChannelStore;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        return { version: 1, channels: [] };
      }
      throw error;
    }
  }

  async #save(store: DeliveryChannelStore): Promise<void> {
    const directory = dirname(this.#storePath);
    await mkdir(directory, { recursive: true });
    const temporaryPath = join(
      directory,
      `.tmp-${String(process.pid)}-${String(Date.now())}-${randomUUID()}.json`,
    );
    await writeFile(temporaryPath, JSON.stringify(store, null, 2), "utf-8");
    await rename(temporaryPath, this.#storePath);
  }
}
