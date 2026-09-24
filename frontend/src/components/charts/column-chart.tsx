'use client';

import { useState } from 'react';
import { useElementWidth } from '@/hooks/use-element-width';
import { niceTicks } from './nice-ticks';

export type ColumnDatum = {
  key: string;
  /** Axis label, e.g. "Sep" */
  label: string;
  /** Tooltip / screen-reader label, e.g. "September 2026" */
  longLabel: string;
  value: number;
  /** Extra tooltip line, e.g. "3 expenses" */
  detail?: string;
};

type ColumnChartProps = {
  data: ColumnDatum[];
  formatValue: (value: number) => string;
  formatTick: (value: number) => string;
  /** Total height including the x-axis labels, so the card never scrolls. */
  height?: number;
  ariaLabel: string;
};

const MARGIN = { top: 20, right: 8, bottom: 28 };
const MAX_BAR_WIDTH = 24;
const RADIUS = 4;

// Column with a rounded data end (top) and a square baseline end.
function columnPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(RADIUS, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/**
 * Single-series column chart in plain SVG: hairline grid, thin columns,
 * a direct label on the latest value, and a hover/focus tooltip per column.
 */
export function ColumnChart({ data, formatValue, formatTick, height = 240, ariaLabel }: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  const ticks = niceTicks(Math.max(...data.map((d) => d.value), 0));
  const top = ticks[ticks.length - 1] || 1;
  const left = Math.max(...ticks.map((t) => formatTick(t).length)) * 7 + 10;

  const plotW = Math.max(width - left - MARGIN.right, 0);
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(MAX_BAR_WIDTH, band * 0.6);
  const y = (v: number) => MARGIN.top + plotH - (v / top) * plotH;
  // On narrow screens, label every other month, always keeping the latest.
  const labelEvery = band < 34 ? 2 : 1;
  const last = data.length - 1;

  const activeDatum = active !== null ? data[active] : null;
  const tooltipX = active !== null ? left + band * active + band / 2 : 0;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
          {/* gridlines + y ticks */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={left}
                x2={width - MARGIN.right}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? 'var(--chart-axis)' : 'var(--chart-grid)'}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text
                x={left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-muted-foreground text-[11px] tabular-nums"
              >
                {formatTick(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = left + band * i + band / 2;
            const h = (d.value / top) * plotH;
            return (
              <g key={d.key}>
                {active === i && (
                  <rect x={cx - band / 2} y={MARGIN.top} width={band} height={plotH} fill="var(--chart-hover)" />
                )}
                {d.value > 0 && (
                  <path
                    d={columnPath(cx - barW / 2, y(d.value), barW, h)}
                    fill="var(--chart-series)"
                    opacity={active === i ? 0.8 : 1}
                  />
                )}
                {/* Direct label on the latest column only; the rest is in the tooltip and table. */}
                {i === last && d.value > 0 && active === null && (
                  <text
                    x={cx}
                    y={y(d.value) - 6}
                    textAnchor="middle"
                    className="fill-foreground text-[11px] font-medium tabular-nums"
                  >
                    {formatTick(d.value)}
                  </text>
                )}
                {(i % labelEvery === last % labelEvery) && (
                  <text
                    x={cx}
                    y={height - 8}
                    textAnchor="middle"
                    className={i === last ? 'fill-foreground text-[11px] font-medium' : 'fill-muted-foreground text-[11px]'}
                  >
                    {d.label}
                  </text>
                )}
                {/* Hit target: the whole column band, bigger than the bar itself. */}
                <rect
                  x={cx - band / 2}
                  y={MARGIN.top}
                  width={band}
                  height={plotH}
                  fill="transparent"
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.longLabel}: ${formatValue(d.value)}${d.detail ? `, ${d.detail}` : ''}`}
                  className="cursor-default outline-none focus-visible:stroke-ring"
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
        </svg>
      )}

      {activeDatum && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-card px-3 py-2 text-xs whitespace-nowrap shadow-md"
          style={{
            left: Math.min(Math.max(tooltipX, 60), width - 60),
            top: Math.max(y(activeDatum.value) - 10, 0),
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-sm font-semibold text-foreground">{formatValue(activeDatum.value)}</p>
          <p className="text-muted-foreground">{activeDatum.longLabel}</p>
          {activeDatum.detail && <p className="text-muted-foreground">{activeDatum.detail}</p>}
        </div>
      )}
    </div>
  );
}
