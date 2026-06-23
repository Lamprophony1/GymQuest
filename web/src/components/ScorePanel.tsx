import type { ReactNode } from 'react';

interface ScorePanelProps {
  eyebrow?: string;
  title: string;
  value: string | number;
  suffix?: string;
  meta?: string;
  icon?: ReactNode;
  iconFrameClassName?: string;
  tone?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
}

export function ScorePanel({
  eyebrow,
  title,
  value,
  suffix,
  meta,
  icon,
  iconFrameClassName = 'icon-frame',
  tone = 'brand'
}: ScorePanelProps) {
  const valueLabel = suffix ? `${value} ${suffix}` : String(value);

  return (
    <article className={`score-panel score-panel--${tone}`}>
      <div className="score-panel__topline">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h3>{title}</h3>
        </div>
        {icon ? (
          <span className={iconFrameClassName} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <strong className="score-panel__value">{valueLabel}</strong>
      {meta ? <p className="score-panel__meta">{meta}</p> : null}
    </article>
  );
}
