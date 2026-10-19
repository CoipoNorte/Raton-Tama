// Iconos de comida 100 % SVG en línea: se ven igual en cualquier dispositivo,
// sin depender de que el sistema traiga fuentes de emoji instaladas.
export type ModeloComida = "onigiri" | "fruta" | "bebida" | "pastel" | "queso";

export default function IconoComida({ modelo, size = 24 }: { modelo: ModeloComida; size?: number }) {
  const comun = {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    "aria-hidden": true
  } as const;
  if (modelo === "onigiri") {
    return (
      <svg {...comun}>
        <path d="M16 4 28 24c.8 1.4-.2 3-1.8 3H5.8c-1.6 0-2.6-1.6-1.8-3L16 4z" fill="#fdfdf8" stroke="#8a7a68" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="11" y="17" width="10" height="7" rx="1.5" fill="#4d7c5f" />
        <circle cx="13" cy="12" r="1" fill="#8a7a68" /><circle cx="18" cy="10" r="1" fill="#8a7a68" /><circle cx="16" cy="14" r="1" fill="#8a7a68" />
      </svg>
    );
  }
  if (modelo === "fruta") {
    return (
      <svg {...comun}>
        <path d="M16 27C10 21 6 17 6 12.5 6 8.9 8.8 6.5 12 6.5c1.6 0 3 .8 4 2 1-1.2 2.4-2 4-2 3.2 0 6 2.4 6 6 0 4.5-4 8.5-10 14.5z" fill="#e2607a" stroke="#b8435c" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M16 6.5c0-2 1.2-3.4 3-4" fill="none" stroke="#4d7c5f" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="12.5" cy="12" rx="1.6" ry="2.2" fill="#f7a8b8" opacity=".8" />
      </svg>
    );
  }
  if (modelo === "bebida") {
    return (
      <svg {...comun}>
        <path d="M9 8h14l-1.6 16.2c-.1 1.2-1.1 2.1-2.3 2.1h-6.2c-1.2 0-2.2-.9-2.3-2.1L9 8z" fill="#dcefe4" stroke="#7fa88f" strokeWidth="1.6" strokeLinejoin="round" />
        <rect x="9" y="8" width="14" height="4" rx="1" fill="#9dc3a9" />
        <rect x="14.6" y="3" width="2.8" height="6" rx="1.4" fill="#e8a2ae" />
        <circle cx="13" cy="17" r="1.1" fill="#7fa88f" /><circle cx="18" cy="20" r="1.1" fill="#7fa88f" />
      </svg>
    );
  }
  if (modelo === "pastel") {
    return (
      <svg {...comun}>
        <ellipse cx="16" cy="22" rx="10" ry="5.5" fill="#f6c9d4" stroke="#d18ba0" strokeWidth="1.5" />
        <ellipse cx="16" cy="19" rx="10" ry="5.5" fill="#fbe3e9" stroke="#d18ba0" strokeWidth="1.5" />
        <ellipse cx="16" cy="16" rx="7" ry="3.6" fill="#fdf3ee" stroke="#d18ba0" strokeWidth="1.3" />
        <circle cx="16" cy="10.5" r="2.4" fill="#e2607a" />
        <path d="M16 12.9v2.2" stroke="#4d7c5f" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg {...comun}>
      <path d="M4 22 24 8.5c1.2-.7 2.7.2 2.7 1.6V22c0 1.7-1.4 3-3 3H7c-1.7 0-3-1.3-3-3z" fill="#f4cf6b" stroke="#c79a3f" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="13" cy="19" r="1.4" fill="#e0aa4e" /><circle cx="18.5" cy="21" r="1.4" fill="#e0aa4e" /><circle cx="21" cy="16.5" r="1.1" fill="#e0aa4e" />
    </svg>
  );
}
