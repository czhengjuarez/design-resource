import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { buttonClass } from "../keel";

export default function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div
        ref={ref}
        className="w-full max-w-lg rounded-xl shadow-lg"
        style={{ background: "var(--of-bg-elevated)", border: "1px solid var(--of-border-line)" }}
      >
        <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--of-border-line)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--of-fg-default)", fontFamily: "var(--of-font-display)" }}>
            {title}
          </h2>
          <button onClick={onClose} className={buttonClass({ variant: "ghost", size: "sm" })} style={{ padding: "0 4px" }}>
            <X size={15} strokeWidth={1.75} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex justify-end gap-2 border-t px-5 py-3" style={{ borderColor: "var(--of-border-line)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
