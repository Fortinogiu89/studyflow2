import React from 'react';
import { TrendingUp, TrendingDown, Calendar, Clock } from 'lucide-react';
import { Exam, StudySession } from '../types/exam';

interface StatisticsProps {
  exams: Exam[];
  studySessions: StudySession[];
}

export const Statistics: React.FC<StatisticsProps> = ({ exams, studySessions }) => {
  const calculateWeeklyStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekAgo && sessionDate <= now;
    });

    const totalPlanned = weekSessions.reduce((sum, s) => sum + s.plannedHours, 0);
    const totalActual = weekSessions.reduce((sum, s) => sum + s.actualHours, 0);
    const completion = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return { totalPlanned, totalActual, completion, sessions: weekSessions.length };
  };

  const calculateMonthlyStats = () => {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const monthSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= monthAgo && sessionDate <= now;
    });

    const totalPlanned = monthSessions.reduce((sum, s) => sum + s.plannedHours, 0);
    const totalActual = monthSessions.reduce((sum, s) => sum + s.actualHours, 0);
    const completion = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    return { totalPlanned, totalActual, completion, sessions: monthSessions.length };
  };

  const getBestStudyDays = () => {
    const dayStats: Record<string, { planned: number; actual: number; sessions: number }> = {};
    
    studySessions.forEach(session => {
      const date = new Date(session.date);
      const dayName = date.toLocaleDateString('it-IT', { weekday: 'long' });
      
      if (!dayStats[dayName]) {
        dayStats[dayName] = { planned: 0, actual: 0, sessions: 0 };
      }
      
      dayStats[dayName].planned += session.plannedHours;
      dayStats[dayName].actual += session.actualHours;
      dayStats[dayName].sessions += 1;
    });

    return Object.entries(dayStats)
      .map(([day, stats]) => ({
        day,
        completion: stats.planned > 0 ? (stats.actual / stats.planned) * 100 : 0,
        averageHours: stats.sessions > 0 ? stats.actual / stats.sessions : 0,
        sessions: stats.sessions
      }))
      .sort((a, b) => b.completion - a.completion);
  };

  const weeklyStats = calculateWeeklyStats();
  const monthlyStats = calculateMonthlyStats();
  const bestDays = getBestStudyDays();

  return (
    <div className="space-y-6">
      {/* Period Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ultimi 7 giorni</h3>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Ore Previste</p>
              <p className="text-2xl font-bold text-gray-900">{weeklyStats.totalPlanned}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore Studiate</p>
              <p className="text-2xl font-bold text-green-600">{weeklyStats.totalActual}h</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Completamento</span>
              <span className={`font-medium ${
                weeklyStats.completion >= 80 ? 'text-green-600' :
                weeklyStats.completion >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {weeklyStats.completion.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  weeklyStats.completion >= 80 ? 'bg-green-500' :
                  weeklyStats.completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, weeklyStats.completion)}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            {weeklyStats.sessions} sessioni di studio
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Ultimi 30 giorni</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Ore Previste</p>
              <p className="text-2xl font-bold text-gray-900">{monthlyStats.totalPlanned}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ore Studiate</p>
              <p className="text-2xl font-bold text-green-600">{monthlyStats.totalActual}h</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Completamento</span>
              <span className={`font-medium ${
                monthlyStats.completion >= 80 ? 'text-green-600' :
                monthlyStats.completion >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {monthlyStats.completion.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  monthlyStats.completion >= 80 ? 'bg-green-500' :
                  monthlyStats.completion >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, monthlyStats.completion)}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            {monthlyStats.sessions} sessioni di studio
          </div>
        </div>
      </div>

      {/* Best Study Days */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Giorni di Massimo Rendimento</h3>
        
        {bestDays.length === 0 ? (
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Nessuna sessione di studio registrata ancora</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bestDays.slice(0, 5).map((day, index) => (
              <div key={day.day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{day.day}</p>
                    <p className="text-sm text-gray-600">
                      {day.sessions} sessioni • Media {day.averageHours.toFixed(1)}h
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    day.completion >= 80 ? 'text-green-600' :
                    day.completion >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {day.completion.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exam Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso Esami</h3>
        
        <div className="space-y-4">
          {exams.filter(exam => !exam.completed).map(exam => {
            const examSessions = studySessions.filter(s => s.examId === exam.id);
            const totalStudied = examSessions.reduce((sum, s) => sum + s.actualHours, 0);
            const progressPercentage = (totalStudied / exam.totalHoursNeeded) * 100;
            
            return (
              <div key={exam.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{exam.name}</h4>
                  <span className="text-sm text-gray-600">
                    {totalStudied}h / {exam.totalHoursNeeded}h
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, progressPercentage)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Esame: {exam.examDate}</span>
                  <span className={`font-medium ${
                    progressPercentage >= 80 ? 'text-green-600' :
                    progressPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {progressPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};