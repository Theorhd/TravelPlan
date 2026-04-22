import type { ReactNode } from "react";

export function GlassCard({
  title,
  subtitle,
  children,
  className = "",
}: Readonly<{
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}>) {
  return (
    <section className={`glass-card ${className}`.trim()}>
      {(title || subtitle) && (
        <header className="glass-card-header">
          {title && <h3>{title}</h3>}
          {subtitle && <p>{subtitle}</p>}
        </header>
      )}
      <div className="glass-card-content">{children}</div>
    </section>
  );
}
