import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Exam, DayProgress } from '../types/exam';
import { formatDate, formatDateForInput, getWeekDates, getDayOfWeek, isHoliday } from '../utils/examCalculations';

interface CalendarProps {
  exams: Exam[];
  getDayProgress: (date: string) => DayProgress;
  onDaySelect: (date: string) => void;
  selectedDate?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  exams, 
  getDayProgress, 
  onDaySelect, 
  selectedDate 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'month'>('week');

  const activeExams = exams.filter(exam => !exam.completed);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonth.getDate() - i));
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getDayInfo = (date: Date) => {
    const dateStr = formatDateForInput(date);
    const dayOfWeek = getDayOfWeek(date);
    const isToday = dateStr === formatDateForInput(new Date());
    const isSelected = dateStr === selectedDate;
    const holiday = isHoliday(date);
    
    const examStarts = activeExams.filter(exam => exam.startDate === dateStr);
    const examDays = activeExams.filter(exam => exam.examDate === dateStr);
    const studyDays = activeExams.filter(exam => {
      if (!exam.startDate || exam.completed) return false;
      const start = new Date(exam.startDate);
      const end = new Date(exam.examDate);
      return date >= start && date < end && exam.weeklyHours[dayOfWeek] > 0;
    });

    const progress = getDayProgress(dateStr);

    return {
      dateStr,
      isToday,
      isSelected,
      holiday,
      examStarts,
      examDays,
      studyDays,
      progress,
    };
  };

  const WeekView = () => {
    const weekDates = getWeekDates(currentDate);
    console.log('WeekView: Current dates:', weekDates.map(d => d.toISOString().split('T')[0]));
    console.log('WeekView: Selected date:', selectedDate);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Vista Settimanale</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-600 px-3">
              {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-7 gap-px bg-gray-200">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center hidden md:block">
              <div className="font-medium text-sm text-gray-700">{day}</div>
            </div>
          ))}
          
          {weekDates.map((date, index) => {
            const dayInfo = getDayInfo(date);
            const isDisabled = dayInfo.holiday;
            
            return (
              <div
                key={index}
                onClick={() => {
                  console.log('Day clicked:', dayInfo.dateStr);
                  console.log('Is disabled:', isDisabled);
                  if (!isDisabled) {
                    console.log('Calling onDaySelect with:', dayInfo.dateStr);
                    onDaySelect(dayInfo.dateStr);
                  }
                }}
                className={`bg-white p-3 min-h-[120px] ${isDisabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'} 
                  transition-all duration-300 relative 
                  ${dayInfo.isSelected ? 'ring-2 ring-blue-500 bg-blue-50 scale-105 shadow-lg z-10' : 
                    dayInfo.isToday ? 'bg-blue-50' : 'hover:bg-gray-50 hover:scale-102'}`}
              >
                <div className="flex flex-col h-full">
                  <div className={`text-sm font-medium mb-2 ${dayInfo.isToday ? 'text-blue-600' : dayInfo.holiday ? 'text-red-500' : 'text-gray-900'}`}>
                    <span className="md:hidden font-semibold">
                      {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'][index]} {date.getDate()}
                    </span>
                    <span className="hidden md:inline">
                      {date.getDate()}
                    </span>
                    {dayInfo.holiday && (
                      <span className="block text-xs text-red-500">Festivo</span>
                    )}
                  </div>
                  
                  {!isDisabled && (
                    <div className="space-y-1 flex-1">
                      {dayInfo.examDays.length > 0 && (
                        <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          📝 {dayInfo.examDays.length} {dayInfo.examDays.length === 1 ? 'Esame' : 'Esami'}
                        </div>
                      )}
                      
                      {dayInfo.examStarts.length > 0 && (
                        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          🚀 {dayInfo.examStarts.length} {dayInfo.examStarts.length === 1 ? 'Inizio' : 'Inizi'}
                        </div>
                      )}
                      
                      {dayInfo.studyDays.length > 0 && (
                        <div className="space-y-1">
                          {dayInfo.progress.exams.map((examProgress, examIndex) => {
                            const pendingHours = examProgress.plannedHours - (examProgress.actualHours || 0) - (examProgress.skippedHours || 0);
                            const extraHours = Math.max(0, (examProgress.actualHours || 0) - examProgress.plannedHours);
                            
                            return (
                              <div key={examIndex} className="bg-gray-50 p-2 rounded text-xs">
                                <div className="font-medium text-gray-900 mb-1 truncate" title={examProgress.examName}>
                                  {examProgress.examName}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {pendingHours > 0 && (
                                    <span className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs">
                                      ⏳ {pendingHours.toFixed(1)} {pendingHours === 1 ? 'ora in pending' : 'ore in pending'}
                                    </span>
                                  )}
                                  {(examProgress.skippedHours || 0) > 0 && (
                                    <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs">
                                      ❌ {examProgress.skippedHours!.toFixed(1)} {examProgress.skippedHours === 1 ? 'ora saltata' : 'ore saltate'}
                                    </span>
                                  )}
                                  {(examProgress.actualHours || 0) > 0 && (
                                    <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                      ✅ {Math.min(examProgress.actualHours!, examProgress.plannedHours).toFixed(1)} {Math.min(examProgress.actualHours!, examProgress.plannedHours) === 1 ? 'ora completata' : 'ore completate'}
                                    </span>
                                  )}
                                  {extraHours > 0 && (
                                    <span className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                                      ➕ {extraHours.toFixed(1)} {extraHours === 1 ? 'ora extra' : 'ore extra'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const MonthView = () => {
    const monthDays = getMonthDays(currentDate);
    const monthYear = currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900 capitalize">{monthYear}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
            <div key={day} className="bg-gray-50 p-3 text-center">
              <div className="font-medium text-sm text-gray-700">{day}</div>
            </div>
          ))}
          
          {monthDays.map((date, index) => {
            const dayInfo = getDayInfo(date);
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isDisabled = dayInfo.holiday;
            
            return (
              <div
                key={index}
                onClick={() => {
                  if (!isDisabled) {
                    onDaySelect(dayInfo.dateStr);
                    setView('week');
                    setCurrentDate(date);
                  }
                }}
                className={`bg-white p-2 min-h-[80px] ${isDisabled ? 'cursor-not-allowed bg-gray-100' : 'cursor-pointer'} transition-colors ${
                  !isCurrentMonth ? 'text-gray-400 bg-gray-50' :
                  dayInfo.isToday ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`text-sm font-medium mb-1 ${dayInfo.holiday ? 'text-red-500' : ''}`}>
                  {date.getDate()}
                  {dayInfo.holiday && (
                    <span className="block text-xs text-red-500">Festivo</span>
                  )}
                </div>
                <div className="space-y-1">
                  {isCurrentMonth && !isDisabled && (
                    <>
                      {dayInfo.examDays.length > 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      {dayInfo.examStarts.length > 0 && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                      {dayInfo.studyDays.length > 0 && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'week' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Settimana
        </button>
        <button
          onClick={() => setView('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            view === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Mese
        </button>
      </div>

      {view === 'week' ? <WeekView /> : <MonthView />}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Legenda</h4>
        
        {view === 'month' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Giorno Esame</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Inizio Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Giorno Studio</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border-2 border-blue-500 rounded-full"></div>
              <span>Oggi</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">⏳</span>
              <span>Ore Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">❌</span>
              <span>Ore Saltate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">✅</span>
              <span>Ore Studiate</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">➕</span>
              <span>Ore Extra</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
