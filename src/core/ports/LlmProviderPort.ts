import type {
  AiPlannerMessage,
  AiPlannerResponse,
  GeoContext,
  LlmSettings,
  TravelPlanState,
} from "../../models/domain";

export interface LlmProviderPort {
  generatePlan(params: {
    settings: LlmSettings;
    messages: AiPlannerMessage[];
    geo: GeoContext;
    state: TravelPlanState;
  }): Promise<AiPlannerResponse>;
}
