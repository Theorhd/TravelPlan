import { useMemo, useState } from "react";
import type { AiPlannerResponse } from "../../models/domain";
import { useI18n } from "../../i18n";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

function messageId(): string {
  return Math.random().toString(36).slice(2);
}

export function AiPlannerFab({
  locationHeader,
  onAsk,
}: Readonly<{
  locationHeader: string;
  onAsk: (prompt: string) => Promise<AiPlannerResponse>;
}>) {
  const { t } = useI18n();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const activityCards = useMemo(() => {
    const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
    return lastAssistant?.text
      .split("\n")
      .filter((line) => line.trim().startsWith("- "))
      .slice(0, 3);
  }, [messages]);

  async function sendPrompt() {
    if (!prompt.trim() || loading) {
      return;
    }

    const currentPrompt = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { id: messageId(), role: "user", text: currentPrompt }]);
    setLoading(true);

    try {
      const response = await onAsk(currentPrompt);
      setMessages((prev) => [...prev, { id: messageId(), role: "assistant", text: response.answer }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button className="ai-fab" type="button" onClick={() => setOpen((prev) => !prev)}>
        AI
      </button>

      {open && (
        <dialog className="ai-panel" open aria-label="AI planner">
          <header>
            <h3>{t("ai.title")}</h3>
            <p>{locationHeader}</p>
          </header>

          <div className="ai-messages">
            {messages.map((message) => (
              <article key={message.id} className={`ai-message ${message.role}`}>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          {activityCards && activityCards.length > 0 && (
            <div className="ai-activities">
              {activityCards.map((line) => (
                <span key={line}>{line.replace(/^-\s*/, "")}</span>
              ))}
            </div>
          )}

          <footer>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("ai.ask")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void sendPrompt();
                }
              }}
            />
            <button className="primary-button" type="button" disabled={loading} onClick={() => void sendPrompt()}>
              {t("ai.send")}
            </button>
          </footer>
        </dialog>
      )}
    </>
  );
}
