import type { ReactNode } from 'react';

interface ScorePanelProps {
  eyebrow?: string;
  title: string;
  value: string | number;
  suffix?: string;
  meta?: string;
  icon?: ReactNode;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

export function ScorePanel({ eyebrow, title, value, suffix, meta, icon, tone = 'brand' }: ScorePanelProps) {
  const valueLabel = suffix ? `${value} ${suffix}` : String(value);

  return (
    <article className={`score-panel score-panel--${tone}`}>
      <div className="score-panel__topline">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h3>{title}</h3>
        </div>
        {icon ? <span className="icon-frame" aria-hidden="true">{icon}</span> : null}
      </div>
      <strong className="score-panel__value">{valueLabel}</strong>
      {meta ? <p className="score-panel__meta">{meta}</p> : null}
    </article>
  );
}
