import { create } from 'zustand';

interface KanbanTask {
  id: string;
  title: string;
  mitigation_steps: string;
  status: 'todo' | 'in_progress' | 'done';
}

interface AppState {
  evaluationId: string | null;
  companyId: string | null;
  score: number;
  tasks: KanbanTask[];
  setEvaluationSession: (evaluationId: string, companyId: string) => void;
  updateScore: (newScore: number) => void;
  addTask: (task: KanbanTask) => void;
  updateTaskStatus: (taskId: string, status: 'todo' | 'in_progress' | 'done') => void;
}

export const useStore = create<AppState>((set) => ({
  evaluationId: null,
  companyId: null,
  score: 0,
  tasks: [],
  setEvaluationSession: (evaluationId, companyId) => set({ evaluationId, companyId }),
  updateScore: (score) => set({ score }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTaskStatus: (taskId, status) => set((state) => ({
    tasks: state.tasks.map((t) => t.id === taskId ? { ...t, status } : t)
  })),
}));