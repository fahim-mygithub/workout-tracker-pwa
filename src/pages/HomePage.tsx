import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TrendingUp, Dumbbell, Clock, ChevronLeft, ChevronRight, Plus, CheckCircle, Activity, Award, Flame } from 'lucide-react';
import type { RootState } from '../store/index';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const activeWorkout = useSelector((state: RootState) => state.workout.activeWorkout);
  const workoutHistory = useSelector((state: RootState) => state.workout.workoutHistory);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showStartWorkout, setShowStartWorkout] = useState(false);

  // Dummy data for demonstration
  const workoutData = {
    streak: 5,
    weeklyGoal: 7,
    weeklyCompleted: 1,
    personalBest: 225,
    recentWorkouts: [
      { id: 1, name: 'Upper Body Strength', duration: 39, exercises: 10, date: new Date(2025, 5, 19), completed: true },
      { id: 2, name: 'Lower Body Power', duration: 59, exercises: 12, date: new Date(2025, 5, 18), completed: true },
      { id: 3, name: 'Morning Yoga', duration: 30, exercises: 8, date: new Date(2025, 5, 17), completed: true },
      { id: 4, name: 'HIIT Cardio', duration: 25, exercises: 6, date: new Date(2025, 5, 16), completed: true },
    ],
    todayActivities: [
      { id: 1, name: 'Morning Walking', time: '06:00 AM - 07:00 AM', type: 'cardio', completed: true },
      { id: 2, name: 'Morning Yoga', time: '07:00 AM - 08:00 AM', type: 'flexibility', completed: true },
      { id: 3, name: 'Breakfast', time: '08:30 AM - 09:00 AM', type: 'nutrition', completed: true },
      { id: 4, name: 'Swimming Lesson', time: '09:00 AM - 11:00 AM', type: 'cardio', completed: false },
    ],
    heartRate: [104, 108, 112, 106, 110, 115, 118, 112, 108, 104],
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];
    
    // Add padding days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    // Add all days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const hasWorkout = (date: Date | null) => {
    if (!date) return false;
    return workoutData.recentWorkouts.some(w => 
      w.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleStartWorkout = () => {
    navigate('/workout');
  };

  const handleBuildWorkout = () => {
    navigate('/build');
  };

  return (
    <div className="flex flex-col bg-gray-50">
      {/* App Title Section */}
      <div className="bg-black text-white px-4 py-6">
        <h1 className="text-2xl font-bold">Workout Tracker</h1>
        <p className="text-sm text-gray-400 mt-1">Natural language: "5x5 Bench ss 3x10 pushups"</p>
      </div>

      {/* Calendar Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
            {getMonthDays(currentDate).map((date, index) => (
              <button
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-sm transition-all
                  ${!date ? 'invisible' : ''}
                  ${isToday(date) ? 'bg-black text-white font-bold' : ''}
                  ${hasWorkout(date) && !isToday(date) ? 'bg-gray-200 text-black font-medium' : ''}
                  ${!isToday(date) && !hasWorkout(date) && date ? 'hover:bg-gray-100 text-gray-700' : ''}
                  ${selectedDate?.toDateString() === date?.toDateString() ? 'ring-2 ring-black' : ''}
                `}
                disabled={!date}
              >
                {date?.getDate()}
              </button>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">{formatDate(selectedDate)}</p>
              {hasWorkout(selectedDate) ? (
                <p className="text-xs text-gray-600 mt-1">✓ Workout completed</p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">No workout recorded yet</p>
              )}
            </div>
            <button 
              onClick={handleStartWorkout}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Start Workout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Weekly Progress */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium">Weekly Progress</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{workoutData.weeklyCompleted}/{workoutData.weeklyGoal}</p>
            <p className="text-xs text-gray-500">workouts this week</p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-black h-2 rounded-full transition-all duration-500"
                style={{width: `${(workoutData.weeklyCompleted / workoutData.weeklyGoal) * 100}%`}}
              />
            </div>
          </div>

          {/* Current Streak */}
          <div className="bg-black text-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-gray-300 text-xs font-medium">Current Streak</h3>
            <p className="text-2xl font-bold mt-1">{workoutData.streak} days</p>
            <p className="text-xs text-gray-300">Keep it going! 🔥</p>
            <div className="mt-3 flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-5 w-5 rounded ${i < workoutData.streak ? 'bg-white' : 'bg-gray-700'}`} />
              ))}
            </div>
          </div>

          {/* Personal Best */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium">Personal Best</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{workoutData.personalBest} lbs</p>
            <p className="text-xs text-gray-500">Heaviest lift</p>
            <p className="text-xs text-gray-400 mt-2">Achieved last week</p>
          </div>

          {/* Heart Rate */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium">Heart Rate</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">104 bpm</p>
            <div className="mt-3 flex items-end gap-1">
              {workoutData.heartRate.map((rate, i) => (
                <div key={i} className="flex-1 bg-gray-300 rounded" style={{height: `${(rate - 100) * 2}px`}} />
              ))}
            </div>
          </div>
        </div>

        {/* Today's Activities */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Today's Activities</h2>
            <button 
              onClick={() => setShowStartWorkout(true)}
              className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Activity</span>
            </button>
          </div>
          <div className="space-y-3">
            {workoutData.todayActivities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.completed ? 'bg-black' : 'bg-gray-300'
                  }`}>
                    {activity.completed ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Clock className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{activity.name}</h3>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  activity.type === 'cardio' ? 'bg-gray-200 text-gray-700' :
                  activity.type === 'flexibility' ? 'bg-gray-300 text-gray-800' :
                  activity.type === 'nutrition' ? 'bg-gray-100 text-gray-600' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {workoutData.recentWorkouts.map(workout => (
              <div key={workout.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Dumbbell className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{workout.name}</h3>
                      <p className="text-xs text-gray-500">
                        {workout.date.toLocaleDateString()} • {workout.exercises} exercises
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 text-sm">{workout.duration} min</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={handleStartWorkout}
            className="bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition-colors font-medium"
          >
            Start Workout
          </button>
          <button 
            onClick={handleBuildWorkout}
            className="bg-gray-200 text-gray-900 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Build Workout
          </button>
        </div>
      </main>

      {/* Start Workout Modal */}
      {showStartWorkout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to start?</h3>
            <p className="text-gray-600 mb-4 text-sm">Track your workout progress and stay motivated!</p>
            <div className="space-y-2">
              <button 
                onClick={handleStartWorkout}
                className="w-full bg-black text-white py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                Start New Workout
              </button>
              <button 
                onClick={handleBuildWorkout}
                className="w-full bg-gray-200 text-gray-900 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Browse Exercises
              </button>
              <button 
                onClick={() => setShowStartWorkout(false)}
                className="w-full text-gray-500 hover:text-gray-700 transition-colors text-sm mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};