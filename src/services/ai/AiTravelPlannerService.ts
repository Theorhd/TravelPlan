import type { LlmProviderPort } from "../../core/ports/LlmProviderPort";
import {
  findCountryPlan,
  remainingCountryBudgetEuro,
  sumCategoryExpensesEuro,
  sumCountryForecastEuro,
} from "../../core/selectors/travelSelectors";
import type { AiPlannerResponse, TravelPlanState } from "../../models/domain";

function buildToolPayload(state: TravelPlanState): string {
  const currentCountryCode = state.activeCountryCode;
  const currentCountry = findCountryPlan(state, currentCountryCode);

  const functions = {
    getCurrentLocation: {
      country: state.geo.countryName,
      city: state.geo.city,
      district: state.geo.district,
      countryCode: state.geo.countryCode,
    },
    getRemainingCountryBudget: {
      countryCode: currentCountryCode,
      totalRemainingEuro: remainingCountryBudgetEuro(state, currentCountryCode),
    },
    getActivityBudget: {
      countryCode: currentCountryCode,
      allocatedEuro: currentCountry?.categoryBudgets.activities ?? 0,
      spentEuro: sumCategoryExpensesEuro(state, currentCountryCode, "activities"),
      remainingEuro:
        (currentCountry?.categoryBudgets.activities ?? 0) -
        sumCategoryExpensesEuro(state, currentCountryCode, "activities"),
    },
    getCountryForecastImpact: {
      countryCode: currentCountryCode,
      forecastTotalEuro: sumCountryForecastEuro(state, currentCountryCode),
    },
    getTravelers: state.travelers.map((traveler) => traveler.id),
  };

  return JSON.stringify(functions, null, 2);
}

function buildSystemPrompt(state: TravelPlanState): string {
  return [
    "You are the TravelPlan assistant.",
    "Always return budget-safe activities and practical logistics.",
    "If you suggest paid activities, respect the exact remaining activities budget.",
    "Prefer concrete nearby places, grouped by time of day.",
    "Answer in the app language selected by the user.",
    `User language: ${state.settings.language}`,
    `Live location: ${state.geo.countryName}, ${state.geo.city}, ${state.geo.district}`,
  ].join("\n");
}

export class AiTravelPlannerService {
  constructor(private readonly llmProvider: LlmProviderPort) {}

  async askPlanner(state: TravelPlanState, userPrompt: string): Promise<AiPlannerResponse> {
    return this.llmProvider.generatePlan({
      settings: state.settings.llm,
      geo: state.geo,
      state,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(state),
        },
        {
          role: "system",
          content: `Tool outputs from local SQLite context:\n${buildToolPayload(state)}`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });
  }
}
