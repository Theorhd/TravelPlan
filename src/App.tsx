import { useEffect, useMemo, useState } from "react";
import { RemoteLlmProvider } from "./api/RemoteLlmProvider";
import { TourDuMondisteAdviceApi } from "./api/TourDuMondisteAdviceApi";
import { AiPlannerFab } from "./components/ai/AiPlannerFab";
import { AuthLanding } from "./components/auth/AuthLanding";
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
import { TripsView } from "./components/trips/TripsView";
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
import type { CountryAdvice, ExpenseCategory, SetupTripInput, TabKey } from "./models/domain";
import { AiTravelPlannerService } from "./services/ai/AiTravelPlannerService";
import { MockOcrProvider } from "./services/ticketscan/MockOcrProvider";
import { ensureUserIdFormat } from "./utils/ids";
import "./App.css";

const CATEGORY_ORDER: ExpenseCategory[] = [
  "lodging",
  "food",
  "transport",
  "flights",
  "activities",
  "other",
];

type AuthRecord = {
  id: string;
  displayName: string;
  password: string;
  createdAt: string;
};

const AUTH_USERS_STORAGE_KEY = "travelplan.auth.users.v1";
const AUTH_SESSION_STORAGE_KEY = "travelplan.auth.session.v1";

function loadAuthUsers(): AuthRecord[] {
  const raw = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AuthRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAuthUsers(users: AuthRecord[]) {
  localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(users));
}

function TravelPlanApp() {
  const {
    state,
    ready,
    error,
    updateUserProfile,
    createTrip,
    switchTrip,
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [showCreateTourPrompt, setShowCreateTourPrompt] = useState(false);
  const [hasPromptedEmptyTrips, setHasPromptedEmptyTrips] = useState(false);

  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<AuthRecord | null>(null);

  const ocrProvider = useMemo(() => new MockOcrProvider(), []);
  const adviceApi = useMemo(() => new TourDuMondisteAdviceApi(), []);
  const aiPlanner = useMemo(() => new AiTravelPlannerService(new RemoteLlmProvider()), []);

  const hasActiveTrip = Boolean(state.activeTripId && state.trip.countries.length > 0);

  useEffect(() => {
    setSelectedCountryCode(state.activeCountryCode);
  }, [state.activeCountryCode]);

  useEffect(() => {
    if (ready && sessionUser) {
      void refreshLocation();
    }
  }, [ready, refreshLocation, sessionUser]);

  useEffect(() => {
    const users = loadAuthUsers();
    const currentUserId = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!currentUserId) {
      setAuthReady(true);
      return;
    }

    const matchedUser = users.find((user) => user.id === currentUserId);
    if (!matchedUser) {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      setAuthReady(true);
      return;
    }

    setSessionUser(matchedUser);
    updateUserProfile({
      id: matchedUser.id,
      displayName: matchedUser.displayName,
    });
    setAuthReady(true);
  }, [updateUserProfile]);

  useEffect(() => {
    if (!sessionUser || !ready || hasPromptedEmptyTrips || state.trips.length > 0) {
      return;
    }

    setShowCreateTourPrompt(true);
    setHasPromptedEmptyTrips(true);
  }, [hasPromptedEmptyTrips, ready, sessionUser, state.trips.length]);

  useEffect(() => {
    if (state.trips.length > 0) {
      setShowCreateTourPrompt(false);
    }
  }, [state.trips.length]);

  const locale = state.settings.language;
  const selectedCountryPlan = hasActiveTrip
    ? findCountryPlan(state, selectedCountryCode) ??
      findCountryPlan(state, state.activeCountryCode) ??
      state.trip.countries[0]
    : undefined;
  const selectedCountry = selectedCountryPlan?.countryCode ?? state.activeCountryCode;

  const pace = hasActiveTrip && selectedCountry
    ? countryBudgetPace(state, selectedCountry)
    : {
        consumed: 0,
        targetPerDay: 0,
        actualPerDay: 0,
        paceRatio: 0,
      };
  const rewindReliability = hasActiveTrip ? forecastAccuracyByCountry(state) : [];

  const countryInsights = hasActiveTrip
    ? state.trip.countries.map((country) => ({
        countryCode: country.countryCode,
        spentEuro: sumCountryExpensesEuro(state, country.countryCode),
        remainingEuro: remainingCountryBudgetEuro(state, country.countryCode),
      }))
    : [];

  function applySessionUser(user: AuthRecord) {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, user.id);
    setSessionUser(user);
    updateUserProfile({
      id: user.id,
      displayName: user.displayName,
    });
    setAuthError(null);
  }

  function handleLogin(payload: { id: string; password: string }) {
    const normalizedId = ensureUserIdFormat(
      payload.id.trim().startsWith("@") ? payload.id.trim().slice(1) : payload.id.trim(),
    );

    setAuthBusy(true);
    const users = loadAuthUsers();
    const matchedUser = users.find((user) => user.id === normalizedId && user.password === payload.password);

    if (!matchedUser) {
      setAuthError("Identifiants invalides. Verifiez votre ID et mot de passe.");
      setAuthBusy(false);
      return;
    }

    applySessionUser(matchedUser);
    setAuthBusy(false);
  }

  function handleRegister(payload: { displayName?: string; id: string; password: string }) {
    const normalizedId = ensureUserIdFormat(
      payload.id.trim().startsWith("@") ? payload.id.trim().slice(1) : payload.id.trim(),
    );

    if (payload.password.trim().length < 6) {
      setAuthError("Le mot de passe doit contenir au moins 6 caracteres.");
      return;
    }

    setAuthBusy(true);
    const users = loadAuthUsers();
    if (users.some((user) => user.id === normalizedId)) {
      setAuthError("Cet ID existe deja. Essayez un autre @username.");
      setAuthBusy(false);
      return;
    }

    const nextUser: AuthRecord = {
      id: normalizedId,
      displayName: payload.displayName?.trim() || normalizedId.replace("@", ""),
      password: payload.password,
      createdAt: new Date().toISOString(),
    };

    saveAuthUsers([...users, nextUser]);
    applySessionUser(nextUser);
    setAuthBusy(false);
  }

  function handleCompleteWizard(input: SetupTripInput) {
    createTrip(input);
    setWizardOpen(false);
    setShowCreateTourPrompt(false);
    setActiveTab("home");
  }

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

  if (!ready || !authReady) {
    return <main className="loading-screen">Preparing offline workspace...</main>;
  }

  if (!sessionUser) {
    return (
      <I18nProvider language={state.settings.language}>
        <AuthLanding busy={authBusy} error={authError} onLogin={handleLogin} onRegister={handleRegister} />
      </I18nProvider>
    );
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

        {error && <p className="error-banner">{error}</p>}

        <section className="app-content">
          {activeTab === "home" && (
            <>
              {!hasActiveTrip && (
                <GlassCard title="Aucun voyage actif">
                  <p>
                    Vous n'avez pas encore de voyage configure. Lancez le wizard pour creer votre premier trip.
                  </p>
                  <div className="sheet-actions">
                    <button className="primary-button" type="button" onClick={() => setWizardOpen(true)}>
                      Creer un voyage
                    </button>
                  </div>
                </GlassCard>
              )}

              {hasActiveTrip && (
                <>
                  <GlassCard title="Voyage actif" subtitle={state.trip.description || "Pret a tracker votre budget"}>
                    <div className="sheet-actions">
                      <span className="field-hint">{state.trip.title}</span>
                      <span className="field-hint">
                        {state.trip.startDate} → {state.trip.endDate}
                      </span>
                    </div>
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
            </>
          )}

          {activeTab === "stats" && (
            <GlassCard>
              {selectedCountryPlan ? (
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
              ) : (
                <p>Activez ou creez un voyage pour afficher les statistiques.</p>
              )}
            </GlassCard>
          )}

          {activeTab === "forecast" && (
            <GlassCard>
              {selectedCountry ? (
                <ForecastView
                  locale={locale}
                  activeCountryCode={selectedCountry}
                  forecasts={state.forecasts}
                  onAddForecast={addForecast}
                />
              ) : (
                <p>Ajoutez un voyage pour acceder aux previsions par pays.</p>
              )}
            </GlassCard>
          )}

          {activeTab === "rewind" && (
            <GlassCard>
              {hasActiveTrip ? (
                <RewindView
                  locale={locale}
                  expenses={state.expenses}
                  reliability={rewindReliability}
                />
              ) : (
                <p>Le mode rewind sera disponible des que vous aurez un voyage actif.</p>
              )}
            </GlassCard>
          )}

          {activeTab === "trips" && (
            <GlassCard>
              <TripsView
                trips={state.trips}
                activeTripId={state.activeTripId}
                onSwitchTrip={(tripId) => {
                  switchTrip(tripId);
                }}
                onCreateTrip={() => setWizardOpen(true)}
              />
            </GlassCard>
          )}
        </section>

        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        <footer className="summary-footer">
          <span>
            Global remaining: {globalRemainingBudgetEuro(state).toFixed(2)} EUR
          </span>
          <span>
            Country expenses: {getCountryExpenses(state, selectedCountry).length}
          </span>
          <span>User: {state.user.id}</span>
          <span>Trips: {state.trips.length}</span>
          <span>Travelers: {state.travelers.length}</span>
          {state.lastSyncAt && <span>Synced: {new Date(state.lastSyncAt).toLocaleString(locale)}</span>}
        </footer>

        {showCreateTourPrompt && (
          <dialog className="onboarding-prompt" open aria-label="Creation du premier voyage">
            <h3>Creez votre Tour !</h3>
            <p>Votre espace est vide. Lancez le wizard pour construire votre itineraire et vos budgets.</p>
            <div className="sheet-actions">
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setShowCreateTourPrompt(false);
                  setWizardOpen(true);
                }}
              >
                Let's Go
              </button>
            </div>
          </dialog>
        )}

        <SetupWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onComplete={handleCompleteWizard}
        />

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
