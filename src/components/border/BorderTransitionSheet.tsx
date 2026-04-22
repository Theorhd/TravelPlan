import { useMemo, useState } from "react";
import type {
  BorderAdjustmentMode,
  BorderTransitionCandidate,
  TravelPlanState,
} from "../../models/domain";
import { useI18n } from "../../i18n";

export function BorderTransitionSheet({
  candidate,
  state,
  onOfficial,
  onConfirmWithDelay,
}: Readonly<{
  candidate: BorderTransitionCandidate | null;
  state: TravelPlanState;
  onOfficial: () => void;
  onConfirmWithDelay: (extraDays: number, mode: BorderAdjustmentMode) => void;
}>) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<1 | 2>(1);
  const [extraDays, setExtraDays] = useState(1);
  const [mode, setMode] = useState<BorderAdjustmentMode>("extend-trip");

  const preview = useMemo(() => {
    if (!candidate) {
      return null;
    }

    const nextTripEnd =
      mode === "extend-trip"
        ? new Date(new Date(state.trip.endDate).getTime() + extraDays * 86_400_000)
            .toISOString()
            .slice(0, 10)
        : state.trip.endDate;

    return {
      nextTripEnd,
      impactText:
        mode === "extend-trip"
          ? "Future country dates are shifted to keep your planned pace per country."
          : "The next country loses days but your global trip end date stays unchanged.",
    };
  }, [candidate, extraDays, mode, state.trip.endDate]);

  if (!candidate) {
    return null;
  }

  return (
    <dialog className="border-sheet" open aria-label="Border transition">
      <h3>{t("border.title")}</h3>

      {phase === 1 && (
        <div>
          <p>{t("border.phase1")}</p>
          <p>
            {candidate.fromCountryName} → {candidate.toCountryName}
          </p>
          <p>Remaining: {candidate.remainingBudgetInFromCountry.toFixed(2)} EUR</p>
          <p>Deficit: {candidate.overSpendInFromCountry.toFixed(2)} EUR</p>

          <div className="sheet-actions">
            <button className="primary-button" type="button" onClick={onOfficial}>
              {t("border.official")}
            </button>
            <button className="ghost-button" type="button" onClick={() => setPhase(2)}>
              {t("border.takeTime")}
            </button>
          </div>
        </div>
      )}

      {phase === 2 && (
        <div>
          <label>
            {t("border.extraDays")}
            <input
              type="number"
              min={1}
              value={extraDays}
              onChange={(event) => setExtraDays(Math.max(1, Number(event.target.value) || 1))}
            />
          </label>

          <div className="mode-choices">
            <label>
              <input
                type="radio"
                checked={mode === "extend-trip"}
                onChange={() => setMode("extend-trip")}
              />
              {t("border.extend")}
            </label>
            <label>
              <input
                type="radio"
                checked={mode === "compress-next-country"}
                onChange={() => setMode("compress-next-country")}
              />
              {t("border.compress")}
            </label>
          </div>

          {preview && (
            <p className="field-hint">
              Trip end preview: {preview.nextTripEnd}. {preview.impactText}
            </p>
          )}

          <button className="primary-button" type="button" onClick={() => onConfirmWithDelay(extraDays, mode)}>
            {t("border.confirm")}
          </button>
        </div>
      )}
    </dialog>
  );
}
