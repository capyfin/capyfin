import type { ConcentrationAlert } from "@capyfin/contracts";
import { AlertTriangleIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ConcentrationAlertsProps {
  alerts: ConcentrationAlert[];
}

export function ConcentrationAlerts({ alerts }: ConcentrationAlertsProps) {
  return (
    <Card className="border-amber-500/20 bg-amber-500/[0.03] dark:border-amber-500/15 dark:bg-amber-500/[0.05]">
      <CardContent className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-700 dark:text-amber-400">
          <div className="flex size-7 items-center justify-center rounded-md bg-amber-500/10">
            <AlertTriangleIcon className="size-3.5" />
          </div>
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
