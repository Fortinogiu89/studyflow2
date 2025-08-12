import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Exam } from '../types/exam';

interface ExamFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (examData: Omit<Exam, 'id' | 'completed' | 'totalHoursNeeded' | 'daysNeeded' | 'startDate'>) => void;
  onDelete?: (examId: string) => void;
  exam?: Exam | null;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
];

export const ExamForm: React.FC<ExamFormProps> = ({ isOpen, onClose, onSubmit, onDelete, exam }) => {
  const [formData, setFormData] = useState(() => ({
    name: '',
    credits: 6,
    examDate: '',
    difficulty: 'medium' as const,
    weeklyHours: {} as Record<string, number>,
  }));

  // Aggiorniamo i dati del form quando cambia l'esame
  React.useEffect(() => {
    if (exam) {
      setFormData({
        name: exam.name,
        credits: exam.credits,
        examDate: exam.examDate,
        difficulty: exam.difficulty,
        weeklyHours: exam.weeklyHours,
      });
    } else {
      setFormData({
        name: '',
        credits: 6,
        examDate: '',
        difficulty: 'medium',
        weeklyHours: {},
      });
    }
  }, [exam]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit(formData);
      onClose();
      if (!exam) {
        setFormData({
          name: '',
          credits: 6,
          examDate: '',
          difficulty: 'medium',
          weeklyHours: {},
        });
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Si è verificato un errore durante il salvataggio dell\'esame');
    }
  };

  const handleDelete = () => {
    if (exam && onDelete) {
      onDelete(exam.id);
      onClose();
    }
  };

  const updateWeeklyHours = (day: string, hours: number) => {
    setFormData(prev => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: hours || 0,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {exam ? 'Modifica Esame' : 'Nuovo Esame'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="p-6 space-y-4">
            <p className="text-gray-700">Sei sicuro di voler eliminare questo esame? Questa azione non può essere annullata.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Elimina
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Esame
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="es. Fisica I"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CFU
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="30"
                  value={formData.credits}
                  onChange={(e) => setFormData(prev => ({ ...prev, credits: parseInt(e.target.value) || 6 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Esame
                </label>
                <input
                  type="date"
                  required
                  value={formData.examDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, examDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficoltà
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'low' | 'medium' | 'high' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="low">Bassa (-20%)</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta (+20%)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Ore di Studio Settimanali
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.key} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <span className="text-sm font-medium text-gray-700">{day.label}</span>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={formData.weeklyHours[day.key] || ''}
                      onChange={(e) => updateWeeklyHours(day.key, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Lascia vuoto o 0 per i giorni in cui non vuoi studiare questo esame
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              {exam && onDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Elimina
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {exam ? 'Aggiorna' : 'Aggiungi'} Esame
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};