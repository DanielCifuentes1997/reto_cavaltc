"use client";

import { useEffect, useCallback } from "react";
import { useStore } from "@/lib/store/useStore";

const SEVERITY_COLOR: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: "bg-red-50 border-red-200", text: "text-red-600", label: "Crítico" },
  2: { bg: "bg-orange-50 border-orange-200", text: "text-orange-600", label: "Alto" },
  3: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-600", label: "Medio" },
};

function getSeverity(questionId: number | undefined, status: string) {
  // Si la tarea ya es un control implementado, forzamos la etiqueta verde de Validado
  if (status === "done") {
    return { bg: "bg-green-50 border-green-200", text: "text-green-700", label: "Validado" };
  }
  
  if (!questionId) return SEVERITY_COLOR[3];
  if (questionId === 1 || questionId <= 3) return SEVERITY_COLOR[1];
  if (questionId <= 7) return SEVERITY_COLOR[2];
  return SEVERITY_COLOR[3];
}

const COLUMNS = [
  {
    id: "todo" as const,
    title: "Brechas",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    accent: "border-red-400",
    headerBg: "bg-red-50",
    headerText: "text-red-700",
  },
  {
    id: "in_progress" as const,
    title: "Mitigando",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
    accent: "border-yellow-400",
    headerBg: "bg-yellow-50",
    headerText: "text-yellow-700",
  },
  {
    id: "done" as const,
    title: "Implementado",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    accent: "border-green-500",
    headerBg: "bg-green-50",
    headerText: "text-green-700",
  },
] as const;

export default function Kanban() {
  const { tasks, updateTaskStatus, setTasks, evaluationId } = useStore();

  // Load existing tasks from Supabase on mount (handles page refresh)
  useEffect(() => {
    if (!evaluationId) return;
    fetch(`/api/kanban?evaluationId=${evaluationId}`)
      .then((r) => r.json())
      .then(({ tasks: remote }) => {
        if (Array.isArray(remote) && remote.length > 0) {
          setTasks(remote);
        }
      })
      .catch(console.error);
  }, [evaluationId, setTasks]);

  // Optimistic update + persist to Supabase
  const handleStatusUpdate = useCallback(
    (taskId: string, status: "todo" | "in_progress" | "done") => {
      updateTaskStatus(taskId, status);
      if (!evaluationId) return;
      fetch(`/api/kanban/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, evaluationId }),
      }).catch(console.error);
    },
    [evaluationId, updateTaskStatus]
  );

  // Calculamos las brechas reales (las que NO están en "done")
  const realBrechasCount = tasks.filter(t => t.status !== "done").length;

  return (
    <div className="w-full h-[600px] bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 flex flex-col">
      {/* Header */}
      <div className="bg-cavaltec-dark px-5 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-cavaltec-gold/10 border border-cavaltec-gold/30 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        </div>
        <div>
          <h2 className="text-white font-bold text-sm leading-none">Plan de Mitigación</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {realBrechasCount} brecha{realBrechasCount !== 1 ? "s" : ""} identificada{realBrechasCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          {tasks.filter((t) => t.status === "done").length > 0 && (
            <span className="text-xs font-semibold text-green-400">
              {tasks.filter((t) => t.status === "done").length} ✓
            </span>
          )}
        </div>
      </div>

      {/* Columns */}
      <div className="flex-grow flex gap-0 overflow-hidden">
        {COLUMNS.map((col, i) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex-1 flex flex-col border-r last:border-r-0 border-slate-100 ${i === 0 ? "" : ""}`}
            >
              {/* Column header */}
              <div className={`px-3 py-2.5 flex items-center gap-2 border-b-2 ${col.accent} ${col.headerBg}`}>
                <span className={col.headerText}>{col.icon}</span>
                <span className={`text-xs font-bold ${col.headerText}`}>{col.title}</span>
                <span className={`ml-auto text-xs font-bold ${col.headerText} bg-white/60 rounded-full w-5 h-5 flex items-center justify-center`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div className="flex-grow overflow-y-auto px-2 py-2 flex flex-col gap-2 bg-slate-50/50">
                {colTasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    </div>
                    <p className="text-xs text-slate-300">Sin tareas</p>
                  </div>
                )}

                {colTasks.map((task) => {
                  // Pasamos el status a la función para que sepa si ya está Validado
                  const sev = getSeverity(task.question_id, task.status);
                  return (
                    <div
                      key={task.id}
                      className={`bg-white rounded-xl border p-3 shadow-xs flex flex-col gap-2 ${sev.bg}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${sev.text} bg-white/80 border border-current/20 flex-shrink-0`}>
                          {sev.label}
                        </span>
                        {task.question_id && (
                          <span className="text-xs text-slate-400 ml-auto flex-shrink-0">
                            P.{task.question_id}
                          </span>
                        )}
                      </div>

                      <p className="font-semibold text-xs text-slate-700 leading-snug">
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {task.mitigation_steps}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-1.5 pt-1 border-t border-white/60">
                        {col.id !== "todo" && (
                          <button
                            onClick={() => handleStatusUpdate(task.id, col.id === "done" ? "in_progress" : "todo")}
                            className="flex-1 text-xs py-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                          >
                            ← Atrás
                          </button>
                        )}
                        {col.id !== "done" && (
                          <button
                            onClick={() => handleStatusUpdate(task.id, col.id === "todo" ? "in_progress" : "done")}
                            className="flex-1 text-xs py-1 rounded-lg bg-cavaltec-gold text-cavaltec-dark font-bold hover:bg-yellow-400 transition-colors"
                          >
                            {col.id === "todo" ? "Iniciar →" : "Cerrar ✓"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}