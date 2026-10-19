import type { Especie, Mascota } from "../game/types";

interface Props {
  mascota: Mascota;
  especie: Especie;
  reducirMovimiento: boolean;
}

export default function Fallback2D({ mascota, especie, reducirMovimiento }: Props) {
  const cuerpo = mascota.tinteHerencia ?? especie.color;
  const dormida = mascota.durmiendo;
  return (
    <svg className={reducirMovimiento ? "fallback-illustration still" : "fallback-illustration"} viewBox="0 0 680 430" role="img" aria-label={`${mascota.nombre}, una mascota virtual adorable`}>
      <defs>
        <linearGradient id="pared-fallback" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#edf6ed" /><stop offset="1" stopColor="#d4e9df" /></linearGradient>
        <linearGradient id="suelo-fallback" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#eed5b4" /><stop offset="1" stopColor="#d8b48f" /></linearGradient>
        <radialGradient id="luz-fallback"><stop stopColor="#fff5cb" stopOpacity=".72" /><stop offset="1" stopColor="#fff5cb" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="680" height="430" fill="url(#pared-fallback)" />
      <circle cx="510" cy="108" r="128" fill="url(#luz-fallback)" />
      <rect x="0" y="294" width="680" height="136" fill="url(#suelo-fallback)" />
      <path d="M0 296h680" stroke="#c89b74" strokeWidth="5" opacity=".42" />
      <rect x="73" y="67" width="128" height="118" rx="18" fill="#f8f1df" />
      <rect x="82" y="76" width="110" height="101" rx="12" fill="#b8dfe4" />
      <path d="M137 77v99M84 127h106" stroke="#f8f1df" strokeWidth="9" />
      <path d="M64 62h145M70 57v139M205 57v139" stroke="#d7b995" strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="338" cy="346" rx="204" ry="40" fill="#e8b8b8" opacity=".65" />
      <g transform="translate(82 254)">
        <path d="M15 50h48l-5 51H20z" fill="#edb99a" />
        <ellipse cx="39" cy="52" rx="31" ry="10" fill="#c98c73" />
        <path d="M39 47C27 20 28 5 34 -11M39 47C49 15 63 7 73 -7M39 44C18 26 11 15 8 4" fill="none" stroke="#77a982" strokeWidth="8" strokeLinecap="round" />
        <circle cx="34" cy="-11" r="13" fill="#8fbf91" /><circle cx="73" cy="-7" r="13" fill="#88b68e" /><circle cx="8" cy="4" r="13" fill="#9bc79b" />
      </g>
      <g transform="translate(340 249)" className="fallback-pet">
        {especie.etapa === "huevo" ? (
          <g>
            <ellipse cx="0" cy="88" rx="92" ry="16" fill="#765e62" opacity=".12" />
            <ellipse cx="0" cy="18" rx="72" ry="90" fill={cuerpo} />
            <ellipse cx="-10" cy="-18" rx="30" ry="44" fill="#fff6e9" opacity=".24" />
            <circle cx="-26" cy="12" r="12" fill={especie.acento} />
            <circle cx="30" cy="42" r="9" fill={especie.acento} />
            <ellipse cx="-22" cy="42" rx="11" ry="5" fill="#4b3d43" />
            <ellipse cx="22" cy="42" rx="11" ry="5" fill="#4b3d43" />
            <ellipse cx="-38" cy="62" rx="16" ry="9" fill={especie.mejillas} opacity=".7" />
            <ellipse cx="38" cy="62" rx="16" ry="9" fill={especie.mejillas} opacity=".7" />
          </g>
        ) : (
          <>
        <ellipse cx="0" cy="83" rx="116" ry="18" fill="#765e62" opacity=".12" />
        <path d="M74 42c63 6 72 48 51 66-18 15-43 3-39-13 4-11 15-9 18-2" fill="none" stroke={cuerpo} strokeWidth="16" strokeLinecap="round" />
        <ellipse cx="-54" cy="-20" rx="38" ry="48" fill={especie.acento} transform="rotate(-18 -54 -20)" />
        <ellipse cx="55" cy="-20" rx="38" ry="48" fill={especie.acento} transform="rotate(18 55 -20)" />
        <ellipse cx="-54" cy="-20" rx="20" ry="29" fill="#f6c4c4" transform="rotate(-18 -54 -20)" />
        <ellipse cx="55" cy="-20" rx="20" ry="29" fill="#f6c4c4" transform="rotate(18 55 -20)" />
        <ellipse cx="0" cy="25" rx="89" ry="91" fill={cuerpo} />
        <ellipse cx="-37" cy="14" rx="10" ry={dormida ? 2 : 14} fill="#47393f" />
        <ellipse cx="37" cy="14" rx="10" ry={dormida ? 2 : 14} fill="#47393f" />
        {!dormida && <g fill="#fff"><circle cx="-40" cy="9" r="4.2" /><circle cx="34" cy="9" r="4.2" /><circle cx="-31" cy="19" r="2" /><circle cx="43" cy="19" r="2" /></g>}
        <ellipse cx="-58" cy="43" rx="17" ry="11" fill={especie.mejillas} opacity=".72" />
        <ellipse cx="58" cy="43" rx="17" ry="11" fill={especie.mejillas} opacity=".72" />
        <ellipse cx="0" cy="51" rx="29" ry="21" fill="#ffe9d4" opacity=".72" />
        <path d="M0 39c-6 0-9 4-9 7 0 3 4 5 9 5s9-2 9-5c0-3-3-7-9-7" fill="#985d68" />
        <path d="M0 50v7m0 0c-8 8-14 6-16 2m16-2c8 8 14 6 16 2" fill="none" stroke="#76525a" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="-50" cy="97" rx="21" ry="12" fill={especie.acento} />
        <ellipse cx="50" cy="97" rx="21" ry="12" fill={especie.acento} />
        {mascota.durmiendo && <path d="M91-64c22-18 45-8 45 9 0 12-13 19-23 13 14 5 26-7 23-19 0-17-23-27-45-3z" fill="#fff6d7" />}
          </>
        )}
      </g>
      {/* Suciedad visible también en la vista 2D: nunca diverge del 3D. */}
      {mascota.suciedad > 0 && <g>
        {[[-112, 372], [176, 358], [40, 392]].slice(0, mascota.suciedad).map(([x, y], indice) => (
          <g key={`suciedad-${indice}`} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="0" rx="17" ry="11" fill="#a97a5c" />
            <ellipse cx="1" cy="-10" rx="11" ry="8" fill="#b5856a" />
          </g>
        ))}
      </g>}
      <g opacity=".8" fill="#fff8da"><circle cx="482" cy="211" r="4" /><circle cx="546" cy="257" r="3" /><circle cx="256" cy="181" r="3" /></g>
    </svg>
  );
}