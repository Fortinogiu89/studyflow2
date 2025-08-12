import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, AlertCircle, Check, X as XIcon, Plus } from 'lucide-react';
import { Exam, DayProgress } from '../types/exam';
import { formatDate } from '../utils/examCalculations';

// Componente per le notifiche toast
const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'warning' | 'neutral' | 'studied' | 'skipped'; onClose: () => void }> = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 
                  type === 'warning' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
                  type === 'studied' ? 'bg-green-100 border-green-400 text-green-700' :
                  type === 'skipped' ? 'bg-red-100 border-red-400 text-red-700' :
                  'bg-gray-100 border-gray-400 text-gray-700';
  
  const icon = type === 'success' || type === 'studied' ? <CheckCircle className="h-5 w-5" /> : 
               type === 'error' || type === 'skipped' ? <XIcon className="h-5 w-5" /> : 
               type === 'warning' ? <AlertCircle className="h-5 w-5" /> :
               <Clock className="h-5 w-5" />;

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

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  exams: Exam[];
  dayProgress: DayProgress;
  onUpdateProgress: (examId: string, actualHours: number, hourStatuses?: Array<'studied' | 'skipped' | 'pending'>) => void;
  onRecoverHours: (examId: string, skippedHours: number) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  exams,
  dayProgress,
  onUpdateProgress,
  onRecoverHours
}) => {
  // Stato per tenere traccia delle ore studiate/saltate per ogni esame
  const [examHoursStatus, setExamHoursStatus] = useState<Record<string, Array<'studied' | 'skipped' | 'pending'>>>({});
  
  // Stato per tenere traccia delle ore extra aggiunte per ogni esame
  const [extraHours, setExtraHours] = useState<Record<string, number>>({});
  
  // Stato per le notifiche toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' | 'neutral' | 'studied' | 'skipped' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'neutral' | 'studied' | 'skipped') => {
    setToast({ message, type });
  };

  const hideToast = () => {
    setToast(null);
  };

  // Inizializza lo stato delle ore per ogni esame quando si apre il modale
  useEffect(() => {
    if (isOpen) {
      const initialStatus: Record<string, Array<'studied' | 'skipped' | 'pending'>> = {};
      const initialExtraHours: Record<string, number> = {};
      
      // Se ci sono esami, inizializza i loro stati
      if (dayProgress.exams && dayProgress.exams.length > 0) {
        dayProgress.exams.forEach(exam => {
          // Usa gli stati delle ore se disponibili, altrimenti crea un array con lo stato di ogni ora
          let hoursArray: Array<'studied' | 'skipped' | 'pending'>;
          const actualHours = exam.actualHours || 0;
          const plannedHours = exam.plannedHours;
          const studiedHours = Math.min(actualHours, plannedHours);
          
          if (exam.hourStatuses && exam.hourStatuses.length > 0) {
            // Usa gli stati salvati
            hoursArray = [...exam.hourStatuses];
          } else {
            // Crea un array con lo stato di ogni ora
            hoursArray = Array(Math.ceil(plannedHours)).fill('pending');
            
            // Imposta le ore già studiate come 'studied'
            for (let i = 0; i < Math.floor(studiedHours); i++) {
              hoursArray[i] = 'studied';
            }
          }
          
          initialStatus[exam.examId] = hoursArray;
          // Le ore extra sono quelle che superano le ore pianificate
          if (actualHours > plannedHours) {
            initialExtraHours[exam.examId] = actualHours - plannedHours;
          } else {
            initialExtraHours[exam.examId] = 0;
          }

          console.log('Initializing exam hours:', {
            examId: exam.examId,
            actualHours,
            plannedHours,
            studiedHours,
            extraHours: initialExtraHours[exam.examId],
            hoursArray
          });
        });
      }
      
      // Imposta sempre gli stati, anche se vuoti
      setExamHoursStatus(initialStatus);
      setExtraHours(initialExtraHours);

      console.log('Final initialization state:', {
        examHoursStatus: initialStatus,
        extraHours: initialExtraHours
      });
    }
  }, [isOpen, dayProgress]);

  console.log('DayDetailModal render check:', { isOpen, date, dayProgress });
  
  if (!isOpen || !date) {
    console.log('DayDetailModal not rendering - isOpen:', isOpen, 'date:', date);
    return null;
  }
  
  console.log('DayDetailModal rendering for date:', date);

  const selectedDate = new Date(date);
  const formattedDate = formatDate(selectedDate);

  // Usa direttamente i dati di progresso dal dayProgress
  const examsToShow = dayProgress.exams;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Riepilogo del {formattedDate}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {examsToShow.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Nessun esame programmato per questa data</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                {examsToShow.length} {examsToShow.length === 1 ? 'esame' : 'esami'} in programma
              </p>
              
              {examsToShow.map((examProgress) => {
                const exam = exams.find(e => e.id === examProgress.examId);
                if (!exam) return null;
                
                const isStartDate = date === exam.startDate;
                const isEndDate = date === exam.examDate;

                return (
                  <div 
                    key={exam.id} 
                    className="border rounded-xl p-6 bg-gray-50 hover:bg-white transition-all duration-300"
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
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Ore previste</p>
                          <p className="text-xl font-semibold text-gray-900">{examProgress.plannedHours.toFixed(1)}h</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm text-gray-600">Ore studiate</p>
                          <p className="text-xl font-semibold text-gray-900">{examProgress.actualHours.toFixed(1)}h</p>
                        </div>
                      </div>

                      {examProgress.plannedHours > 0 && (
                        <div className="space-y-4">
                          <p className="text-sm font-medium text-gray-700">Dettaglio ore di studio:</p>
                          
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 mb-12">
                            {/* Ore pianificate */}
                            {examHoursStatus[examProgress.examId]?.map((status, hourIndex) => (
                              <div key={`${examProgress.examId}-${hourIndex}`} className="relative">
                                <div 
                                  className={`
                                    w-14 h-14 rounded-lg flex items-center justify-center shadow-sm border-2
                                    ${status === 'studied' ? 'bg-green-100 border-green-500 text-green-700' : 
                                      status === 'skipped' ? 'bg-red-100 border-red-500 text-red-700' : 
                                      'bg-gray-100 border-gray-300 text-gray-500'}
                                  `}
                                >
                                  <span className="text-lg font-medium">{hourIndex + 1}</span>
                                  {status === 'studied' && <Check className="absolute -top-1 -right-1 h-5 w-5 text-green-600" />}
                                  {status === 'skipped' && <XIcon className="absolute -top-1 -right-1 h-5 w-5 text-red-600" />}
                                </div>
                                
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-center space-x-2">
                                  <button 
                                    onClick={() => {
                                      // Verifica che lo stato sia inizializzato
                                      if (!examHoursStatus[examProgress.examId]) return;
                                      
                                      // Verifica se ci sono ore extra
                                      const hasExtraHours = (extraHours[examProgress.examId] || 0) > 0;
                                      
                                      // Non permettere di impostare ore come saltate se ci sono ore extra
                                      if (hasExtraHours) {
                                        showToast('Rimuovi prima le ore extra per poter segnare le ore come saltate', 'warning');
                                        return;
                                      }
                                      
                                      // Crea una copia dello stato attuale
                                      const newStatus = { ...examHoursStatus };
                                      newStatus[examProgress.examId] = [...examHoursStatus[examProgress.examId]];
                                      
                                      // Toggle dello stato dell'ora
                                      const currentStatus = newStatus[examProgress.examId][hourIndex];
                                      if (currentStatus === 'studied') {
                                        newStatus[examProgress.examId][hourIndex] = 'pending';
                                        showToast(`Ora ${hourIndex + 1} ripristinata a pending`, 'neutral');
                                      } else {
                                        newStatus[examProgress.examId][hourIndex] = 'studied';
                                        showToast(`Ora ${hourIndex + 1} segnata come studiata`, 'studied');
                                      }
                                      
                                      console.log('Before updating status:', {
                                        currentStatus: examHoursStatus[examProgress.examId],
                                        newStatus: newStatus[examProgress.examId],
                                        extraHours: extraHours[examProgress.examId]
                                      });

                                      // Aggiorna lo stato
                                      setExamHoursStatus(newStatus);
                                      
                                      // Calcola le ore studiate totali (incluse le extra)
                                      const studiedHours = newStatus[examProgress.examId].filter(s => s === 'studied').length + (extraHours[examProgress.examId] || 0);
                                      
                                      console.log('Updating progress:', {
                                        examId: examProgress.examId,
                                        studiedHours,
                                        extraHours: extraHours[examProgress.examId]
                                      });

                                      // Aggiorna il progresso
                                      onUpdateProgress(examProgress.examId, studiedHours, newStatus[examProgress.examId]);
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'studied' ? 'bg-green-500' : 'bg-gray-200 hover:bg-green-200'}`}
                                    title="Segna come studiata"
                                  >
                                    <Check className="h-4 w-4 text-white" />
                                  </button>
                                  
                                  <button 
                                    onClick={() => {
                                      // Verifica che lo stato sia inizializzato
                                      if (!examHoursStatus[examProgress.examId]) return;
                                      
                                      // Verifica se ci sono ore extra
                                      const hasExtraHours = (extraHours[examProgress.examId] || 0) > 0;
                                      
                                      // Non permettere di impostare ore come saltate se ci sono ore extra
                                      if (hasExtraHours) {
                                        showToast('Rimuovi prima le ore extra per poter segnare le ore come saltate', 'warning');
                                        return;
                                      }
                                      
                                      // Crea una copia dello stato attuale
                                      const newStatus = { ...examHoursStatus };
                                      newStatus[examProgress.examId] = [...examHoursStatus[examProgress.examId]];
                                      
                                      // Toggle dello stato dell'ora
                                      const currentStatus = newStatus[examProgress.examId][hourIndex];
                                      if (currentStatus === 'skipped') {
                                        newStatus[examProgress.examId][hourIndex] = 'pending';
                                        showToast(`Ora ${hourIndex + 1} ripristinata a pending`, 'neutral');
                                        console.log('Ora ripristinata a pending');
                                      } else {
                                        newStatus[examProgress.examId][hourIndex] = 'skipped';
                                        showToast(`Ora ${hourIndex + 1} segnata come saltata`, 'skipped');
                                        console.log('Ora segnata come saltata');
                                      }
                                      
                                      // Aggiorna lo stato
                                      setExamHoursStatus(newStatus);
                                      
                                      // Calcola le ore studiate totali (incluse le ore extra)
                                      const studiedHoursFromPlanned = newStatus[examProgress.examId].filter(s => s === 'studied').length;
                                      const skippedHours = newStatus[examProgress.examId].filter(s => s === 'skipped').length;
                                      const totalStudiedHours = studiedHoursFromPlanned + (extraHours[examProgress.examId] || 0);
                                      
                                      console.log('Skipping hour:', {
                                        examId: examProgress.examId,
                                        hourIndex,
                                        studiedHoursFromPlanned,
                                        extraHours: extraHours[examProgress.examId] || 0,
                                        totalStudiedHours,
                                        skippedHours,
                                        newStatus: newStatus[examProgress.examId]
                                      });
                                      
                                      // Aggiorna il progresso e notifica le ore saltate
                                      onUpdateProgress(examProgress.examId, totalStudiedHours, newStatus[examProgress.examId]);
                                      onRecoverHours(examProgress.examId, skippedHours);
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center ${status === 'skipped' ? 'bg-red-500' : 'bg-gray-200 hover:bg-red-200'}`}
                                    title="Segna come saltata"
                                  >
                                    <XIcon className="h-4 w-4 text-white" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Ore extra */}
                            {Array.from({ length: extraHours[examProgress.examId] || 0 }).map((_, index) => (
                              <div key={`extra-${examProgress.examId}-${index}`} className="relative">
                                <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-sm border-2 bg-blue-100 border-blue-500 text-blue-700">
                                  <Plus className="h-6 w-6" />
                                </div>
                                <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                                  <span className="text-xs text-blue-600 font-medium">Extra</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="mt-6 pt-4 border-t">
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-green-50 p-3 rounded-lg text-center">
                                <p className="text-sm text-gray-600">Ore studiate</p>
                                <p className="text-xl font-semibold text-green-700">{(examHoursStatus[examProgress.examId]?.filter(s => s === 'studied').length || 0) + (extraHours[examProgress.examId] || 0)}h</p>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg text-center">
                                <p className="text-sm text-gray-600">Ore saltate</p>
                                <p className="text-xl font-semibold text-red-700">{examHoursStatus[examProgress.examId]?.filter(s => s === 'skipped').length || 0}h</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <p className="text-sm text-gray-600">Ore in sospeso</p>
                                <p className="text-xl font-semibold text-gray-700">{examHoursStatus[examProgress.examId]?.filter(s => s === 'pending').length || 0}h</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                              <p className="text-sm font-medium text-gray-700">Gestione ore extra:</p>
                              <div className="flex items-center space-x-2">
                                <button 
                          onClick={() => {
                            // Verifica che lo stato sia inizializzato
                            if (!examHoursStatus[examProgress.examId]) {
                              // Inizializza lo stato se non esiste
                              const initialStatus = Array(Math.ceil(examProgress.plannedHours)).fill('pending');
                              setExamHoursStatus({
                                ...examHoursStatus,
                                [examProgress.examId]: initialStatus
                              });
                              return;
                            }
                            
                            // Verifica se ci sono ore saltate
                            const skippedHours = examHoursStatus[examProgress.examId].filter(s => s === 'skipped').length;
                            if (skippedHours > 0) {
                              showToast('Non puoi aggiungere ore extra se ci sono già ore saltate. Recupera prima le ore saltate.', 'warning');
                              return;
                            }
                            
                            // Calcola le ore studiate attuali (solo le ore pianificate)
                            const currentStudiedHours = examHoursStatus[examProgress.examId].filter(s => s === 'studied').length;
                            
                            // Calcola le nuove ore extra
                            const currentExtraHours = extraHours[examProgress.examId] || 0;
                            const newExtraHours = { ...extraHours };
                            newExtraHours[examProgress.examId] = currentExtraHours + 1;
                            
                            // Aggiorna lo stato delle ore extra
                            setExtraHours(newExtraHours);
                            
                            // Mostra notifica toast
                            showToast(`Aggiunta 1 ora extra (totale: ${newExtraHours[examProgress.examId]})`, 'success');
                            
                            // Calcola il totale delle ore studiate (pianificate + extra)
                            const totalStudiedHours = currentStudiedHours + newExtraHours[examProgress.examId];
                            
                            console.log('Adding extra hour:', {
                              examId: examProgress.examId,
                              currentStudiedHours,
                              currentExtraHours,
                              newExtraHours: newExtraHours[examProgress.examId],
                              totalStudiedHours,
                              examHoursStatus: examHoursStatus[examProgress.examId],
                              allExtraHours: newExtraHours
                            });
                            
                            // Aggiorna il progresso
                            onUpdateProgress(examProgress.examId, totalStudiedHours, examHoursStatus[examProgress.examId]);
                          }}
                                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg flex items-center space-x-1 transition-colors"
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Aggiungi ora</span>
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    // Verifica che ci siano ore extra da rimuovere
                                    if (!examHoursStatus[examProgress.examId]) {
                                      // Inizializza lo stato se non esiste
                                      const initialStatus = Array(Math.ceil(examProgress.plannedHours)).fill('pending');
                                      setExamHoursStatus({
                                        ...examHoursStatus,
                                        [examProgress.examId]: initialStatus
                                      });
                                      return;
                                    }

                                    if (!extraHours[examProgress.examId] || extraHours[examProgress.examId] <= 0) return;
                                    
                                    // Calcola le ore studiate attuali (solo le ore pianificate)
                                    const currentStudiedHours = examHoursStatus[examProgress.examId].filter(s => s === 'studied').length;
                                    
                                    // Calcola le nuove ore extra
                                    const currentExtraHours = extraHours[examProgress.examId];
                                    const newExtraHours = { ...extraHours };
                                    newExtraHours[examProgress.examId] = Math.max(0, currentExtraHours - 1);
                                    
                                    // Aggiorna lo stato delle ore extra
                                    setExtraHours(newExtraHours);
                                    
                                    // Calcola il totale delle ore studiate (pianificate + extra)
                                    const totalStudiedHours = currentStudiedHours + newExtraHours[examProgress.examId];
                                    
                                    console.log('Removing extra hour:', {
                                      examId: examProgress.examId,
                                      currentStudiedHours,
                                      currentExtraHours,
                                      newExtraHours: newExtraHours[examProgress.examId],
                                      totalStudiedHours,
                                      examHoursStatus: examHoursStatus[examProgress.examId],
                                      allExtraHours: newExtraHours
                                    });
                                    
                                    // Aggiorna il progresso
                                    onUpdateProgress(examProgress.examId, totalStudiedHours, examHoursStatus[examProgress.examId]);
                                  }}
                                  disabled={!extraHours[examProgress.examId] || extraHours[examProgress.examId] <= 0}
                                  className={`px-3 py-2 ${extraHours[examProgress.examId] && extraHours[examProgress.examId] > 0 ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} rounded-lg flex items-center space-x-1 transition-colors`}
                                >
                                  <XIcon className="h-4 w-4" />
                                  <span>Rimuovi ora</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </button>
        </div>
        
        {/* Toast notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </div>
    </div>
  );
};