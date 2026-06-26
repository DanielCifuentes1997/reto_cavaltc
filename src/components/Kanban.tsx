"use client";

import { useStore } from "@/lib/store/useStore";

export default function Kanban() {
  const { tasks, updateTaskStatus } = useStore();

  const columns = [
    { id: "todo", title: "Por Hacer (Riesgos)", color: "bg-slate-100" },
    { id: "in_progress", title: "En Mitigación", color: "bg-blue-50" },
    { id: "done", title: "Control Implementado", color: "bg-green-50" },
  ] as const;

  return (
    <div className="w-full h-[600px] bg-white rounded-lg shadow-lg overflow-hidden border border-slate-200 flex flex-col">
      <div className="bg-cavaltec-dark p-4 text-white">
        <h2 className="text-xl font-bold">Panel de Mitigación (Kanban)</h2>
      </div>
      
      <div className="flex-grow p-4 flex gap-4 overflow-x-auto bg-slate-50">
        {columns.map((col) => (
          <div key={col.id} className={`flex-1 min-w-[250px] rounded-lg p-3 flex flex-col gap-3 border border-slate-200 ${col.color}`}>
            <h3 className="font-semibold text-slate-700 border-b border-slate-300 pb-2">{col.title}</h3>
            
            <div className="flex flex-col gap-3 flex-grow overflow-y-auto">
              {tasks.filter((t) => t.status === col.id).map((task) => (
                <div key={task.id} className="bg-white p-3 rounded-md shadow-sm border border-slate-200 flex flex-col gap-2">
                  <p className="font-bold text-sm text-cavaltec-blue">{task.title}</p>
                  <p className="text-xs text-slate-600 line-clamp-3">{task.mitigation_steps}</p>
                  
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-100">
                    {col.id !== "todo" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, col.id === "done" ? "in_progress" : "todo")}
                        className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors"
                      >
                        ← Atrás
                      </button>
                    )}
                    {col.id !== "done" && (
                      <button
                        onClick={() => updateTaskStatus(task.id, col.id === "todo" ? "in_progress" : "done")}
                        className="text-xs px-2 py-1 bg-cavaltec-gold text-cavaltec-dark font-bold rounded hover:bg-yellow-400 transition-colors ml-auto"
                      >
                        Avanzar →
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {tasks.filter((t) => t.status === col.id).length === 0 && (
                <div className="text-center text-xs text-slate-400 italic mt-4">
                  Sin tareas en esta fase
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}