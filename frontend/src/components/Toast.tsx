export interface ToastMessage {
  id: string;
  message: string;
  type?: "info" | "success" | "warning";
}

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex max-w-sm flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const borderBg =
          toast.type === "warning"
            ? "border-amber-400 bg-amber-50 text-amber-900 shadow-amber-100"
            : toast.type === "success"
            ? "border-emerald-400 bg-emerald-50 text-emerald-900 shadow-emerald-100"
            : "border-blue-400 bg-blue-50 text-blue-900 shadow-blue-100";

        const icon =
          toast.type === "warning" ? (
            <svg
              className="size-5 shrink-0 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
            <svg
              className="size-5 shrink-0 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          );

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${borderBg}`}
          >
            {icon}
            <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 transition-colors"
              aria-label="Close"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
