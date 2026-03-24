import type { DeliveryChannel, DeliveryChannelType } from "@capyfin/contracts";
import { LoaderCircleIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { SidecarClient } from "@/lib/sidecar/client";
import { ChannelCard, CHANNEL_DEFINITIONS } from "./ChannelCard";
import { ChannelConnectForm } from "./ChannelConnectForm";

interface DeliveryChannelsTabProps {
  client: SidecarClient | null;
}

export function DeliveryChannelsTab({ client }: DeliveryChannelsTabProps) {
  const [channels, setChannels] = useState<DeliveryChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectType, setConnectType] = useState<DeliveryChannelType | null>(
    null,
  );
  const [connectLabel, setConnectLabel] = useState("");

  const fetchChannels = useCallback(async () => {
    if (!client) return;
    try {
      setIsLoading(true);
      setError(null);
      const result = await client.listDeliveryChannels();
      setChannels(result.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void fetchChannels();
  }, [fetchChannels]);

  const handleConnect = useCallback(
    async (type: DeliveryChannelType, config: Record<string, string>) => {
      if (!client) return;
      const def = CHANNEL_DEFINITIONS.find((d) => d.type === type);
      await client.connectDeliveryChannel({
        type,
        label: def?.label ?? type,
        config,
      });
      await fetchChannels();
    },
    [client, fetchChannels],
  );

  const handleDisconnect = useCallback(
    async (id: string) => {
      if (!client) return;
      await client.disconnectDeliveryChannel(id);
      await fetchChannels();
    },
    [client, fetchChannels],
  );

  const handleTest = useCallback(
    async (id: string) => {
      if (!client) throw new Error("No client");
      return client.testDeliveryChannel(id);
    },
    [client],
  );

  const openConnectForm = useCallback(
    (type: DeliveryChannelType, label: string) => {
      setConnectType(type);
      setConnectLabel(label);
    },
    [],
  );

  const closeConnectForm = useCallback(() => {
    setConnectType(null);
    setConnectLabel("");
  }, []);

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

      {isLoading && channels.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {CHANNEL_DEFINITIONS.map((def) => {
            const connected = channels.find((c) => c.type === def.type);
            return (
              <ChannelCard
                key={def.type}
                definition={def}
                channel={connected}
                onConnect={() => {
                  openConnectForm(def.type, def.label);
                }}
                onDisconnect={handleDisconnect}
                onTest={handleTest}
              />
            );
          })}
        </div>
      )}

      <ChannelConnectForm
        channelType={connectType}
        channelLabel={connectLabel}
        open={connectType !== null}
        onClose={closeConnectForm}
        onConnect={handleConnect}
      />
    </div>
  );
}
