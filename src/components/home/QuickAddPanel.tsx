import { useI18n } from "../../i18n";

export function QuickAddPanel({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  onOpenForm,
}: Readonly<{
  amount: number;
  currency: string;
  onAmountChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
  onOpenForm: () => void;
}>) {
  const { t } = useI18n();

  return (
    <section className="quick-add">
      <h3>{t("home.quickAdd")}</h3>
      <div className="quick-add-grid">
        <label>
          {t("home.amount")}
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(event) => onAmountChange(Number(event.target.value))}
          />
        </label>
        <label>
          {t("home.currency")}
          <input
            type="text"
            value={currency}
            maxLength={3}
            onChange={(event) => onCurrencyChange(event.target.value.toUpperCase())}
          />
        </label>
      </div>
      <button className="primary-button" type="button" onClick={onOpenForm}>
        {t("home.submit")}
      </button>
    </section>
  );
}
