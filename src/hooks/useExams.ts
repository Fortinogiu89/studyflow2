import { useState, useEffect } from 'react';
import { Exam, StudySession, DayProgress } from '../types/exam';
import { calculateExamPlan, isDateLate, isDateEarly } from '../utils/examCalculations';

export const useExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);

  useEffect(() => {
    const savedExams = localStorage.getItem('exams');
    const savedSessions = localStorage.getItem('studySessions');
    
    if (savedExams) {
      setExams(JSON.parse(savedExams));
    }
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('exams', JSON.stringify(exams));
  }, [exams]);

  useEffect(() => {
    localStorage.setItem('studySessions', JSON.stringify(studySessions));
  }, [studySessions]);

  const addExam = (examData: Omit<Exam, 'id' | 'completed' | 'totalHoursNeeded' | 'daysNeeded' | 'startDate'>) => {
    // Verifica che almeno un giorno abbia delle ore pianificate
    const hasPlannedHours = Object.values(examData.weeklyHours).some(hours => hours > 0);
    if (!hasPlannedHours) {
      throw new Error('Devi pianificare almeno un\'ora di studio settimanale');
    }

    const calculations = calculateExamPlan(examData);
    const newExam: Exam = {
      ...examData,
      ...calculations,
      id: Date.now().toString(),
      completed: false,
      isLate: calculations.startDate ? isDateLate(calculations.startDate) : false,
      isEarly: calculations.startDate ? isDateEarly(calculations.startDate) : false,
    } as Exam;

    setExams(prev => [...prev, newExam]);
    return newExam;
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setExams(prev => prev.map(exam => {
      if (exam.id === id) {
        const updatedExam = { ...exam, ...updates };
        if ('credits' in updates || 'difficulty' in updates || 'weeklyHours' in updates || 'examDate' in updates) {
          const calculations = calculateExamPlan(updatedExam);
          return {
            ...updatedExam,
            ...calculations,
            isLate: calculations.startDate ? isDateLate(calculations.startDate) : false,
            isEarly: calculations.startDate ? isDateEarly(calculations.startDate) : false,
          } as Exam;
        }
        return updatedExam;
      }
      return exam;
    }));
  };

  const deleteExam = (id: string) => {
    setExams(prev => prev.filter(exam => exam.id !== id));
    setStudySessions(prev => prev.filter(session => session.examId !== id));
  };

  const completeExam = (id: string) => {
    updateExam(id, { completed: true });
  };

  const addStudySession = (session: Omit<StudySession, 'id'>) => {
    const newSession: StudySession = {
      ...session,
      id: Date.now().toString(),
      actualHours: Math.max(0, session.actualHours || 0), // Assicurati che actualHours non sia mai negativo
    };
    setStudySessions(prev => [...prev, newSession]);
  };

  const updateStudySession = (id: string, updates: Partial<StudySession>) => {
    setStudySessions(prev => prev.map(session => {
      if (session.id === id) {
        // Assicurati che actualHours non sia mai negativo
        const actualHours = 'actualHours' in updates ? Math.max(0, updates.actualHours || 0) : session.actualHours;
        return { ...session, ...updates, actualHours };
      }
      return session;
    }));
  };

  const getExamStats = () => {
    const total = exams.length;
    const completed = exams.filter(exam => exam.completed).length;
    const pending = total - completed;
    const late = exams.filter(exam => !exam.completed && exam.isLate).length;

    return { total, completed, pending, late };
  };

  const getDayProgress = (date: string): DayProgress => {
    const dayOfWeek = new Date(date).getDay();
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    // Trova tutti gli esami pianificati per questo giorno
    const plannedExams = exams.filter(exam => {
      // Verifica se l'esame è pianificato per questo giorno della settimana
      const hasHoursPlanned = exam.weeklyHours[weekday] > 0;
      // Verifica se la data è nel range di date dell'esame
      const isInDateRange = date >= (exam.startDate || '') && date <= exam.examDate;
      return hasHoursPlanned && isInDateRange && !exam.completed;
    });
    
    // Trova le sessioni di studio esistenti per questo giorno
    const dayStudySessions = studySessions.filter(session => session.date === date);
    
    // Crea i dati di progresso per tutti gli esami pianificati
    const examData = plannedExams.map(exam => {
      const session = dayStudySessions.find(s => s.examId === exam.id);
      const plannedHours = exam.weeklyHours[weekday];
      const actualHours = session ? Math.max(0, session.actualHours) : 0;
      
      // Log per debug
      console.log('getDayProgress - exam data:', {
        examId: exam.id,
        examName: exam.name,
        plannedHours,
        actualHours,
        session
      });
      
      return {
        examId: exam.id,
        examName: exam.name,
        plannedHours,
        actualHours,
        skippedHours: session?.skippedHours || 0,
        hourStatuses: session?.hourStatuses || undefined,
      };
    });

    // Calcola il totale delle ore pianificate e studiate
    const totalPlannedHours = examData.reduce((sum, e) => sum + e.plannedHours, 0);
    const totalActualHours = examData.reduce((sum, e) => sum + (e.actualHours || 0), 0);

    // Log per debug
    console.log('getDayProgress - totals:', {
      date,
      examData,
      totalPlannedHours,
      totalActualHours,
      dayStudySessions
    });

    return {
      date,
      exams: examData,
      totalPlannedHours,
      totalActualHours,
    };
  };

  return {
    exams,
    studySessions,
    addExam,
    updateExam,
    deleteExam,
    completeExam,
    addStudySession,
    updateStudySession,
    getExamStats,
    getDayProgress,
  };
};