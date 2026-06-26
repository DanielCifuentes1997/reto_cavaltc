"use client";

interface Props {
  score: number;
}

export default function ComplianceGauge({ score }: Props) {
  const r = 72;
  const cx = 100;
  const cy = 92;
  const circumference = 2 * Math.PI * r;
  // 270° arc = 3/4 of circumference
  const arcLength = (270 / 360) * circumference;
  const gap = circumference - arcLength;
  const progress = Math.min(score / 100, 1) * arcLength;

  const color =
    score >= 80 ? "#22c55e" : score >= 50 ? "#f0b429" : "#ef4444";

  const label =
    score >= 80
      ? "Cumplimiento alto"
      : score >= 50
      ? "Cumplimiento parcial"
      : "Bajo cumplimiento";

  // Needle tip position — angle starts at 135° (lower-left), sweeps 270° clockwise
  const needleAngleDeg = 135 + (score / 100) * 270;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  const needleX = cx + 52 * Math.cos(needleAngleRad);
  const needleY = cy + 52 * Math.sin(needleAngleRad);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 200 178" className="w-52 h-auto" aria-label={`Puntaje de cumplimiento: ${score}%`}>
        {/* Track arc — gray background */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${gap}`}
          transform={`rotate(135, ${cx}, ${cy})`}
        />

        {/* Progress arc — color coded */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          transform={`rotate(135, ${cx}, ${cy})`}
          style={{ transition: "stroke-dasharray 0.75s ease-out, stroke 0.4s ease" }}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="#1a3a5c"
          strokeWidth={2.5}
          strokeLinecap="round"
          style={{ transition: "x2 0.75s ease-out, y2 0.75s ease-out" }}
        />
        {/* Needle pivot */}
        <circle cx={cx} cy={cy} r={5} fill="#1a3a5c" />

        {/* Score number */}
        <text
          x={cx}
          y={cy + 6}
          textAnchor="middle"
          fontSize="38"
          fontWeight="bold"
          fontFamily="Inter, Arial, sans-serif"
          fill="#0d1f33"
        >
          {score}
        </text>

        {/* Percent symbol */}
        <text
          x={cx + 29}
          y={cy - 5}
          textAnchor="start"
          fontSize="16"
          fontWeight="bold"
          fontFamily="Inter, Arial, sans-serif"
          fill="#475569"
        >
          %
        </text>

        {/* 0% label */}
        <text x={28} y={160} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Inter, Arial, sans-serif">
          0%
        </text>

        {/* 100% label */}
        <text x={172} y={160} textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Inter, Arial, sans-serif">
          100%
        </text>
      </svg>

      {/* Status badge */}
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: `${color}22`, color }}
      >
        {label}
      </span>
    </div>
  );
}
