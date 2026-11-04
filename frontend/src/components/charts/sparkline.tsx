type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
};

/**
 * A tiny trend line, decorative only (hidden from screen readers): the same
 * figures are in the monthly chart and its table. Draws in currentColor.
 */
export function Sparkline({ values, width = 120, height = 36, className }: SparklineProps) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 0) || 1;
  const pad = 3;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)},${height} L${x(0).toFixed(1)},${height} Z`;
  return (
    <svg aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className}>
      <path d={area} fill="currentColor" fillOpacity={0.12} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1]!)} r={3} fill="currentColor" />
    </svg>
  );
}
