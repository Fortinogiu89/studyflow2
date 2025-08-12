import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Calendar as CalendarIcon, BarChart3, Menu, X, CheckCircle, AlertCircle, X as XIcon } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ExamForm } from './components/ExamForm';
import { Calendar } from './components/Calendar';
import { DayDetailModal } from './components/DayDetailModal';
import { Statistics } from './components/Statistics';
import { useExams } from './hooks/useExams';
import { formatDateForInput } from './utils/examCalculations';
import { Exam } from './types/exam';

type View = 'dashboard' | 'calendar' | 'statistics';

// Componente Toast per le notifiche
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }> = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
                  'bg-yellow-100 border-yellow-400 text-yellow-700';
  
  const icon = type === 'success' ? <CheckCircle className="h-5 w-5" /> : 
               type === 'error' ? <XIcon className="h-5 w-5" /> : 
               <AlertCircle className="h-5 w-5" />;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 p-4 border-l-4 rounded-md shadow-md z-50 ${bgColor}`}>
      <div className="flex items-center">
        {icon}
        <span className="ml-2">{message}</span>
        <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showExamForm, setShowExamForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Resetta la data selezionata solo quando si va in una vista diversa da calendar
  useEffect(() => {
    console.log('Current view changed to:', currentView);
    console.log('Selected date:', selectedDate);
    if (currentView !== 'calendar' && selectedDate) {
      console.log('Resetting selected date because view changed');
      setSelectedDate('');
    }
  }, [currentView]);

  useEffect(() => {
    console.log('Selected date changed to:', selectedDate);
    if (selectedDate) {
      console.log('Day progress for selected date:', getDayProgress(selectedDate));
    }
  }, [selectedDate]);
  
  const {
    exams,
    studySessions,
    addExam,
    updateExam,
    deleteExam,
    addStudySession,
    updateStudySession,
    getExamStats,
    getDayProgress,
  } = useExams();

  const stats = getExamStats();

  const handleExamAction = (examId: string, action: 'start-early' | 'update-late' | 'keep-schedule' | 'edit') => {
    if (action === 'start-early') {
      updateExam(examId, { 
        startDate: formatDateForInput(new Date()),
        isEarly: false 
      });
    } else if (action === 'update-late') {
      updateExam(examId, { 
        startDate: formatDateForInput(new Date()),
        isLate: false 
      });
    } else if (action === 'keep-schedule') {
      const examToUpdate = exams.find(exam => exam.id === examId);
      if (examToUpdate) {
        updateExam(examId, {
          isEarly: false,
          isLate: false
        });
      }
    } else if (action === 'edit') {
      const examToEdit = exams.find(exam => exam.id === examId);
      if (examToEdit) {
        setEditingExam(examToEdit);
        setShowExamForm(true);
      }
    }
  };

  const handleDaySelect = (date: string) => {
    console.log('handleDaySelect called with date:', date);
    console.log('Setting selectedDate to:', date);
    setSelectedDate(date);
    console.log('selectedDate after setState:', date);
  };

  const handleUpdateProgress = (examId: string, actualHours: number, hourStatuses?: Array<'studied' | 'skipped' | 'pending'>) => {
    const existingSession = studySessions.find(
      s => s.examId === examId && s.date === selectedDate
    );

    const exam = exams.find(e => e.id === examId);
    if (!exam) return;

    const date = new Date(selectedDate);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof typeof exam.weeklyHours;
    const plannedHours = exam.weeklyHours[dayOfWeek];

    // Assicuriamoci che actualHours non sia mai negativo
    const validActualHours = Math.max(0, actualHours);

    // Log per debug prima dell'aggiornamento
    console.log('handleUpdateProgress - Before update:', {
      examId,
      actualHours,
      validActualHours,
      plannedHours,
      existingSession,
      allStudySessions: studySessions
    });

    // Calcola le ore saltate dagli stati se disponibili
    const skippedHours = hourStatuses ? hourStatuses.filter(s => s === 'skipped').length : 0;

    if (existingSession) {
      // Aggiorniamo la sessione esistente
      updateStudySession(existingSession.id, { 
        actualHours: validActualHours,
        plannedHours,
        completed: validActualHours >= plannedHours,
        skippedHours,
        hourStatuses
      });
    } else {
      // Creiamo una nuova sessione
      addStudySession({
        examId,
        date: selectedDate,
        plannedHours,
        actualHours: validActualHours,
        completed: validActualHours >= plannedHours,
        skippedHours,
        hourStatuses
      });
    }

    // Log per debug dopo l'aggiornamento
    console.log('handleUpdateProgress - After update:', {
      examId,
      actualHours,
      validActualHours,
      plannedHours,
      existingSession,
      allStudySessions: studySessions
    });
  };

  const handleRecoverHours = (examId: string, skippedHours: number) => {
    console.log('DEBUG: handleRecoverHours called', { examId, skippedHours });
    
    // Trova la sessione di studio esistente
    const existingSession = studySessions.find(
      s => s.examId === examId && s.date === selectedDate
    );
    
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    const date = new Date(selectedDate);
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof typeof exam.weeklyHours;
    const plannedHours = exam.weeklyHours[dayOfWeek];
    
    // Aggiorna la sessione per riflettere le ore saltate
    if (existingSession) {
      // Mantieni le ore attuali ma segna come non completato se ci sono ore saltate
      updateStudySession(existingSession.id, {
        actualHours: existingSession.actualHours,
        plannedHours,
        completed: skippedHours === 0 && existingSession.actualHours >= plannedHours
      });
    } else if (skippedHours > 0) {
      // Se non esiste una sessione ma ci sono ore saltate, crea una nuova sessione
      addStudySession({
        examId,
        date: selectedDate,
        plannedHours,
        actualHours: 0,
        completed: false,
      });
    }
    
    console.log('DEBUG: handleRecoverHours completed', {
      examId,
      skippedHours,
      existingSession,
      plannedHours
    });
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'calendar', label: 'Calendario', icon: CalendarIcon },
    { id: 'statistics', label: 'Statistiche', icon: BarChart3 },
  ];

  const renderContent = () => {
    console.log('Rendering content for view:', currentView);
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard 
            stats={stats}
            exams={exams}
            onExamAction={handleExamAction}
          />
        );
      case 'calendar':
        console.log('Rendering calendar view with selectedDate:', selectedDate);
        const dayProgress = selectedDate ? getDayProgress(selectedDate) : null;
        console.log('Day progress:', dayProgress);
        return (
          <div className="space-y-6" key="calendar-view">
            <Calendar 
              exams={exams}
              getDayProgress={getDayProgress}
              onDaySelect={handleDaySelect}
              selectedDate={selectedDate}
            />
          </div>
        );
      case 'statistics':
        return <Statistics exams={exams} studySessions={studySessions} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Sidebar - Hidden */}
      <div className="hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StudyFlow</h1>
                <p className="text-sm text-gray-600">Pianifica il tuo successo</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id as View);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Add Exam Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => {
                setShowExamForm(true);
                setEditingExam(null);
                setMobileMenuOpen(false);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl py-3 px-4 flex items-center justify-center gap-2 hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Nuovo Esame
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay - Hidden */}

      {/* Main Content */}
      <div className="min-h-screen">
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header with Navigation */}
            <div className="mb-8">
              {/* App Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">StudyFlow</h1>
                  <p className="text-sm text-gray-600">Pianifica il tuo successo</p>
                </div>
              </div>
              
              {/* Navigation Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  {navigation.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id as View)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentView === item.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowExamForm(true);
                    setEditingExam(null);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg py-2 px-4 flex items-center gap-2 hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Nuovo Esame
                </button>
              </div>
              
              {/* Page Title */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {navigation.find(nav => nav.id === currentView)?.label}
                </h2>
                <p className="text-gray-600 mt-1">
                  {currentView === 'dashboard' && 'Panoramica dei tuoi esami e progressi'}
                  {currentView === 'calendar' && 'Pianifica e monitora le tue sessioni di studio'}
                  {currentView === 'statistics' && 'Analizza le tue performance di studio'}
                </p>
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Exam Form Modal */}
      <ExamForm
        isOpen={showExamForm}
        onClose={() => {
          setShowExamForm(false);
          setEditingExam(null);
        }}
        onSubmit={(examData) => {
          try {
            if (editingExam) {
              updateExam(editingExam.id, examData);
              showToast(`Esame "${examData.name}" aggiornato con successo`, 'success');
            } else {
              addExam(examData);
              showToast(`Esame "${examData.name}" aggiunto con successo`, 'success');
              // Torna alla dashboard dopo aver aggiunto un nuovo esame
              setCurrentView('dashboard');
            }
            setShowExamForm(false);
            setEditingExam(null);
          } catch (error) {
            showToast(error instanceof Error ? error.message : 'Errore durante il salvataggio dell\'esame', 'error');
          }
        }}
        onDelete={(examId) => {
          const examToDelete = exams.find(exam => exam.id === examId);
          deleteExam(examId);
          showToast(`Esame "${examToDelete?.name || 'Sconosciuto'}" eliminato con successo`, 'success');
          setShowExamForm(false);
          setEditingExam(null);
        }}
        exam={editingExam}
      />
      
      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailModal
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate('')}
          date={selectedDate}
          exams={exams}
          dayProgress={selectedDate ? getDayProgress(selectedDate) : { date: '', exams: [], totalPlannedHours: 0, totalActualHours: 0 }}
          onUpdateProgress={handleUpdateProgress}
          onRecoverHours={handleRecoverHours}
        />
      )}
      
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}