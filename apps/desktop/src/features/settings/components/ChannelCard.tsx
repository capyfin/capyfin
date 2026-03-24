/* eslint-disable react-refresh/only-export-components */
import type { DeliveryChannel, DeliveryChannelType } from "@capyfin/contracts";
import {
  CheckCircle2Icon,
  LoaderCircleIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  SendIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChannelDefinition {
  type: DeliveryChannelType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment -- lucide-react icon types */
export const CHANNEL_DEFINITIONS: ChannelDefinition[] = [
  { type: "telegram", label: "Telegram", icon: SendIcon },
  { type: "discord", label: "Discord", icon: MessageSquareIcon },
  { type: "slack", label: "Slack", icon: MessageCircleIcon },
  { type: "email", label: "Email", icon: MailIcon },
];
/* eslint-enable @typescript-eslint/no-unsafe-assignment */

interface ChannelCardProps {
  definition: ChannelDefinition;
  channel: DeliveryChannel | undefined;
  onConnect: () => void;
  onDisconnect: (id: string) => Promise<void>;
  onTest: (id: string) => Promise<{ success: boolean; message: string }>;
}

export function ChannelCard({
  definition,
  channel,
  onConnect,
  onDisconnect,
  onTest,
}: ChannelCardProps) {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const isConnected = channel?.status === "connected";
  const Icon = definition.icon;

  const handleTest = useCallback(async () => {
    if (!channel) return;
    try {
      setIsTesting(true);
      setTestResult(null);
      const result = await onTest(channel.id);
      setTestResult(result);
      setTimeout(() => {
        setTestResult(null);
      }, 4000);
    } catch {
      setTestResult({ success: false, message: "Test failed" });
      setTimeout(() => {
        setTestResult(null);
      }, 4000);
    } finally {
      setIsTesting(false);
    }
  }, [channel, onTest]);

  const handleDisconnect = useCallback(async () => {
    if (!channel) return;
    try {
      setIsDisconnecting(true);
      await onDisconnect(channel.id);
      setShowDisconnectConfirm(false);
    } catch {
      // stay open on error
    } finally {
      setIsDisconnecting(false);
    }
  }, [channel, onDisconnect]);

  return (
    <>
      <div
        className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4"
        data-testid={`channel-card-${definition.type}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-foreground">
              {definition.label}
            </p>
            {isConnected ? (
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2Icon className="size-3" />
                Connected
                {channel.connectedAt ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    {new Date(channel.connectedAt).toLocaleDateString()}
                  </span>
                ) : null}
              </span>
            ) : (
              <p className="text-[11px] text-muted-foreground">Not connected</p>
            )}
            {testResult ? (
              <p
                className={`mt-0.5 text-[10px] font-medium ${
                  testResult.success
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                }`}
              >
                {testResult.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md text-[11px]"
                disabled={isTesting}
                onClick={() => {
                  void handleTest();
                }}
              >
                {isTesting ? (
                  <LoaderCircleIcon className="size-3 animate-spin" />
                ) : null}
                Test
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md text-[11px] text-destructive hover:text-destructive"
                onClick={() => {
                  setShowDisconnectConfirm(true);
                }}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-md text-[11px]"
              onClick={onConnect}
            >
              Connect
            </Button>
          )}
        </div>
      </div>

      {/* Disconnect confirmation dialog */}
      <Dialog
        open={showDisconnectConfirm}
        onOpenChange={(isOpen) => {
          if (!isOpen) setShowDisconnectConfirm(false);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Disconnect {definition.label}</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect{" "}
              <strong>{definition.label}</strong>? You will stop receiving
              deliveries through this channel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDisconnectConfirm(false);
              }}
              disabled={isDisconnecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDisconnecting}
              onClick={() => {
                void handleDisconnect();
              }}
            >
              {isDisconnecting ? (
                <LoaderCircleIcon className="size-3.5 animate-spin" />
              ) : null}
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
