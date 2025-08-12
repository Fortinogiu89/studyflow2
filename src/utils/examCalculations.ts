import { Exam } from '../types/exam';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const calculateExamPlan = (exam: Omit<Exam, 'id' | 'totalHoursNeeded' | 'daysNeeded' | 'startDate'>): Partial<Exam> => {
  // Base hours: 1 CFU = 25 hours
  let totalHours = exam.credits * 25;
  
  // Adjust for difficulty
  switch (exam.difficulty) {
    case 'high':
      totalHours *= 1.2;
      break;
    case 'low':
      totalHours *= 0.8;
      break;
  }
  
  // Calculate total weekly hours available
  const weeklyHours = Object.values(exam.weeklyHours).reduce((sum, hours) => sum + hours, 0);
  
  if (weeklyHours === 0) {
    // Se non ci sono ore settimanali pianificate, impostiamo la data di inizio a oggi
    const today = new Date();
    return {
      totalHoursNeeded: Math.round(totalHours),
      daysNeeded: 0,
      startDate: today.toISOString().split('T')[0]
    };
  }
  
  // Calculate days needed
  const daysNeeded = Math.ceil(totalHours / (weeklyHours / 7));
  
  // Calculate start date (going backwards from exam date)
  const examDate = new Date(exam.examDate);
  const startDate = new Date(examDate);
  startDate.setDate(examDate.getDate() - daysNeeded - 1); // -1 to start before exam date
  
  return {
    totalHoursNeeded: Math.round(totalHours),
    daysNeeded,
    startDate: startDate.toISOString().split('T')[0]
  };
};

export const isDateLate = (startDate: string): boolean => {
  const today = new Date();
  const start = new Date(startDate);
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return start < today;
};

export const isDateEarly = (startDate: string): boolean => {
  const today = new Date();
  const start = new Date(startDate);
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return start > today;
};

export const calculateRecoveryHours = (exam: Exam, skippedHours: number): number => {
  const today = new Date();
  const examDate = new Date(exam.examDate);
  const remainingDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (remainingDays <= 0) return 0;
  
  return skippedHours / remainingDays;
};

export const isHoliday = (date: Date): boolean => {
  // Basic holidays - can be expanded
  const holidays = [
    '01-01', // New Year
    '06-01', // Epiphany
    '04-25', // Liberation Day
    '05-01', // Labor Day
    '06-02', // Republic Day
    '08-15', // Assumption
    '11-01', // All Saints
    '12-08', // Immaculate Conception
    '12-25', // Christmas
    '12-26'  // St. Stephen
  ];
  
  const dateStr = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  return holidays.includes(dateStr);
};

export const getDayOfWeek = (date: Date): string => {
  const day = date.getDay();
  return DAYS_OF_WEEK[day === 0 ? 6 : day - 1]; // Adjust for Monday-based week
};

export const getWeekDates = (date: Date): Date[] => {
  const week = [];
  const startOfWeek = new Date(date);
  const currentDay = startOfWeek.getDay();
  const diff = currentDay === 0 ? 6 : currentDay - 1; // Adjust to start from Monday
  startOfWeek.setDate(date.getDate() - diff);
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  
  return week;
};

export const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month} ${year}`;
};

export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isDateInRange = (date: string, startDate: string | undefined, endDate: string | undefined): boolean => {
  if (!startDate || !endDate) {
    console.log('isDateInRange: startDate or endDate is undefined', { date, startDate, endDate });
    return false;
  }
  
  const checkDate = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Normalize dates to compare only the date part (YYYY-MM-DD)
  const normalizedCheck = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  
  const isInRange = normalizedCheck >= normalizedStart && normalizedCheck <= normalizedEnd;
  console.log('isDateInRange check:', {
    date: normalizedCheck.toISOString().split('T')[0],
    start: normalizedStart.toISOString().split('T')[0],
    end: normalizedEnd.toISOString().split('T')[0],
    isInRange
  });
  
  return isInRange;
};