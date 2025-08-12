import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Exam, DayProgress } from '../types/exam';
import { formatDate, isDateInRange } from '../utils/examCalculations';

interface DayDetailProps {
  date: string;
  exams: Exam[];
  dayProgress: DayProgress;
  onUpdateProgress: (examId: string, actualHours: number) => void;
  onRecoverHours: (examId: string, recoverMode: 'distribute' | 'debt') => void;
}

const DayDetail: React.FC<DayDetailProps> = ({
  date,
  exams,
  dayProgress,
  onUpdateProgress,
  onRecoverHours
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (date) {
      setIsVisible(true);
    }
    return () => setIsVisible(false);
  }, [date]);

  console.log('DayDetail rendering with props:', { date, exams: exams.length, dayProgress });

  if (!date) {
    console.log('DayDetail: No date provided');
    return null;
  }

  const examForDay = exams.filter(exam => {
    const isScheduled = isDateInRange(date, exam.startDate, exam.endDate);
    console.log(`Exam ${exam.name} scheduled for ${date}:`, isScheduled);
    return isScheduled;
  });

  if (examForDay.length === 0) {
    console.log('DayDetail: No exams scheduled for date:', date);
    return (
      <div className={`text-center text-gray-500 py-4 transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
        <p>Nessun esame programmato per questa data</p>
      </div>
    );
  }

  const selectedDate = new Date(date);
  const formattedDate = formatDate(selectedDate);

  // Mostra gli esami pianificati anche se non ci sono sessioni di studio
  const examsToShow = examForDay.map(exam => {
    const examProgress = dayProgress.exams.find(e => e.examId === exam.id);
    const dayOfWeek = selectedDate.getDay();
    const weekday = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const plannedHours = exam.weeklyHours[weekday];

    return {
      examId: exam.id,
      examName: exam.name,
      plannedHours: plannedHours,
      actualHours: examProgress?.actualHours || 0
    };
  });

  console.log('DayDetail: Rendering exams for date:', formattedDate);
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 transform transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'}`}>
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{formattedDate}</h3>
        <p className="text-sm text-gray-600 mt-2">
          {examsToShow.length} {examsToShow.length === 1 ? 'esame' : 'esami'} in programma
        </p>
      </div>

      {examForDay.map((exam, index) => {
        const examProgress = examsToShow.find(e => e.examId === exam.id);
        const isStartDate = date === exam.startDate;
        const isEndDate = date === exam.examDate;

        return (
          <div 
            key={exam.id} 
            className={`border rounded-xl p-6 mb-6 bg-gray-50 hover:bg-white transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">{exam.name}</h4>
              <div className="flex gap-2">
                {isStartDate && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    Inizio preparazione
                  </span>
                )}
                {isEndDate && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    Data esame
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Ore previste</p>
                  <p className="text-xl font-semibold text-gray-900">{examProgress?.plannedHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600">Ore studiate</p>
                  <p className="text-xl font-semibold text-gray-900">{examProgress?.actualHours.toFixed(1)}h</p>
                </div>
              </div>

              {examProgress && examProgress.plannedHours > 0 && (
                <div className="flex gap-4">
                  <button
                    onClick={() => onUpdateProgress(exam.id, examProgress.actualHours + 1)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ✓ Aggiungi un'ora studiata
                  </button>
                  {examProgress.actualHours < examProgress.plannedHours && (
                    <button
                      onClick={() => onRecoverHours(exam.id, 'distribute')}
                      className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                    >
                      ⚠ Segna come saltata
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DayDetail;