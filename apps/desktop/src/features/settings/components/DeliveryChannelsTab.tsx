import {
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  PhoneIcon,
  SendIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChannelDefinition {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
const CHANNELS: ChannelDefinition[] = [
  { id: "telegram", label: "Telegram", icon: SendIcon },
  { id: "discord", label: "Discord", icon: MessageSquareIcon },
  { id: "slack", label: "Slack", icon: MessageCircleIcon },
  { id: "whatsapp", label: "WhatsApp", icon: PhoneIcon },
  { id: "email", label: "Email", icon: MailIcon },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

export function DeliveryChannelsTab() {
  return (
    <div className="flex flex-col gap-5" data-testid="delivery-channels-tab">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">
          Delivery Channels
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Connect messaging platforms to receive alerts, reports, and
          notifications.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CHANNELS.map((channel) => (
          <div
            key={channel.id}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <channel.icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  {channel.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Not connected
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-md text-[11px]"
              disabled
            >
              Connect
            </Button>
          </div>
        ))}
      </div>

      <p className="text-[12px] text-muted-foreground/60">
        Channel integrations will be available with the Automation surface.
      </p>
    </div>
  );
}
