export interface Exam {
  id: string;
  name: string;
  credits: number;
  examDate: string;
  difficulty: 'low' | 'medium' | 'high';
  weeklyHours: Record<string, number>; // 'monday': 3, 'tuesday': 2, etc.
  completed: boolean;
  startDate?: string;
  totalHoursNeeded: number;
  daysNeeded: number;
  isLate?: boolean;
  isEarly?: boolean;
}

export interface StudySession {
  id: string;
  examId: string;
  date: string;
  plannedHours: number;
  actualHours: number;
  completed: boolean;
  skippedHours?: number;
  hourStatuses?: Array<'studied' | 'skipped' | 'pending'>;
}

export interface DayProgress {
  date: string;
  exams: Array<{
    examId: string;
    examName: string;
    plannedHours: number;
    actualHours: number;
    skippedHours?: number;
    hourStatuses?: Array<'studied' | 'skipped' | 'pending'>;
  }>;
  totalPlannedHours: number;
  totalActualHours: number;
}