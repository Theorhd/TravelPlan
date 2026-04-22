import { useEffect, useMemo, useState } from "react";
import { RemoteLlmProvider } from "./api/RemoteLlmProvider";
import { TourDuMondisteAdviceApi } from "./api/TourDuMondisteAdviceApi";
import { AiPlannerFab } from "./components/ai/AiPlannerFab";
import { BorderTransitionSheet } from "./components/border/BorderTransitionSheet";
import { ForecastView } from "./components/forecast/ForecastView";
import { CountryHub } from "./components/home/CountryHub";
import { QuickAddPanel } from "./components/home/QuickAddPanel";
import { SetupWizard } from "./components/home/SetupWizard";
import { SmartExpenseForm } from "./components/home/SmartExpenseForm";
import { TabBar } from "./components/layout/TabBar";
import { TopBar } from "./components/layout/TopBar";
import { RewindView } from "./components/rewind/RewindView";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { StatsView } from "./components/stats/StatsView";
import { GlassCard } from "./components/ui/GlassCard";
import { TravelPlanProvider, useTravelPlan } from "./core/context";
import {
  countryBudgetPace,
  findCountryPlan,
  forecastAccuracyByCountry,
  getCountryExpenses,
  globalRemainingBudgetEuro,
  remainingCountryBudgetAfterForecastEuro,
  remainingCountryBudgetEuro,
  sumCategoryExpensesEuro,
  sumCountryExpensesEuro,
} from "./core/selectors/travelSelectors";
import { I18nProvider } from "./i18n";
import type { CountryAdvice, ExpenseCategory, TabKey } from "./models/domain";
import { AiTravelPlannerService } from "./services/ai/AiTravelPlannerService";
import { MockOcrProvider } from "./services/ticketscan/MockOcrProvider";
import "./App.css";

const CATEGORY_ORDER: ExpenseCategory[] = [
  "lodging",
  "food",
  "transport",
  "flights",
  "activities",
  "other",
];

function TravelPlanApp() {
  const {
    state,
    ready,
    error,
    updateUserId,
    configureTrip,
    addTraveler,
    addExpense,
    addForecast,
    refreshLocation,
    applyBorderTransition,
    dismissBorderTransition,
    updateSettings,
    syncNow,
  } = useTravelPlan();

  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [quickAmount, setQuickAmount] = useState(0);
  const [quickCurrency, setQuickCurrency] = useState("EUR");
  const [selectedCountryCode, setSelectedCountryCode] = useState(state.activeCountryCode);
  const [adviceMap, setAdviceMap] = useState<Record<string, CountryAdvice>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

  const ocrProvider = useMemo(() => new MockOcrProvider(), []);
  const adviceApi = useMemo(() => new TourDuMondisteAdviceApi(), []);
  const aiPlanner = useMemo(() => new AiTravelPlannerService(new RemoteLlmProvider()), []);

  useEffect(() => {
    setSelectedCountryCode(state.activeCountryCode);
  }, [state.activeCountryCode]);

  useEffect(() => {
    if (ready) {
      void refreshLocation();
    }
  }, [ready, refreshLocation]);

  const locale = state.settings.language;
  const selectedCountryPlan =
    findCountryPlan(state, selectedCountryCode) ??
    findCountryPlan(state, state.activeCountryCode) ??
    state.trip.countries[0];
  const selectedCountry = selectedCountryPlan?.countryCode ?? state.activeCountryCode;

  const pace = countryBudgetPace(state, selectedCountry);
  const rewindReliability = forecastAccuracyByCountry(state);

  const countryInsights = state.trip.countries.map((country) => ({
    countryCode: country.countryCode,
    spentEuro: sumCountryExpensesEuro(state, country.countryCode),
    remainingEuro: remainingCountryBudgetEuro(state, country.countryCode),
  }));

  async function loadAdvice(countryCode: string) {
    const advice = await adviceApi.getAdvice(countryCode);
    setAdviceMap((prev) => ({
      ...prev,
      [countryCode]: advice,
    }));
  }

  async function runTicketScan(hint: string, quickValue: number, quickValueCurrency: string) {
    const ticket = await ocrProvider.parseTicket(hint);
    const correctedAmount =
      ticket.amount !== undefined && Math.abs(ticket.amount - quickValue) > 0.01 ? ticket.amount : quickValue;
    const correctedCurrency = ticket.currency ?? quickValueCurrency;
    const autoSubmit = Boolean(ticket.merchant && ticket.amount !== undefined && ticket.products.length > 0);

    return {
      ticket,
      correctedAmount,
      correctedCurrency,
      autoSubmit,
    };
  }

  if (!ready) {
    return <main className="loading-screen">Preparing offline workspace...</main>;
  }

  return (
    <I18nProvider language={state.settings.language}>
      <main className="app-shell">
        <div className="bg-glow top" />
        <div className="bg-glow bottom" />

        <TopBar
          locationLabel={`${state.geo.countryName} · ${state.geo.city} · ${state.geo.district}`}
          onOpenSettings={() => setSettingsOpen(true)}
          onRefreshLocation={() => {
            void refreshLocation();
          }}
        />

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {error && <p className="error-banner">{error}</p>}

        <section className="app-content">
          {activeTab === "home" && (
            <>
              <GlassCard title="Initialization & Group Setup">
                <SetupWizard
                  userId={state.user.id}
                  trip={state.trip}
                  onUpdateUserId={updateUserId}
                  onConfigureTrip={configureTrip}
                  onAddTraveler={addTraveler}
                />
              </GlassCard>

              <div className="two-col-layout">
                <GlassCard title="Quick Add">
                  <QuickAddPanel
                    amount={quickAmount}
                    currency={quickCurrency}
                    onAmountChange={setQuickAmount}
                    onCurrencyChange={setQuickCurrency}
                    onOpenForm={() => {
                      setActiveTab("home");
                    }}
                  />
                </GlassCard>

                <GlassCard title="Smart Form" subtitle="Auto-fill location, OCR and traveler context">
                  <SmartExpenseForm
                    quickAmount={quickAmount}
                    quickCurrency={quickCurrency}
                    location={state.geo}
                    travelers={state.travelers}
                    onSubmit={addExpense}
                    onTicketScan={runTicketScan}
                  />
                </GlassCard>
              </div>

              <GlassCard title="Country Hub">
                <CountryHub
                  countries={state.trip.countries}
                  selectedCountryCode={selectedCountryCode}
                  insights={countryInsights}
                  locale={locale}
                  advice={adviceMap[selectedCountryCode] ?? null}
                  onSelect={setSelectedCountryCode}
                  onLoadAdvice={loadAdvice}
                />
              </GlassCard>
            </>
          )}

          {activeTab === "stats" && selectedCountryPlan && (
            <GlassCard>
              <StatsView
                countryName={selectedCountryPlan.countryName}
                locale={locale}
                remainingEuro={remainingCountryBudgetEuro(state, selectedCountry)}
                remainingAfterForecastEuro={remainingCountryBudgetAfterForecastEuro(state, selectedCountry)}
                targetPerDay={pace.targetPerDay}
                actualPerDay={pace.actualPerDay}
                paceRatio={pace.paceRatio}
                categories={CATEGORY_ORDER.map((category) => ({
                  category,
                  allocated: selectedCountryPlan.categoryBudgets[category],
                  spent: sumCategoryExpensesEuro(state, selectedCountry, category),
                }))}
              />
            </GlassCard>
          )}

          {activeTab === "forecast" && (
            <GlassCard>
              <ForecastView
                locale={locale}
                activeCountryCode={selectedCountry}
                forecasts={state.forecasts}
                onAddForecast={addForecast}
              />
            </GlassCard>
          )}

          {activeTab === "rewind" && (
            <GlassCard>
              <RewindView
                locale={locale}
                expenses={state.expenses}
                reliability={rewindReliability}
              />
            </GlassCard>
          )}
        </section>

        <footer className="summary-footer">
          <span>
            Global remaining: {globalRemainingBudgetEuro(state).toFixed(2)} EUR
          </span>
          <span>
            Country expenses: {getCountryExpenses(state, selectedCountry).length}
          </span>
          <span>User: {state.user.id}</span>
          <span>Travelers: {state.travelers.length}</span>
          {state.lastSyncAt && <span>Synced: {new Date(state.lastSyncAt).toLocaleString(locale)}</span>}
        </footer>

        <BorderTransitionSheet
          candidate={state.pendingBorderTransition}
          state={state}
          onOfficial={dismissBorderTransition}
          onConfirmWithDelay={(extraDays, mode) => applyBorderTransition(extraDays, mode)}
        />

        <SettingsPanel
          open={settingsOpen}
          settings={state.settings}
          onClose={() => setSettingsOpen(false)}
          onSave={updateSettings}
          onSync={syncNow}
        />

        <AiPlannerFab
          locationHeader={`${state.geo.countryName} · ${state.geo.city} · ${state.geo.district}`}
          onAsk={(prompt) => aiPlanner.askPlanner(state, prompt)}
        />
      </main>
    </I18nProvider>
  );
}

export default function App() {
  return (
    <TravelPlanProvider>
      <TravelPlanApp />
    </TravelPlanProvider>
  );
}
