import { useState } from "react";
import type { TravelPlanState } from "../../models/domain";
import { useI18n } from "../../i18n";

type SettingsPatch = Partial<TravelPlanState["settings"]>;

export function SettingsPanel({
  open,
  settings,
  onClose,
  onSave,
  onSync,
}: Readonly<{
  open: boolean;
  settings: TravelPlanState["settings"];
  onClose: () => void;
  onSave: (patch: SettingsPatch) => void;
  onSync: () => Promise<void>;
}>) {
  const { t } = useI18n();

  const [language, setLanguage] = useState(settings.language);
  const [webhook, setWebhook] = useState(settings.discordWebhookUrl);
  const [provider, setProvider] = useState(settings.llm.provider);
  const [apiKey, setApiKey] = useState(settings.llm.apiKey);
  const [model, setModel] = useState(settings.llm.model);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(settings.autoSyncEnabled);

  if (!open) {
    return null;
  }

  return (
    <dialog className="settings-panel" open aria-label="Settings">
      <h3>{t("settings.title")}</h3>

      <label>
        {t("settings.language")}
        <select value={language} onChange={(e) => setLanguage(e.target.value as TravelPlanState["settings"]["language"])}>
          <option value="fr-FR">Français</option>
          <option value="en-US">English</option>
        </select>
      </label>

      <label>
        {t("settings.discord")}
        <input value={webhook} onChange={(e) => setWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/..." />
      </label>

      <label>
        <span>Auto sync</span>
        <select value={autoSyncEnabled ? "on" : "off"} onChange={(e) => setAutoSyncEnabled(e.target.value === "on")}>
          <option value="off">Off</option>
          <option value="on">On</option>
        </select>
      </label>

      <label>
        {t("settings.llmProvider")}
        <select value={provider} onChange={(e) => setProvider(e.target.value as TravelPlanState["settings"]["llm"]["provider"])}>
          <option value="none">None</option>
          <option value="openai">OpenAI</option>
          <option value="mistral">Mistral</option>
          <option value="claude">Claude</option>
        </select>
      </label>

      <label>
        {t("settings.llmKey")}
        <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
      </label>

      <label>
        {t("settings.llmModel")}
        <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini / mistral-small / claude..." />
      </label>

      <div className="sheet-actions">
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            onSave({
              language,
              autoSyncEnabled,
              discordWebhookUrl: webhook,
              llm: {
                provider,
                apiKey,
                model,
              },
            });
            onClose();
          }}
        >
          {t("settings.save")}
        </button>
        <button className="ghost-button" type="button" onClick={() => void onSync()}>
          Sync now
        </button>
        <button className="ghost-button" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </dialog>
  );
}
