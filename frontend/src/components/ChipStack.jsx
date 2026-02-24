export default function ChipStack({ amount, label, color = "gold", inlineLabel = false }) {
  const style =
    color === "red"
      ? "from-red-400 to-red-600 border-red-700/50"
      : "from-amber-400 to-amber-600 border-amber-700/50"
  return (
    <div className={`flex flex-col items-center ${inlineLabel ? "gap-0.5" : "gap-1"}`}>
      <div
        className={`w-9 h-9 rounded-full border bg-gradient-to-b ${style}`}
        style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.15)" }}
      />
      {inlineLabel && label ? (
        <span className="text-[var(--color-cream)]/60 text-xs tabular-nums">
          <span className="font-semibold text-[var(--color-cream)]">{amount}</span>
          <span className="ml-1 opacity-80">{label}</span>
        </span>
      ) : (
        <>
          <span className="text-[var(--color-cream)] font-semibold text-base tabular-nums">{amount}</span>
          {label && <span className="text-[var(--color-cream)]/50 text-[11px] uppercase tracking-wider">{label}</span>}
        </>
      )}
    </div>
  )
}
