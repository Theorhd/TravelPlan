import type { TravelPlanState } from "../../models/domain";

export interface SyncProviderPort {
  sync(state: TravelPlanState): Promise<{ syncedAt: string; reference: string }>;
}
