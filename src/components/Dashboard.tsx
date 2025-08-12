import React from 'react';
import { Calendar, BookOpen, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Exam } from '../types/exam';

interface DashboardProps {
  stats: {
    total: number;
    completed: number;
    pending: number;
    late: number;
  };
  exams: Exam[];
  onExamAction: (examId: string, action: 'start-early' | 'update-late' | 'keep-schedule' | 'edit') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ stats, exams, onExamAction }) => {
  const pendingExams = exams.filter(exam => !exam.completed);
  const lateExams = pendingExams.filter(exam => exam.isLate);
  const earlyExams = pendingExams.filter(exam => exam.isEarly);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Esami Totali</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completati</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Corso</p>
              <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Ritardo</p>
              <p className="text-2xl font-bold text-red-600">{stats.late}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Early Exams Alerts */}
      {earlyExams.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Esami in Anticipo
          </h3>
          {earlyExams.map(exam => (
            <div key={exam.id} className="bg-white rounded-lg p-4 mb-3 last:mb-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                  <p className="text-sm text-gray-600">
                    Inizio previsto: {exam.startDate} | Esame: {exam.examDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onExamAction(exam.id, 'start-early')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Inizia Subito
                  </button>
                  <button
                    onClick={() => onExamAction(exam.id, 'keep-schedule')}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Mantieni Piano
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Late Exams Alerts */}
      {lateExams.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Esami in Ritardo
          </h3>
          {lateExams.map(exam => {
            const today = new Date();
            const examDate = new Date(exam.examDate);
            const remainingDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const requiredDailyHours = remainingDays > 0 ? Math.ceil(exam.totalHoursNeeded / remainingDays) : exam.totalHoursNeeded;
            
            return (
              <div key={exam.id} className="bg-white rounded-lg p-4 mb-3 last:mb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                    <p className="text-sm text-gray-600">
                      Esame: {exam.examDate} | Devi studiare almeno {requiredDailyHours}h/giorno
                    </p>
                    {remainingDays <= 0 && (
                      <p className="text-sm text-red-600 font-medium">⚠️ Data esame già passata!</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onExamAction(exam.id, 'update-late')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Aggiorna Piano
                    </button>
                    <button
                      onClick={() => onExamAction(exam.id, 'keep-schedule')}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Mantieni
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pending Exams List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Esami da Completare</h3>
        {pendingExams.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">Tutti gli esami sono stati completati! 🎉</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingExams.map(exam => (
              <div key={exam.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                      {exam.isLate && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          In Ritardo
                        </span>
                      )}
                      {exam.isEarly && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          In Anticipo
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>{exam.credits} CFU</span>
                      <span className="mx-2">•</span>
                      <span>Esame: {exam.examDate}</span>
                      <span className="mx-2">•</span>
                      <span>{exam.totalHoursNeeded}h totali</span>
                      {exam.startDate && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Inizio: {exam.startDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onExamAction(exam.id, 'edit')}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Modifica
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};