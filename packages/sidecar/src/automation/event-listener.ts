import type { AttentionState, EventTriggerType } from "@capyfin/contracts";
import type {
  AttentionChangeEvent,
  AutomationEventBus,
} from "../events/event-bus.ts";
import type { AutomationService } from "./service.ts";

const EARNINGS_KEYWORDS = [
  "earnings",
  "quarterly results",
  "q1",
  "q2",
  "q3",
  "q4",
];

function mapAttentionToEventType(
  state: AttentionState,
): EventTriggerType | null {
  switch (state) {
    case "stale":
      return "case-stale";
    case "drift-detected":
      return "drift-detected";
    case "catalyst-upcoming":
      return "catalyst-approaching";
    case "review-now":
      return "review-due";
    case "review-soon":
      return "review-due";
    default:
      return null;
  }
}

function isEarningsRelated(reason: string): boolean {
  const lower = reason.toLowerCase();
  return EARNINGS_KEYWORDS.some((kw) => lower.includes(kw));
}

export class AutomationEventListener {
  readonly #eventBus: AutomationEventBus;
  readonly #automationService: AutomationService;
  readonly #handler: (event: AttentionChangeEvent) => void;

  constructor(
    eventBus: AutomationEventBus,
    automationService: AutomationService,
  ) {
    this.#eventBus = eventBus;
    this.#automationService = automationService;
    this.#handler = (event: AttentionChangeEvent) => {
      void this.#onAttentionChange(event);
    };
  }

  start(): void {
    this.#eventBus.onAttentionChange(this.#handler);
  }

  stop(): void {
    this.#eventBus.offAttentionChange(this.#handler);
  }

  async #onAttentionChange(event: AttentionChangeEvent): Promise<void> {
    if (!event.isNew) return;

    const eventType = mapAttentionToEventType(event.item.attentionState);
    if (!eventType) return;

    const eventTypes: EventTriggerType[] = [eventType];

    // Also check for earnings-detected when catalyst-approaching
    if (
      eventType === "catalyst-approaching" &&
      isEarningsRelated(event.item.reason)
    ) {
      eventTypes.push("earnings-detected");
    }

    for (const type of eventTypes) {
      const automations = await this.#automationService.listByEventType(type);
      for (const automation of automations) {
        const triggeredBy = `event:${type}:${event.item.ticker}`;
        await this.#automationService.addRun(automation.id, {
          startedAt: new Date().toISOString(),
          completedAt: null,
          status: "running",
          duration: null,
          outputReportId: null,
          lastTriggeredBy: triggeredBy,
        });
      }
    }
  }
}
