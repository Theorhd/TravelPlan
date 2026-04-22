import type {
  CountryBudgetPlan,
  Expense,
  ExpenseCategory,
  TravelPlanState,
} from "../../models/domain";
import { diffDays } from "../../utils/dates";

export function findCountryPlan(
  state: TravelPlanState,
  countryCode: string,
): CountryBudgetPlan | undefined {
  return state.trip.countries.find((country) => country.countryCode === countryCode);
}

export function getCountryExpenses(state: TravelPlanState, countryCode: string): Expense[] {
  return state.expenses
    .filter((expense) => expense.countryCode === countryCode)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function sumCountryExpensesEuro(state: TravelPlanState, countryCode: string): number {
  return getCountryExpenses(state, countryCode).reduce(
    (total, expense) => total + expense.amountInEuro,
    0,
  );
}

export function sumCountryForecastEuro(state: TravelPlanState, countryCode: string): number {
  return state.forecasts
    .filter((forecast) => forecast.countryCode === countryCode)
    .reduce((total, forecast) => total + forecast.amountInEuro, 0);
}

export function sumCategoryExpensesEuro(
  state: TravelPlanState,
  countryCode: string,
  category: ExpenseCategory,
): number {
  return getCountryExpenses(state, countryCode)
    .filter((expense) => expense.category === category)
    .reduce((total, expense) => total + expense.amountInEuro, 0);
}

export function remainingCountryBudgetEuro(state: TravelPlanState, countryCode: string): number {
  const country = findCountryPlan(state, countryCode);
  if (!country) {
    return 0;
  }

  return country.budgetTotal - sumCountryExpensesEuro(state, countryCode);
}

export function remainingCountryBudgetAfterForecastEuro(
  state: TravelPlanState,
  countryCode: string,
): number {
  return remainingCountryBudgetEuro(state, countryCode) - sumCountryForecastEuro(state, countryCode);
}

export function countryBudgetPace(state: TravelPlanState, countryCode: string): {
  consumed: number;
  targetPerDay: number;
  actualPerDay: number;
  paceRatio: number;
} {
  const country = findCountryPlan(state, countryCode);
  if (!country) {
    return {
      consumed: 0,
      targetPerDay: 0,
      actualPerDay: 0,
      paceRatio: 0,
    };
  }

  const tripDays = diffDays(country.startDate, country.endDate);
  const consumed = sumCountryExpensesEuro(state, countryCode);
  const targetPerDay = country.budgetTotal / tripDays;
  const actualPerDay = consumed / tripDays;

  return {
    consumed,
    targetPerDay,
    actualPerDay,
    paceRatio: targetPerDay === 0 ? 0 : actualPerDay / targetPerDay,
  };
}

export function globalRemainingBudgetEuro(state: TravelPlanState): number {
  const totalSpent = state.expenses.reduce((total, expense) => total + expense.amountInEuro, 0);
  return state.trip.totalBudget - totalSpent;
}

export function forecastAccuracyByCountry(state: TravelPlanState): Array<{
  countryCode: string;
  countryName: string;
  forecastEuro: number;
  actualEuro: number;
  reliabilityRatio: number;
}> {
  return state.trip.countries.map((country) => {
    const forecastEuro = sumCountryForecastEuro(state, country.countryCode);
    const actualEuro = sumCountryExpensesEuro(state, country.countryCode);
    const max = Math.max(actualEuro, 1);
    const reliabilityRatio = 1 - Math.min(Math.abs(actualEuro - forecastEuro) / max, 1);

    return {
      countryCode: country.countryCode,
      countryName: country.countryName,
      forecastEuro,
      actualEuro,
      reliabilityRatio,
    };
  });
}
