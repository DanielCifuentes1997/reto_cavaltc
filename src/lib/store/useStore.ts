import { create } from 'zustand';

interface KanbanTask {
  id: string;
  title: string;
  mitigation_steps: string;
  status: 'todo' | 'in_progress' | 'done';
  question_id?: number;
}

interface AppState {
  evaluationId: string | null;
  companyId: string | null;
  companyName: string | null;
  score: number;
  tasks: KanbanTask[];
  setEvaluationSession: (evaluationId: string, companyId: string, companyName?: string) => void;
  updateScore: (newScore: number) => void;
  addTask: (task: KanbanTask) => void;
  updateTaskStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  evaluationId: null,
  companyId: null,
  companyName: null,
  score: 0,
  tasks: [],
  setEvaluationSession: (evaluationId, companyId, companyName) =>
    set({ evaluationId, companyId, companyName: companyName ?? null }),
  updateScore: (score) => set({ score }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),
  reset: () => set({ evaluationId: null, companyId: null, companyName: null, score: 0, tasks: [] }),
}));
