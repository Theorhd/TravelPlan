import { useState } from "react";

type AuthMode = "login" | "register";

export type AuthPayload = {
  displayName?: string;
  id: string;
  password: string;
};

export function AuthLanding({
  busy,
  error,
  onLogin,
  onRegister,
}: Readonly<{
  busy: boolean;
  error: string | null;
  onLogin: (payload: AuthPayload) => void;
  onRegister: (payload: AuthPayload) => void;
}>) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit() {
    if (!id.trim() || !password.trim()) {
      return;
    }

    if (mode === "register") {
      onRegister({
        displayName,
        id,
        password,
      });
      return;
    }

    onLogin({
      id,
      password,
    });
  }

  return (
    <main className="auth-shell">
      <div className="auth-bg-glow top" />
      <div className="auth-bg-glow bottom" />

      <section className="auth-card">
        <header>
          <p className="auth-kicker">TravelPlan</p>
          <h1>Bienvenue dans votre carnet de tour du monde</h1>
          <p className="auth-subtitle">
            Connectez-vous pour retrouver vos voyages ou inscrivez-vous pour commencer une nouvelle aventure.
          </p>
        </header>

        <div className="auth-toggle" role="tablist" aria-label="Choisir connexion ou inscription">
          <button
            type="button"
            className={`auth-toggle-item ${mode === "login" ? "active" : ""}`.trim()}
            onClick={() => setMode("login")}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`auth-toggle-item ${mode === "register" ? "active" : ""}`.trim()}
            onClick={() => setMode("register")}
          >
            Inscription
          </button>
        </div>

        <div className="auth-form">
          {mode === "register" && (
            <label>
              <span>Display Name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Theo"
                autoComplete="nickname"
              />
            </label>
          )}

          <label>
            <span>ID (@username)</span>
            <input
              value={id}
              onChange={(event) => setId(event.target.value)}
              placeholder="@theorhd"
              autoComplete="username"
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </label>

          {error && <p className="error-banner">{error}</p>}

          <button className="primary-button auth-submit" type="button" disabled={busy} onClick={handleSubmit}>
            {mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </div>
      </section>
    </main>
  );
}
