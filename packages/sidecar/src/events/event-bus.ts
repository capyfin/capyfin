import { EventEmitter } from "node:events";
import type { AttentionItem } from "@capyfin/contracts";

export interface AttentionChangeEvent {
  item: AttentionItem;
  isNew: boolean;
}

const ATTENTION_CHANGE = "attention-change";

export class AutomationEventBus extends EventEmitter {
  emitAttentionChange(event: AttentionChangeEvent): void {
    this.emit(ATTENTION_CHANGE, event);
  }

  onAttentionChange(handler: (event: AttentionChangeEvent) => void): void {
    this.on(ATTENTION_CHANGE, handler);
  }

  offAttentionChange(handler: (event: AttentionChangeEvent) => void): void {
    this.off(ATTENTION_CHANGE, handler);
  }
}
