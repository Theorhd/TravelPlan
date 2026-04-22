import { useEffect, useMemo, useState } from "react";
import type { CountryBudgetPlan, ExpenseCategory, SetupTripInput } from "../../models/domain";

type WizardStep = 1 | 2 | 3;

type CountryDraft = {
  countryName: string;
  countryCode: string;
  city: string;
  district: string;
  currency: string;
  startDate: string;
  endDate: string;
  categoryBudgets: Record<ExpenseCategory, number>;
};

type CountrySheetDraft = {
  countryName: string;
  countryCode: string;
  city: string;
  district: string;
  currency: string;
  startDate: string;
  endDate: string;
};

const CATEGORIES: ExpenseCategory[] = [
  "lodging",
  "food",
  "transport",
  "flights",
  "activities",
  "other",
];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  lodging: "Logement",
  food: "Nourriture",
  transport: "Transport",
  flights: "Vols",
  activities: "Activites",
  other: "Autres",
};

const CATEGORY_WEIGHTS: Record<ExpenseCategory, number> = {
  lodging: 0.32,
  food: 0.23,
  transport: 0.14,
  flights: 0.15,
  activities: 0.1,
  other: 0.06,
};

function createDefaultCategoryBudgets(total: number): Record<ExpenseCategory, number> {
  const safeTotal = Math.max(total, 1);

  return {
    lodging: Number((safeTotal * CATEGORY_WEIGHTS.lodging).toFixed(2)),
    food: Number((safeTotal * CATEGORY_WEIGHTS.food).toFixed(2)),
    transport: Number((safeTotal * CATEGORY_WEIGHTS.transport).toFixed(2)),
    flights: Number((safeTotal * CATEGORY_WEIGHTS.flights).toFixed(2)),
    activities: Number((safeTotal * CATEGORY_WEIGHTS.activities).toFixed(2)),
    other: Number((safeTotal * CATEGORY_WEIGHTS.other).toFixed(2)),
  };
}

function getCountryBudgetTotal(categoryBudgets: Record<ExpenseCategory, number>): number {
  return CATEGORIES.reduce((sum, category) => sum + categoryBudgets[category], 0);
}

function normalizeCountryCode(countryName: string, currentCode: string): string {
  const fromInput = currentCode.trim().slice(0, 2).toUpperCase();
  if (fromInput.length === 2) {
    return fromInput;
  }

  const compactName = countryName.replaceAll(/[^A-Za-z]/g, "").toUpperCase();
  if (compactName.length >= 2) {
    return compactName.slice(0, 2);
  }

  return "ZZ";
}

function toCountryPlan(country: CountryDraft): CountryBudgetPlan {
  const budgetTotal = Number(getCountryBudgetTotal(country.categoryBudgets).toFixed(2));

  return {
    countryCode: normalizeCountryCode(country.countryName, country.countryCode),
    countryName: country.countryName.trim(),
    city: country.city.trim() || country.countryName.trim(),
    district: country.district.trim(),
    currency: (country.currency.trim() || "EUR").toUpperCase(),
    startDate: country.startDate,
    endDate: country.endDate,
    budgetTotal,
    categoryBudgets: country.categoryBudgets,
  };
}

function toCountryDraft(country: CountryBudgetPlan): CountryDraft {
  return {
    countryName: country.countryName,
    countryCode: country.countryCode,
    city: country.city,
    district: country.district ?? "",
    currency: country.currency,
    startDate: country.startDate,
    endDate: country.endDate,
    categoryBudgets: country.categoryBudgets,
  };
}

export function SetupWizard({
  open,
  onClose,
  onComplete,
  seed,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onComplete: (input: SetupTripInput) => void;
  seed?: Partial<SetupTripInput>;
}>) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState<WizardStep>(1);
  const [tripName, setTripName] = useState("");
  const [tripDescription, setTripDescription] = useState("");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [globalBudget, setGlobalBudget] = useState(0);
  const [countries, setCountries] = useState<CountryDraft[]>([]);

  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [countrySheetIndex, setCountrySheetIndex] = useState<number | null>(null);
  const [countrySheetDraft, setCountrySheetDraft] = useState<CountrySheetDraft>({
    countryName: "",
    countryCode: "",
    city: "",
    district: "",
    currency: "EUR",
    startDate: today,
    endDate: today,
  });

  const [budgetSheetIndex, setBudgetSheetIndex] = useState<number | null>(null);
  const [budgetSheetDraft, setBudgetSheetDraft] = useState<Record<ExpenseCategory, number>>(
    createDefaultCategoryBudgets(1000),
  );
  const [budgetSetupCompleted, setBudgetSetupCompleted] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const seedCountries = seed?.countries?.map(toCountryDraft) ?? [];

    setStep(1);
    setTripName(seed?.title ?? "");
    setTripDescription(seed?.description ?? "");
    setStartDate(seed?.startDate ?? today);
    setEndDate(seed?.endDate ?? today);
    setGlobalBudget(seed?.totalBudget ?? 0);
    setCountries(seedCountries);
    setCountrySheetOpen(false);
    setCountrySheetIndex(null);
    setBudgetSheetIndex(null);
    setBudgetSetupCompleted(false);
  }, [open, seed, today]);

  useEffect(() => {
    if (!open || step !== 3 || countries.length === 0 || budgetSetupCompleted || budgetSheetIndex !== null) {
      return;
    }

    setBudgetSheetIndex(0);
    setBudgetSheetDraft(countries[0].categoryBudgets);
  }, [budgetSetupCompleted, budgetSheetIndex, countries, open, step]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const totalAllocated = useMemo(
    () => countries.reduce((sum, country) => sum + getCountryBudgetTotal(country.categoryBudgets), 0),
    [countries],
  );

  const isStep1Valid =
    tripName.trim().length > 0 &&
    tripDescription.trim().length > 0 &&
    startDate.length > 0 &&
    endDate.length > 0 &&
    endDate >= startDate &&
    globalBudget > 0;

  const isStep2Valid =
    countries.length > 0 &&
    countries.every((country) => country.countryName.trim().length > 0 && country.endDate >= country.startDate);

  const isStep3Valid =
    countries.length > 0 &&
    countries.every((country) => getCountryBudgetTotal(country.categoryBudgets) > 0) &&
    budgetSetupCompleted;

  const currentBudgetCountry = budgetSheetIndex === null ? null : countries[budgetSheetIndex];
  const isSheetVisible = countrySheetOpen || Boolean(currentBudgetCountry);

  function openCountrySheet(index?: number) {
    if (typeof index === "number") {
      const country = countries[index];
      if (!country) {
        return;
      }

      setCountrySheetIndex(index);
      setCountrySheetDraft({
        countryName: country.countryName,
        countryCode: country.countryCode,
        city: country.city,
        district: country.district,
        currency: country.currency,
        startDate: country.startDate,
        endDate: country.endDate,
      });
      setCountrySheetOpen(true);
      return;
    }

    const nextStartDate = countries.at(-1)?.endDate ?? startDate;
    setCountrySheetIndex(null);
    setCountrySheetDraft({
      countryName: "",
      countryCode: "",
      city: "",
      district: "",
      currency: "EUR",
      startDate: nextStartDate,
      endDate: nextStartDate,
    });
    setCountrySheetOpen(true);
  }

  function saveCountrySheet() {
    if (!countrySheetDraft.countryName.trim()) {
      return;
    }

    const additionalCountryCount = countrySheetIndex === null ? 1 : 0;
    const suggestedBudget = globalBudget > 0
      ? globalBudget / Math.max(countries.length + additionalCountryCount, 1)
      : 1000;

    const nextCountry: CountryDraft = {
      countryName: countrySheetDraft.countryName.trim(),
      countryCode: normalizeCountryCode(countrySheetDraft.countryName, countrySheetDraft.countryCode),
      city: countrySheetDraft.city.trim(),
      district: countrySheetDraft.district.trim(),
      currency: (countrySheetDraft.currency.trim() || "EUR").toUpperCase(),
      startDate: countrySheetDraft.startDate,
      endDate: countrySheetDraft.endDate,
      categoryBudgets: createDefaultCategoryBudgets(suggestedBudget),
    };

    setCountries((prev) => {
      if (countrySheetIndex === null) {
        return [...prev, nextCountry];
      }

      return prev.map((country, index) => {
        if (index !== countrySheetIndex) {
          return country;
        }

        return {
          ...country,
          ...nextCountry,
          categoryBudgets: country.categoryBudgets,
        };
      });
    });

    setCountrySheetOpen(false);
  }

  function removeCountry(index: number) {
    setCountries((prev) => prev.filter((_, countryIndex) => countryIndex !== index));
  }

  function saveBudgetSheet() {
    if (budgetSheetIndex === null) {
      return;
    }

    const nextBudgets = CATEGORIES.reduce<Record<ExpenseCategory, number>>((accumulator, category) => {
      accumulator[category] = Math.max(0, Number(budgetSheetDraft[category]) || 0);
      return accumulator;
    }, {} as Record<ExpenseCategory, number>);

    setCountries((prev) =>
      prev.map((country, index) => {
        if (index !== budgetSheetIndex) {
          return country;
        }

        return {
          ...country,
          categoryBudgets: nextBudgets,
        };
      }),
    );

    const nextIndex = budgetSheetIndex + 1;
    if (nextIndex < countries.length) {
      const nextCountry = countries[nextIndex];
      setBudgetSheetIndex(nextIndex);
      setBudgetSheetDraft(nextCountry.categoryBudgets);
      return;
    }

    setBudgetSheetIndex(null);
    setBudgetSetupCompleted(true);
  }

  function finalizeWizard() {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      return;
    }

    const countryPlans = countries.map(toCountryPlan);

    onComplete({
      title: tripName.trim(),
      description: tripDescription.trim(),
      startDate,
      endDate,
      totalBudget: globalBudget,
      countries: countryPlans,
    });
    onClose();
  }

  if (!open) {
    return null;
  }

  return (
    <div className="wizard-overlay">
      <dialog className={`wizard-dialog ${isSheetVisible ? "sheet-open" : ""}`.trim()} open aria-label="Wizard de creation de voyage">
        <header className="wizard-header">
          <div>
            <p className="wizard-kicker">Creation de voyage</p>
            <h2>Wizard en 3 etapes</h2>
          </div>
          <button className="ghost-button" type="button" onClick={onClose}>
            Fermer
          </button>
        </header>

        <div className="wizard-progress">
          {[1, 2, 3].map((item) => (
            <span key={item} className={`wizard-progress-dot ${step >= item ? "active" : ""}`.trim()}>
              {item}
            </span>
          ))}
        </div>

        <div className="wizard-slider-window">
          <div className="wizard-slider-track" style={{ transform: `translateX(-${(step - 1) * (100 / 3)}%)` }}>
            <section className="wizard-step-panel">
              <h3>Etape 1 - Informations globales</h3>
              <p className="field-hint">Nom, description, dates et budget global du voyage.</p>

              <div className="form-grid">
                <label>
                  <span>Nom du voyage</span>
                  <input value={tripName} onChange={(event) => setTripName(event.target.value)} />
                </label>
                <label>
                  <span>Description</span>
                  <textarea value={tripDescription} rows={3} onChange={(event) => setTripDescription(event.target.value)} />
                </label>
                <label>
                  <span>Date debut</span>
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                </label>
                <label>
                  <span>Date fin</span>
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                </label>
                <label>
                  <span>Budget global disponible</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={globalBudget}
                    onChange={(event) => setGlobalBudget(Number(event.target.value))}
                  />
                </label>
              </div>

              <div className="sheet-actions wizard-actions">
                <button className="primary-button" type="button" disabled={!isStep1Valid} onClick={() => setStep(2)}>
                  Valider et continuer
                </button>
              </div>
            </section>

            <section className="wizard-step-panel">
              <div className="wizard-step-header">
                <div>
                  <h3>Etape 2 - Itineraire</h3>
                  <p className="field-hint">Ajoutez les pays traverses avec leurs dates de sejour.</p>
                </div>
                <button className="primary-button wizard-plus" type="button" onClick={() => openCountrySheet()}>
                  +
                </button>
              </div>

              {countries.length === 0 && (
                <article className="wizard-empty-state">
                  <p>Aucun pays ajoute pour le moment.</p>
                  <button className="ghost-button" type="button" onClick={() => openCountrySheet()}>
                    Ajouter un pays
                  </button>
                </article>
              )}

              <div className="country-planner">
                {countries.map((country, index) => (
                  <article key={`${country.countryCode}-${country.startDate}-${index}`} className="country-draft">
                    <div className="country-draft-header">
                      <h4>{country.countryName}</h4>
                      <p className="field-hint">
                        {country.startDate} → {country.endDate}
                      </p>
                    </div>
                    <div className="sheet-actions">
                      <button className="ghost-button" type="button" onClick={() => openCountrySheet(index)}>
                        Editer
                      </button>
                      <button className="ghost-button" type="button" onClick={() => removeCountry(index)}>
                        Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <div className="sheet-actions wizard-actions">
                <button className="ghost-button" type="button" onClick={() => setStep(1)}>
                  Retour
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!isStep2Valid}
                  onClick={() => {
                    setBudgetSetupCompleted(false);
                    setBudgetSheetIndex(0);
                    setBudgetSheetDraft(countries[0]?.categoryBudgets ?? createDefaultCategoryBudgets(1000));
                    setStep(3);
                  }}
                >
                  Valider l'itineraire
                </button>
              </div>
            </section>

            <section className="wizard-step-panel">
              <h3>Etape 3 - Ventilation budgetaire</h3>
              <p className="field-hint">
                Une bottom sheet s'ouvre successivement pour chaque pays afin de renseigner le detail des categories.
              </p>

              <div className="wizard-budget-list">
                {countries.map((country, index) => {
                  const countryBudget = getCountryBudgetTotal(country.categoryBudgets);
                  return (
                    <article key={`${country.countryCode}-budget-${index}`} className="country-draft">
                      <h4>{country.countryName}</h4>
                      <p className="field-hint">Budget configure: {countryBudget.toFixed(2)} EUR</p>
                    </article>
                  );
                })}
              </div>

              <p className="field-hint">
                Total alloue: {totalAllocated.toFixed(2)} EUR / Budget global: {globalBudget.toFixed(2)} EUR
              </p>

              {!budgetSetupCompleted && (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setBudgetSheetIndex(0);
                    setBudgetSheetDraft(countries[0]?.categoryBudgets ?? createDefaultCategoryBudgets(1000));
                  }}
                >
                  Relancer la configuration des budgets
                </button>
              )}

              <div className="sheet-actions wizard-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => {
                    setStep(2);
                    setBudgetSheetIndex(null);
                    setBudgetSetupCompleted(false);
                  }}
                >
                  Retour
                </button>
                <button className="primary-button" type="button" disabled={!isStep3Valid} onClick={finalizeWizard}>
                  Finaliser le voyage
                </button>
              </div>
            </section>
          </div>
        </div>
      </dialog>

      {countrySheetOpen && (
        <div className="sheet-overlay">
          <dialog className="bottom-sheet" open aria-label="Ajouter un pays">
            <header className="bottom-sheet-header">
              <h3>{countrySheetIndex === null ? "Ajouter un pays" : "Modifier le pays"}</h3>
            </header>

            <div className="form-grid">
              <label>
                <span>Pays</span>
                <input
                  value={countrySheetDraft.countryName}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      countryName: event.target.value,
                    }))
                  }
                  placeholder="Japon"
                />
              </label>
              <label>
                <span>Code (optionnel)</span>
                <input
                  value={countrySheetDraft.countryCode}
                  maxLength={2}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      countryCode: event.target.value,
                    }))
                  }
                  placeholder="JP"
                />
              </label>
              <label>
                <span>Ville (optionnel)</span>
                <input
                  value={countrySheetDraft.city}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                  placeholder="Tokyo"
                />
              </label>
              <label>
                <span>Devise</span>
                <input
                  value={countrySheetDraft.currency}
                  maxLength={3}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      currency: event.target.value,
                    }))
                  }
                  placeholder="JPY"
                />
              </label>
              <label>
                <span>Date debut de sejour</span>
                <input
                  type="date"
                  value={countrySheetDraft.startDate}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>Date fin de sejour</span>
                <input
                  type="date"
                  value={countrySheetDraft.endDate}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                <span>District (optionnel)</span>
                <input
                  value={countrySheetDraft.district}
                  onChange={(event) =>
                    setCountrySheetDraft((prev) => ({
                      ...prev,
                      district: event.target.value,
                    }))
                  }
                  placeholder="Shibuya"
                />
              </label>
            </div>

            <div className="sheet-actions">
              <button className="ghost-button" type="button" onClick={() => setCountrySheetOpen(false)}>
                Annuler
              </button>
              <button className="primary-button" type="button" onClick={saveCountrySheet}>
                Enregistrer
              </button>
            </div>
          </dialog>
        </div>
      )}

      {budgetSheetIndex !== null && currentBudgetCountry && (
        <div className="sheet-overlay">
          <dialog className="bottom-sheet" open aria-label="Configurer le budget du pays">
            <header className="bottom-sheet-header">
              <h3>Budget detaille - {currentBudgetCountry.countryName}</h3>
              <p className="field-hint">
                {budgetSheetIndex + 1} / {countries.length}
              </p>
            </header>

            <div className="form-grid">
              {CATEGORIES.map((category) => (
                <label key={category}>
                  <span>{CATEGORY_LABELS[category]}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={budgetSheetDraft[category]}
                    onChange={(event) =>
                      setBudgetSheetDraft((prev) => ({
                        ...prev,
                        [category]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <p className="field-hint">Total pays: {getCountryBudgetTotal(budgetSheetDraft).toFixed(2)} EUR</p>

            <div className="sheet-actions">
              <button className="ghost-button" type="button" onClick={() => setBudgetSheetIndex(null)}>
                Plus tard
              </button>
              <button className="primary-button" type="button" onClick={saveBudgetSheet}>
                {budgetSheetIndex < countries.length - 1 ? "Valider et suivant" : "Valider le dernier pays"}
              </button>
            </div>
          </dialog>
        </div>
      )}
    </div>
  );
}
