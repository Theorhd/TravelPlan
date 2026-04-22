import type { TravelPlanState } from "../../models/domain";

export interface StorageGateway {
  initialize(): Promise<void>;
  loadState(): Promise<TravelPlanState | null>;
  saveState(state: TravelPlanState): Promise<void>;
}
