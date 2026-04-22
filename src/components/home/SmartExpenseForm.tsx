import { useEffect, useMemo, useState } from "react";
import type {
  AddExpenseInput,
  ExpenseCategory,
  GeoContext,
  TicketScanResult,
  Traveler,
} from "../../models/domain";
import { normalizeCurrency } from "../../utils/currency";
import { useI18n } from "../../i18n";

type TicketScanPatch = {
  ticket: TicketScanResult;
  correctedAmount: number;
  correctedCurrency: string;
  autoSubmit: boolean;
};

const CATEGORIES: ExpenseCategory[] = [
  "lodging",
  "food",
  "transport",
  "flights",
  "activities",
  "other",
];

export function SmartExpenseForm({
  quickAmount,
  quickCurrency,
  location,
  travelers,
  onSubmit,
  onTicketScan,
}: Readonly<{
  quickAmount: number;
  quickCurrency: string;
  location: GeoContext;
  travelers: Traveler[];
  onSubmit: (input: AddExpenseInput) => Promise<void>;
  onTicketScan: (hint: string, quickAmount: number, quickCurrency: string) => Promise<TicketScanPatch>;
}>) {
  const { t } = useI18n();

  const [amount, setAmount] = useState(quickAmount);
  const [currency, setCurrency] = useState(quickCurrency);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [ticketHint, setTicketHint] = useState("");
  const [ticketResult, setTicketResult] = useState<TicketScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedTraveler, setSelectedTraveler] = useState<string>(travelers[0]?.id ?? "");

  useEffect(() => {
    setAmount(quickAmount);
  }, [quickAmount]);

  useEffect(() => {
    setCurrency(quickCurrency);
  }, [quickCurrency]);

  useEffect(() => {
    if (!travelers.some((traveler) => traveler.id === selectedTraveler)) {
      setSelectedTraveler(travelers[0]?.id ?? "");
    }
  }, [selectedTraveler, travelers]);

  const productsHint = useMemo(() => ticketResult?.products.join(", ") ?? "", [ticketResult]);

  async function handleSubmit(source: AddExpenseInput["source"]) {
    if (amount <= 0) {
      return;
    }

    setBusy(true);
    await onSubmit({
      amount,
      currency: normalizeCurrency(currency),
      category,
      reason: reason || "Expense",
      description: description || productsHint || "-",
      source,
      countryCode: location.countryCode,
      countryName: location.countryName,
      city: location.city,
      district: location.district,
      travelerIds: selectedTraveler ? [selectedTraveler] : [],
      merchant: ticketResult?.merchant,
      products: ticketResult?.products,
      photoDataUrl: photoDataUrl || undefined,
    });

    setReason("");
    setDescription("");
    setPhotoDataUrl("");
    setTicketHint("");
    setTicketResult(null);
    setBusy(false);
  }

  async function handleTicketScan() {
    setBusy(true);
    try {
      const patch = await onTicketScan(ticketHint || photoDataUrl, amount, normalizeCurrency(currency));
      setAmount(patch.correctedAmount);
      setCurrency(patch.correctedCurrency);
      setTicketResult(patch.ticket);

      if (!reason && patch.ticket.merchant) {
        setReason(patch.ticket.merchant);
      }

      if (!description && patch.ticket.products.length > 0) {
        setDescription(patch.ticket.products.join(", "));
      }

      if (patch.autoSubmit) {
        await handleSubmit("ocr");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="smart-form">
      <h3>Smart Form</h3>
      <p className="field-hint">
        {location.countryName} · {location.city} · {location.district}
      </p>

      <div className="form-grid">
        <label>
          {t("home.amount")}
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        </label>
        <label>
          {t("home.currency")}
          <input type="text" value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value)} />
        </label>
        <label>
          {t("home.category")}
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          @{"ID"}
          <select value={selectedTraveler} onChange={(e) => setSelectedTraveler(e.target.value)}>
            {travelers.map((traveler) => (
              <option key={traveler.id} value={traveler.id}>
                {traveler.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label>
        {t("home.reason")}
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Hostel / Taxi / Restaurant" />
      </label>

      <label>
        {t("home.description")}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

      <label>
        {t("home.photo")}
        <input
          value={photoDataUrl}
          onChange={(e) => setPhotoDataUrl(e.target.value)}
          placeholder="data:image/... or image URL"
        />
      </label>

      <div className="ticket-scan-block">
        <h4>{t("home.ticketScan")}</h4>
        <p className="field-hint">{t("home.ticketScanHint")}</p>
        <input
          value={ticketHint}
          onChange={(e) => setTicketHint(e.target.value)}
          placeholder="TOTAL 14.90 EUR / Merchant text"
        />
        <button className="ghost-button" type="button" onClick={handleTicketScan} disabled={busy}>
          {t("home.ticketScan")}
        </button>
        {ticketResult && (
          <p className="field-hint">
            {ticketResult.merchant ?? "-"} · {ticketResult.products.join(", ")} · confidence {Math.round(ticketResult.confidence * 100)}%
          </p>
        )}
      </div>

      <button className="primary-button" type="button" onClick={() => void handleSubmit(ticketResult ? "ocr" : "manual")} disabled={busy}>
        {t("home.submit")}
      </button>
    </section>
  );
}
