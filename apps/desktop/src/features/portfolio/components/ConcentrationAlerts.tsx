import type { ConcentrationAlert } from "@capyfin/contracts";
import { AlertTriangleIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ConcentrationAlertsProps {
  alerts: ConcentrationAlert[];
}

export function ConcentrationAlerts({ alerts }: ConcentrationAlertsProps) {
  return (
    <Card className="border border-amber-500/30 bg-amber-500/5">
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="size-4" />
          Concentration Alerts
        </div>
        <ul className="flex flex-col gap-1">
          {alerts.map((alert) => (
            <li
              key={`${alert.type}-${alert.name}`}
              className="text-sm text-muted-foreground"
            >
              {alert.type === "position" ? (
                <>
                  <span className="font-medium text-foreground">
                    {alert.name}
                  </span>{" "}
                  represents {alert.weight.toFixed(1)}% of portfolio (threshold:
                  20%)
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">
                    {alert.name}
                  </span>{" "}
                  sector at {alert.weight.toFixed(1)}% (threshold: 40%)
                </>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
