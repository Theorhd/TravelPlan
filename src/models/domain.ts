export type Language = "fr-FR" | "en-US";
export type TabKey = "home" | "stats" | "forecast" | "rewind" | "trips";
export type LlmProviderKind = "none" | "openai" | "mistral" | "claude";
export type ExpenseSource = "manual" | "quick-add" | "ocr";

export type ExpenseCategory =
  | "lodging"
  | "food"
  | "transport"
  | "flights"
  | "activities"
  | "other";

export interface TravelUser {
  id: string;
  displayName: string;
  createdAt: string;
}

export interface Traveler {
  id: string;
  displayName: string;
}

export interface CountryBudgetPlan {
  countryCode: string;
  countryName: string;
  currency: string;
  city: string;
  district?: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
  categoryBudgets: Record<ExpenseCategory, number>;
}

export interface TripPlan {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  countries: CountryBudgetPlan[];
}

export interface Expense {
  id: string;
  tripId?: string;
  amount: number;
  currency: string;
  amountInEuro: number;
  category: ExpenseCategory;
  reason: string;
  description: string;
  merchant?: string;
  products?: string[];
  countryCode: string;
  countryName: string;
  city: string;
  district?: string;
  createdAt: string;
  source: ExpenseSource;
  travelerIds: string[];
  photoDataUrl?: string;
}

export interface ForecastExpense {
  id: string;
  tripId?: string;
  amount: number;
  currency: string;
  amountInEuro: number;
  category: ExpenseCategory;
  label: string;
  countryCode: string;
  scheduledDate: string;
  isBooked: boolean;
}

export interface GeoContext {
  countryCode: string;
  countryName: string;
  city: string;
  district: string;
  currency: string;
  latitude?: number;
  longitude?: number;
  updatedAt: string;
}

export interface BorderTransitionCandidate {
  fromCountryCode: string;
  fromCountryName: string;
  toCountryCode: string;
  toCountryName: string;
  detectedAt: string;
  remainingBudgetInFromCountry: number;
  overSpendInFromCountry: number;
}

export type BorderAdjustmentMode = "extend-trip" | "compress-next-country";

export interface LlmSettings {
  provider: LlmProviderKind;
  apiKey: string;
  model: string;
}

export interface TravelSettings {
  language: Language;
  autoSyncEnabled: boolean;
  discordWebhookUrl: string;
  llm: LlmSettings;
}

export interface TravelPlanState {
  version: number;
  user: TravelUser;
  travelers: Traveler[];
  trips: TripPlan[];
  activeTripId: string | null;
  trip: TripPlan;
  expenses: Expense[];
  forecasts: ForecastExpense[];
  settings: TravelSettings;
  geo: GeoContext;
  activeCountryCode: string;
  pendingBorderTransition: BorderTransitionCandidate | null;
  lastSyncAt?: string;
}

export interface TicketScanResult {
  merchant?: string;
  products: string[];
  amount?: number;
  currency?: string;
  confidence: number;
}

export interface CountryAdvice {
  visa: string;
  banking: string;
  health: string;
  notes: string;
}

export interface AiPlannerMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiActivityProposal {
  title: string;
  estimatedCostEuro: number;
  reason: string;
}

export interface AiPlannerResponse {
  answer: string;
  activities: AiActivityProposal[];
}

export interface AddExpenseInput {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  reason: string;
  description: string;
  source: ExpenseSource;
  countryCode?: string;
  countryName?: string;
  city?: string;
  district?: string;
  travelerIds: string[];
  merchant?: string;
  products?: string[];
  photoDataUrl?: string;
}

export interface AddForecastInput {
  amount: number;
  currency: string;
  category: ExpenseCategory;
  label: string;
  countryCode: string;
  scheduledDate: string;
  isBooked: boolean;
}

export interface SetupTripInput {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  countries: CountryBudgetPlan[];
}
