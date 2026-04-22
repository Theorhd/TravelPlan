import type { SyncProviderPort } from "../../core/ports/SyncProviderPort";
import type { TravelPlanState } from "../../models/domain";
import { nowIsoTimestamp } from "../../utils/dates";

export class DiscordSyncProvider implements SyncProviderPort {
  constructor(private readonly webhookUrl: string) {}

  async sync(state: TravelPlanState): Promise<{ syncedAt: string; reference: string }> {
    if (!this.webhookUrl) {
      throw new Error("Missing Discord webhook URL");
    }

    const syncedAt = nowIsoTimestamp();
    const payload = {
      syncedAt,
      version: state.version,
      tripId: state.trip.id,
      userId: state.user.id,
      expensesCount: state.expenses.length,
      forecastsCount: state.forecasts.length,
      state,
    };

    const formData = new FormData();
    formData.append(
      "payload_json",
      JSON.stringify({
        content: `TravelPlan sync ${state.trip.title} at ${syncedAt}`,
      }),
    );
    formData.append(
      "file",
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      "travelplan-sync.json",
    );

    const response = await fetch(this.webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Discord sync failed with status ${response.status}`);
    }

    return {
      syncedAt,
      reference: "discord-webhook",
    };
  }
}
