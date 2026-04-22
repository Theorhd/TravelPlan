import { useMemo, useState } from "react";
import type { CountryBudgetPlan, ExpenseCategory, SetupTripInput, TripPlan } from "../../models/domain";
import { useI18n } from "../../i18n";

const CATEGORIES: ExpenseCategory[] = [
  "lodging",
  "food",
  "transport",
  "flights",
  "activities",
  "other",
];

type CountryDraft = {
  countryCode: string;
  countryName: string;
  city: string;
  district: string;
  currency: string;
  startDate: string;
  endDate: string;
  budgetTotal: number;
};

function draftFromCountry(country: CountryBudgetPlan): CountryDraft {
  return {
    countryCode: country.countryCode,
    countryName: country.countryName,
    city: country.city,
    district: country.district ?? "",
    currency: country.currency,
    startDate: country.startDate,
    endDate: country.endDate,
    budgetTotal: country.budgetTotal,
  };
}

function toCountryPlan(draft: CountryDraft): CountryBudgetPlan {
  const categoryShare = draft.budgetTotal / CATEGORIES.length;

  return {
    countryCode: draft.countryCode.toUpperCase(),
    countryName: draft.countryName,
    currency: draft.currency.toUpperCase(),
    city: draft.city,
    district: draft.district,
    startDate: draft.startDate,
    endDate: draft.endDate,
    budgetTotal: draft.budgetTotal,
    categoryBudgets: {
      lodging: Number((categoryShare * 1.6).toFixed(2)),
      food: Number((categoryShare * 1.2).toFixed(2)),
      transport: Number((categoryShare * 0.9).toFixed(2)),
      flights: Number((categoryShare * 0.8).toFixed(2)),
      activities: Number((categoryShare * 1).toFixed(2)),
      other: Number((categoryShare * 0.5).toFixed(2)),
    },
  };
}

export function SetupWizard({
  userId,
  trip,
  onUpdateUserId,
  onConfigureTrip,
  onAddTraveler,
}: Readonly<{
  userId: string;
  trip: TripPlan;
  onUpdateUserId: (id: string) => void;
  onConfigureTrip: (input: SetupTripInput) => void;
  onAddTraveler: (id: string) => void;
}>) {
  const { t } = useI18n();

  const [tripName, setTripName] = useState(trip.title);
  const [startDate, setStartDate] = useState(trip.startDate);
  const [endDate, setEndDate] = useState(trip.endDate);
  const [totalBudget, setTotalBudget] = useState(trip.totalBudget);
  const [travelerInput, setTravelerInput] = useState("");
  const [countries, setCountries] = useState<CountryDraft[]>(trip.countries.map(draftFromCountry));

  const totalCountryBudget = useMemo(
    () => countries.reduce((sum, country) => sum + country.budgetTotal, 0),
    [countries],
  );

  function addCountry() {
    const last = countries.at(-1);
    const nextStart = last?.endDate ?? startDate;
    setCountries((prev) => [
      ...prev,
      {
        countryCode: "US",
        countryName: "United States",
        city: "New York",
        district: "Manhattan",
        currency: "USD",
        startDate: nextStart,
        endDate: nextStart,
        budgetTotal: 1000,
      },
    ]);
  }

  function updateCountry(index: number, patch: Partial<CountryDraft>) {
    setCountries((prev) => prev.map((country, i) => (i === index ? { ...country, ...patch } : country)));
  }

  function saveSetup() {
    onConfigureTrip({
      title: tripName,
      startDate,
      endDate,
      totalBudget,
      countries: countries.map(toCountryPlan),
    });
  }

  return (
    <section className="setup-wizard">
      <h3>{t("setup.title")}</h3>

      <div className="form-grid">
        <label>
          <span>{t("setup.account")}</span>
          <input value={userId} onChange={(e) => onUpdateUserId(e.target.value)} />
        </label>

        <label>
          <span>{t("setup.tripName")}</span>
          <input value={tripName} onChange={(e) => setTripName(e.target.value)} />
        </label>

        <label>
          <span>{t("setup.startDate")}</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>

        <label>
          <span>{t("setup.endDate")}</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>

        <label>
          <span>{t("setup.totalBudget")}</span>
          <input type="number" step="0.01" value={totalBudget} onChange={(e) => setTotalBudget(Number(e.target.value))} />
        </label>

        <label>
          <span>{t("setup.addTraveler")}</span>
          <div className="inline-field">
            <input
              value={travelerInput}
              onChange={(e) => setTravelerInput(e.target.value)}
              placeholder="@travelerid"
            />
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                onAddTraveler(travelerInput);
                setTravelerInput("");
              }}
            >
              +
            </button>
          </div>
        </label>
      </div>

      <div className="country-planner">
        {countries.map((country, index) => (
          <article key={`${country.countryCode}-${index}`} className="country-draft">
            <h4>
              {country.countryName || `Country ${index + 1}`}
            </h4>
            <div className="form-grid">
              <label>
                <span>Code</span>
                <input
                  value={country.countryCode}
                  maxLength={2}
                  onChange={(e) => updateCountry(index, { countryCode: e.target.value })}
                />
              </label>
              <label>
                <span>Name</span>
                <input
                  value={country.countryName}
                  onChange={(e) => updateCountry(index, { countryName: e.target.value })}
                />
              </label>
              <label>
                <span>City</span>
                <input value={country.city} onChange={(e) => updateCountry(index, { city: e.target.value })} />
              </label>
              <label>
                <span>District</span>
                <input
                  value={country.district}
                  onChange={(e) => updateCountry(index, { district: e.target.value })}
                />
              </label>
              <label>
                <span>Currency</span>
                <input
                  value={country.currency}
                  maxLength={3}
                  onChange={(e) => updateCountry(index, { currency: e.target.value })}
                />
              </label>
              <label>
                <span>Budget</span>
                <input
                  type="number"
                  step="0.01"
                  value={country.budgetTotal}
                  onChange={(e) => updateCountry(index, { budgetTotal: Number(e.target.value) })}
                />
              </label>
              <label>
                <span>Start</span>
                <input
                  type="date"
                  value={country.startDate}
                  onChange={(e) => updateCountry(index, { startDate: e.target.value })}
                />
              </label>
              <label>
                <span>End</span>
                <input
                  type="date"
                  value={country.endDate}
                  onChange={(e) => updateCountry(index, { endDate: e.target.value })}
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <div className="sheet-actions">
        <button className="ghost-button" type="button" onClick={addCountry}>
          {t("setup.addCountry")}
        </button>
        <button className="primary-button" type="button" onClick={saveSetup}>
          {t("setup.finish")}
        </button>
      </div>

      <p className="field-hint">Planned countries budget total: {totalCountryBudget.toFixed(2)} EUR</p>
    </section>
  );
}
