// hooks/useToast.js
// Global toast notification system — call from anywhere in the app.
//
// USAGE:
//   import { useToast } from "./hooks/useToast";
//   const { toast } = useToast();
//   toast.error("GPS failed to load");
//   toast.success("Location saved");
//   toast.warn("Poor GPS accuracy");
//   toast.info("Tracking started");

import { useEffect, useRef, useState } from "react";

// ── Singleton event bus ───────────────────────────────────────────────────────
const listeners = new Set();
let toastId = 0;
const recentMessages = new Map();

function emit(toastItem) {
  if (!toastItem || !toastItem.message) return;

  const key = `${toastItem.type}:${toastItem.message}`;
  const now = Date.now();
  const lastTime = recentMessages.get(key) || 0;

  // Throttle identical toast messages within 3 seconds
  if (now - lastTime < 3000) {
    return;
  }
  recentMessages.set(key, now);

  listeners.forEach((fn) => fn(toastItem));
}

// ── Public API — call these anywhere (no hook needed) ─────────────────────────
export const toast = {
  success: (message, opts) => emit({ id: ++toastId, type: "success", message, ...opts }),
  error:   (message, opts) => emit({ id: ++toastId, type: "error",   message, ...opts }),
  warn:    (message, opts) => emit({ id: ++toastId, type: "warn",    message, ...opts }),
  warning: (message, opts) => emit({ id: ++toastId, type: "warn",    message, ...opts }),
  info:    (message, opts) => emit({ id: ++toastId, type: "info",    message, ...opts }),
};

// ── Hook for components that also need toast ──────────────────────────────────
export function useToast() {
  return { toast };
}

// ── ToastContainer — mount ONCE at app root ───────────────────────────────────
const ICONS = {
  success: "✓",
  error:   "✕",
  warn:    "!",
  info:    "ℹ",
};

const THEMES = {
  success: {
    bg: "#ffffff",
    border: "rgba(16, 185, 129, 0.3)",
    iconBg: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    iconShadow: "0 4px 12px rgba(16, 185, 129, 0.35)",
    bar: "#10b981",
    title: "#065f46",
    text: "#1e293b",
  },
  error: {
    bg: "#ffffff",
    border: "rgba(239, 68, 68, 0.3)",
    iconBg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    iconShadow: "0 4px 12px rgba(239, 68, 68, 0.35)",
    bar: "#ef4444",
    title: "#991b1b",
    text: "#1e293b",
  },
  warn: {
    bg: "#ffffff",
    border: "rgba(245, 158, 11, 0.3)",
    iconBg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    iconShadow: "0 4px 12px rgba(245, 158, 11, 0.35)",
    bar: "#f59e0b",
    title: "#92400e",
    text: "#1e293b",
  },
  info: {
    bg: "#ffffff",
    border: "rgba(59, 130, 246, 0.3)",
    iconBg: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    iconShadow: "0 4px 12px rgba(59, 130, 246, 0.35)",
    bar: "#3b82f6",
    title: "#1e40af",
    text: "#1e293b",
  },
};

const DURATION = 3800; // ms
const MAX_VISIBLE_TOASTS = 3;

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (t) => {
      setToasts((prev) => {
        const next = [...prev, { ...t, visible: true }];
        if (next.length > MAX_VISIBLE_TOASTS) {
          return next.slice(-MAX_VISIBLE_TOASTS);
        }
        return next;
      });

      setTimeout(() => {
        setToasts((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, visible: false } : x))
        );
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, 320);
      }, DURATION);
    };
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, []);

  const dismiss = (id) => {
    setToasts((prev) =>
      prev.map((x) => (x.id === id ? { ...x, visible: false } : x))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 320);
  };

  return (
    <>
      <style>{`
        @keyframes toastSlideInCenter {
          0%   { opacity: 0; transform: translateY(-24px) scale(0.92); filter: blur(4px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes toastSlideOutCenter {
          0%   { opacity: 1; transform: translateY(0) scale(1); max-height: 120px; margin-bottom: 12px; }
          100% { opacity: 0; transform: translateY(-20px) scale(0.92); max-height: 0; margin-bottom: 0; }
        }
        @keyframes toastProgressBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
        .premium-toast-item {
          animation: toastSlideInCenter 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .premium-toast-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 48px -8px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08) !important;
        }
        .premium-toast-item.hiding {
          animation: toastSlideOutCenter 0.30s ease-in forwards;
        }
      `}</style>

      <div style={{
        position:  "fixed",
        top:       24,
        left:      "50%",
        transform: "translateX(-50%)",
        zIndex:    999999,
        display:   "flex",
        flexDirection: "column",
        alignItems: "center",
        gap:       12,
        maxWidth:  480,
        width:     "calc(100vw - 32px)",
        pointerEvents: "none",
      }}>
        {toasts.map((t) => {
          const c = THEMES[t.type] || THEMES.info;
          return (
            <div
              key={t.id}
              className={`premium-toast-item${t.visible ? "" : " hiding"}`}
              style={{
                width:        "100%",
                background:   c.bg,
                border:       `1px solid ${c.border}`,
                borderRadius: "16px",
                boxShadow:    "0 16px 40px -6px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.06)",
                backdropFilter: "blur(14px)",
                overflow:     "hidden",
                pointerEvents: "all",
                cursor:       "pointer",
              }}
              onClick={() => dismiss(t.id)}
            >
              {/* Content */}
              <div style={{
                display:    "flex",
                alignItems: "center",
                gap:        14,
                padding:    "14px 18px",
              }}>
                {/* Glowing Gradient Icon badge */}
                <div style={{
                  width:        34,
                  height:       34,
                  borderRadius: "11px",
                  background:   c.iconBg,
                  boxShadow:    c.iconShadow,
                  color:        "#ffffff",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  fontSize:     15,
                  fontWeight:   900,
                  flexShrink:   0,
                }}>
                  {ICONS[t.type]}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize:   "0.88rem",
                    fontWeight: 700,
                    color:      c.text,
                    lineHeight: 1.45,
                    letterSpacing: "-0.01em",
                  }}>
                    {t.message}
                  </div>
                </div>

                {/* Close */}
                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                  style={{
                    background: "rgba(0,0,0,0.04)",
                    border:     "none",
                    borderRadius: "8px",
                    cursor:     "pointer",
                    color:      "#64748b",
                    fontSize:   14,
                    width:      24,
                    height:     24,
                    display:    "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding:    0,
                    flexShrink: 0,
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
                >
                  ✕
                </button>
              </div>

              {/* Smooth Progress Bar */}
              <div style={{
                height:     3,
                background: "rgba(0,0,0,0.04)",
              }}>
                <div style={{
                  height:           "100%",
                  background:       c.bar,
                  animation:        `toastProgressBar ${DURATION}ms linear forwards`,
                  transformOrigin:  "left",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}