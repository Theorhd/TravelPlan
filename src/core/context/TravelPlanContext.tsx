import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type {
  AddExpenseInput,
  AddForecastInput,
  BorderAdjustmentMode,
  GeoContext,
  SetupTripInput,
  TravelPlanState,
} from "../../models/domain";
import { createStorageGateway } from "../../data/db/createStorageGateway";
import { BrowserGeoLocationProvider } from "../../services/geolocation/BrowserGeoLocationProvider";
import { DiscordSyncProvider } from "../../services/sync/DiscordSyncProvider";
import { toEuro } from "../../utils/currency";
import { addDays, nowIsoTimestamp, toIsoDate } from "../../utils/dates";
import { createEntityId, ensureUserIdFormat, generateUserId, isValidUserId } from "../../utils/ids";
import { remainingCountryBudgetEuro } from "../selectors/travelSelectors";

type TravelPlanContextValue = {
  state: TravelPlanState;
  ready: boolean;
  error: string | null;
  updateUserId: (value: string) => void;
  configureTrip: (input: SetupTripInput) => void;
  addTraveler: (travelerId: string) => void;
  addExpense: (input: AddExpenseInput) => Promise<void>;
  addForecast: (input: AddForecastInput) => void;
  refreshLocation: () => Promise<void>;
  applyBorderTransition: (extraDays: number, mode: BorderAdjustmentMode) => void;
  dismissBorderTransition: () => void;
  updateSettings: (patch: Partial<TravelPlanState["settings"]>) => void;
  syncNow: () => Promise<void>;
};

const TravelPlanContext = createContext<TravelPlanContextValue | null>(null);

function createInitialState(): TravelPlanState {
  const today = toIsoDate(new Date());
  const franceEnd = addDays(today, 9);
  const thailandStart = addDays(franceEnd, 1);
  const thailandEnd = addDays(thailandStart, 18);

  const userId = generateUserId("traveler");

  return {
    version: 1,
    user: {
      id: userId,
      displayName: "Theo",
      createdAt: nowIsoTimestamp(),
    },
    travelers: [
      {
        id: userId,
        displayName: "Theo",
      },
    ],
    trip: {
      id: createEntityId("trip"),
      title: "World Loop 2026",
      startDate: today,
      endDate: thailandEnd,
      totalBudget: 12_000,
      countries: [
        {
          countryCode: "FR",
          countryName: "France",
          currency: "EUR",
          city: "Paris",
          district: "11e",
          startDate: today,
          endDate: franceEnd,
          budgetTotal: 2_100,
          categoryBudgets: {
            lodging: 900,
            food: 420,
            transport: 250,
            flights: 120,
            activities: 250,
            other: 160,
          },
        },
        {
          countryCode: "TH",
          countryName: "Thailand",
          currency: "THB",
          city: "Bangkok",
          district: "Sukhumvit",
          startDate: thailandStart,
          endDate: thailandEnd,
          budgetTotal: 3_900,
          categoryBudgets: {
            lodging: 1_400,
            food: 850,
            transport: 450,
            flights: 500,
            activities: 500,
            other: 200,
          },
        },
      ],
    },
    expenses: [],
    forecasts: [],
    settings: {
      language: "fr-FR",
      autoSyncEnabled: false,
      discordWebhookUrl: "",
      llm: {
        provider: "none",
        apiKey: "",
        model: "",
      },
    },
    geo: {
      countryCode: "FR",
      countryName: "France",
      city: "Paris",
      district: "11e",
      currency: "EUR",
      updatedAt: nowIsoTimestamp(),
    },
    activeCountryCode: "FR",
    pendingBorderTransition: null,
  };
}

function shiftCountryDates(state: TravelPlanState, fromIndex: number, offsetDays: number): TravelPlanState {
  if (offsetDays === 0) {
    return state;
  }

  const countries = state.trip.countries.map((country, index) => {
    if (index <= fromIndex) {
      return country;
    }

    return {
      ...country,
      startDate: addDays(country.startDate, offsetDays),
      endDate: addDays(country.endDate, offsetDays),
    };
  });

  return {
    ...state,
    trip: {
      ...state.trip,
      countries,
      endDate: addDays(state.trip.endDate, offsetDays),
    },
  };
}

export function TravelPlanProvider({ children }: Readonly<{ children: ReactNode }>) {
  const storage = useMemo(() => createStorageGateway(), []);
  const geoProvider = useMemo(() => new BrowserGeoLocationProvider(), []);

  const [state, setState] = useState<TravelPlanState>(createInitialState());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        await storage.initialize();
        const loadedState = await storage.loadState();
        if (!mounted) {
          return;
        }

        if (loadedState) {
          setState(loadedState);
        }

        setReady(true);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err instanceof Error ? err.message : "Unable to initialize storage");
        setReady(true);
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [storage]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      return;
    }

    void storage.saveState(state);
  }, [ready, state, storage]);

  const updateUserId = useCallback((value: string) => {
    const sanitized = ensureUserIdFormat(value.startsWith("@") ? value.slice(1) : value);

    setState((prev) => {
      const previousId = prev.user.id;
      const nextTravelers = prev.travelers.map((traveler) =>
        traveler.id === previousId ? { ...traveler, id: sanitized } : traveler,
      );

      return {
        ...prev,
        user: {
          ...prev.user,
          id: sanitized,
        },
        travelers: nextTravelers,
      };
    });
  }, []);

  const configureTrip = useCallback((input: SetupTripInput) => {
    setState((prev) => ({
      ...prev,
      trip: {
        ...prev.trip,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        totalBudget: input.totalBudget,
        countries: input.countries,
      },
      activeCountryCode: input.countries[0]?.countryCode ?? prev.activeCountryCode,
    }));
  }, []);

  const addTraveler = useCallback((travelerId: string) => {
    const normalized = travelerId.trim();
    if (!isValidUserId(normalized)) {
      return;
    }

    setState((prev) => {
      if (prev.travelers.some((traveler) => traveler.id === normalized)) {
        return prev;
      }

      return {
        ...prev,
        travelers: [
          ...prev.travelers,
          {
            id: normalized,
            displayName: normalized.replace("@", ""),
          },
        ],
      };
    });
  }, []);

  const addExpense = useCallback(
    async (input: AddExpenseInput) => {
      const amountInEuro = toEuro(input.amount, input.currency);

      setState((prev) => {
        const countryCode = input.countryCode ?? prev.geo.countryCode;
        const countryName = input.countryName ?? prev.geo.countryName;
        const city = input.city ?? prev.geo.city;
        const district = input.district ?? prev.geo.district;

        return {
          ...prev,
          expenses: [
            {
              id: createEntityId("expense"),
              amount: input.amount,
              currency: input.currency,
              amountInEuro,
              category: input.category,
              reason: input.reason,
              description: input.description,
              merchant: input.merchant,
              products: input.products,
              countryCode,
              countryName,
              city,
              district,
              source: input.source,
              travelerIds: input.travelerIds,
              photoDataUrl: input.photoDataUrl,
              createdAt: nowIsoTimestamp(),
            },
            ...prev.expenses,
          ],
        };
      });

      if (state.settings.autoSyncEnabled && state.settings.discordWebhookUrl) {
        await new DiscordSyncProvider(state.settings.discordWebhookUrl).sync(state);
      }
    },
    [state],
  );

  const addForecast = useCallback((input: AddForecastInput) => {
    setState((prev) => ({
      ...prev,
      forecasts: [
        {
          id: createEntityId("forecast"),
          amount: input.amount,
          currency: input.currency,
          amountInEuro: toEuro(input.amount, input.currency),
          category: input.category,
          label: input.label,
          countryCode: input.countryCode,
          scheduledDate: input.scheduledDate,
          isBooked: input.isBooked,
        },
        ...prev.forecasts,
      ],
    }));
  }, []);

  const detectBorderTransition = useCallback((geo: GeoContext) => {
    setState((prev) => {
      if (geo.countryCode === prev.activeCountryCode) {
        return {
          ...prev,
          geo,
        };
      }

      const fromCountry = prev.trip.countries.find((country) => country.countryCode === prev.activeCountryCode);
      const toCountry = prev.trip.countries.find((country) => country.countryCode === geo.countryCode);

      if (!fromCountry || !toCountry) {
        return {
          ...prev,
          geo,
          activeCountryCode: geo.countryCode,
        };
      }

      const remaining = remainingCountryBudgetEuro(prev, prev.activeCountryCode);

      return {
        ...prev,
        geo,
        pendingBorderTransition: {
          fromCountryCode: fromCountry.countryCode,
          fromCountryName: fromCountry.countryName,
          toCountryCode: toCountry.countryCode,
          toCountryName: toCountry.countryName,
          detectedAt: nowIsoTimestamp(),
          remainingBudgetInFromCountry: Math.max(0, remaining),
          overSpendInFromCountry: Math.max(0, remaining * -1),
        },
      };
    });
  }, []);

  const refreshLocation = useCallback(async () => {
    try {
      const geo = await geoProvider.resolveCurrentLocation();
      detectBorderTransition(geo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resolve location");
    }
  }, [detectBorderTransition, geoProvider]);

  const applyBorderTransition = useCallback((extraDays: number, mode: BorderAdjustmentMode) => {
    setState((prev) => {
      if (!prev.pendingBorderTransition) {
        return prev;
      }

      const { fromCountryCode, toCountryCode } = prev.pendingBorderTransition;
      const fromIndex = prev.trip.countries.findIndex((country) => country.countryCode === fromCountryCode);
      const toIndex = prev.trip.countries.findIndex((country) => country.countryCode === toCountryCode);

      if (fromIndex < 0 || toIndex < 0) {
        return {
          ...prev,
          pendingBorderTransition: null,
          activeCountryCode: toCountryCode,
        };
      }

      let nextState: TravelPlanState = {
        ...prev,
        trip: {
          ...prev.trip,
          countries: prev.trip.countries.map((country, index) => {
            if (index === fromIndex) {
              return {
                ...country,
                endDate: addDays(country.endDate, extraDays),
              };
            }

            return country;
          }),
        },
      };

      if (mode === "extend-trip") {
        nextState = shiftCountryDates(nextState, fromIndex, extraDays);
      }

      if (mode === "compress-next-country") {
        nextState = {
          ...nextState,
          trip: {
            ...nextState.trip,
            countries: nextState.trip.countries.map((country, index) => {
              if (index === toIndex) {
                return {
                  ...country,
                  startDate: addDays(country.startDate, extraDays),
                };
              }

              return country;
            }),
          },
        };
      }

      return {
        ...nextState,
        activeCountryCode: toCountryCode,
        pendingBorderTransition: null,
      };
    });
  }, []);

  const dismissBorderTransition = useCallback(() => {
    setState((prev) => {
      if (!prev.pendingBorderTransition) {
        return prev;
      }

      return {
        ...prev,
        activeCountryCode: prev.pendingBorderTransition.toCountryCode,
        pendingBorderTransition: null,
      };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<TravelPlanState["settings"]>) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...patch,
        llm: patch.llm ? { ...prev.settings.llm, ...patch.llm } : prev.settings.llm,
      },
    }));
  }, []);

  const syncNow = useCallback(async () => {
    if (!state.settings.discordWebhookUrl) {
      setError("Discord webhook URL is required for sync");
      return;
    }

    try {
      const result = await new DiscordSyncProvider(state.settings.discordWebhookUrl).sync(state);
      setState((prev) => ({
        ...prev,
        lastSyncAt: result.syncedAt,
      }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    }
  }, [state]);

  const value = useMemo<TravelPlanContextValue>(
    () => ({
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
    }),
    [
      addExpense,
      addForecast,
      addTraveler,
      applyBorderTransition,
      configureTrip,
      dismissBorderTransition,
      error,
      ready,
      refreshLocation,
      state,
      syncNow,
      updateSettings,
      updateUserId,
    ],
  );

  return <TravelPlanContext.Provider value={value}>{children}</TravelPlanContext.Provider>;
}

export function useTravelPlan(): TravelPlanContextValue {
  const context = useContext(TravelPlanContext);
  if (!context) {
    throw new Error("useTravelPlan must be used inside TravelPlanProvider");
  }

  return context;
}
