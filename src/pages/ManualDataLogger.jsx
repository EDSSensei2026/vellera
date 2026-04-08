import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Dumbbell, Moon, Apple, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ManualDataLogger() {
  const [activeTab, setActiveTab] = useState('workout');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // Workout form state
  const [workoutForm, setWorkoutForm] = useState({
    date: new Date().toISOString().split('T')[0],
    session_type: 'S&C Strength',
    duration_minutes: 60,
    intensity: 6,
    session_notes: '',
  });

  // Sleep form state
  const [sleepForm, setSleepForm] = useState({
    log_date: new Date().toISOString().split('T')[0],
    sleep_hours: 8,
    sleep_quality: 4,
    notes: '',
  });

  // Nutrition form state
  const [nutritionForm, setNutritionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    food_name: '',
    calories: 0,
    protein_grams: 0,
    carbs_grams: 0,
    fat_grams: 0,
  });

  const handleWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!workoutForm.session_type || workoutForm.duration_minutes <= 0) {
      toast.error('Fill in required workout fields');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.TrainingSession.create(workoutForm);
      toast.success('Workout logged!');
      setSubmitted('workout');
      setWorkoutForm({
        date: new Date().toISOString().split('T')[0],
        session_type: 'S&C Strength',
        duration_minutes: 60,
        intensity: 6,
        session_notes: '',
      });
      setTimeout(() => setSubmitted(null), 2000);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSleepSubmit = async (e) => {
    e.preventDefault();
    if (sleepForm.sleep_hours <= 0) {
      toast.error('Sleep hours must be greater than 0');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.WellnessLog.create({
        user_email: (await base44.auth.me())?.email,
        log_date: sleepForm.log_date,
        sleep_hours: sleepForm.sleep_hours,
        sleep_quality: sleepForm.sleep_quality,
        notes: sleepForm.notes,
      });
      toast.success('Sleep logged!');
      setSubmitted('sleep');
      setSleepForm({
        log_date: new Date().toISOString().split('T')[0],
        sleep_hours: 8,
        sleep_quality: 4,
        notes: '',
      });
      setTimeout(() => setSubmitted(null), 2000);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleNutritionSubmit = async (e) => {
    e.preventDefault();
    if (!nutritionForm.food_name) {
      toast.error('Food name is required');
      return;
    }
    setLoading(true);
    try {
      await base44.entities.FoodLog.create({
        user_email: (await base44.auth.me())?.email,
        date: nutritionForm.date,
        meal_type: nutritionForm.meal_type,
        food_name: nutritionForm.food_name,
        calories: nutritionForm.calories,
        protein_grams: nutritionForm.protein_grams,
        carbs_grams: nutritionForm.carbs_grams,
        fat_grams: nutritionForm.fat_grams,
      });
      toast.success('Meal logged!');
      setSubmitted('nutrition');
      setNutritionForm({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        food_name: '',
        calories: 0,
        protein_grams: 0,
        carbs_grams: 0,
        fat_grams: 0,
      });
      setTimeout(() => setSubmitted(null), 2000);
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-commander-dark p-4 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Manual Data Logger</h1>
          <p className="text-gray-500 text-sm">Log workouts, sleep, and meals when wearables aren't available</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-commander-surface border border-commander-border rounded-xl p-1">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'workout'
                ? 'bg-vellera-blue text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-4 h-4" /> Workout
          </button>
          <button
            onClick={() => setActiveTab('sleep')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'sleep'
                ? 'bg-vellera-blue text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Moon className="w-4 h-4" /> Sleep
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'nutrition'
                ? 'bg-vellera-blue text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" /> Nutrition
          </button>
        </div>

        {/* Workout Form */}
        {activeTab === 'workout' && (
          <form onSubmit={handleWorkoutSubmit} className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Log Workout Session</h2>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={workoutForm.date}
                onChange={(e) => setWorkoutForm({ ...workoutForm, date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Session Type</label>
              <select
                value={workoutForm.session_type}
                onChange={(e) => setWorkoutForm({ ...workoutForm, session_type: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
              >
                <option>S&C Strength</option>
                <option>S&C Zone2</option>
                <option>BJJ/Grappling</option>
                <option>Striking/MMA</option>
                <option>Home Mobility</option>
                <option>Yoga</option>
                <option>Meditation</option>
                <option>Cardio</option>
                <option>Other</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  value={workoutForm.duration_minutes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, duration_minutes: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Intensity (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={workoutForm.intensity}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, intensity: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Notes (optional)</label>
              <textarea
                value={workoutForm.session_notes}
                onChange={(e) => setWorkoutForm({ ...workoutForm, session_notes: e.target.value })}
                placeholder="How did you feel? What did you work on?"
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                submitted === 'workout'
                  ? 'bg-vellera-green text-black'
                  : 'bg-vellera-blue text-black hover:opacity-90'
              } disabled:opacity-50`}
            >
              {submitted === 'workout' ? (
                <>
                  <Check className="w-4 h-4" /> Logged!
                </>
              ) : (
                'Log Workout'
              )}
            </button>
          </form>
        )}

        {/* Sleep Form */}
        {activeTab === 'sleep' && (
          <form onSubmit={handleSleepSubmit} className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Log Sleep</h2>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={sleepForm.log_date}
                onChange={(e) => setSleepForm({ ...sleepForm, log_date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Hours Slept</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={sleepForm.sleep_hours}
                  onChange={(e) => setSleepForm({ ...sleepForm, sleep_hours: parseFloat(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Quality (1-5)</label>
                <select
                  value={sleepForm.sleep_quality}
                  onChange={(e) => setSleepForm({ ...sleepForm, sleep_quality: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                >
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Notes (optional)</label>
              <textarea
                value={sleepForm.notes}
                onChange={(e) => setSleepForm({ ...sleepForm, notes: e.target.value })}
                placeholder="Any observations? Wakeups? Sleep aids?"
                rows={3}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                submitted === 'sleep'
                  ? 'bg-vellera-green text-black'
                  : 'bg-vellera-blue text-black hover:opacity-90'
              } disabled:opacity-50`}
            >
              {submitted === 'sleep' ? (
                <>
                  <Check className="w-4 h-4" /> Logged!
                </>
              ) : (
                'Log Sleep'
              )}
            </button>
          </form>
        )}

        {/* Nutrition Form */}
        {activeTab === 'nutrition' && (
          <form onSubmit={handleNutritionSubmit} className="bg-commander-surface border border-commander-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Log Meal</h2>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Date</label>
              <input
                type="date"
                value={nutritionForm.date}
                onChange={(e) => setNutritionForm({ ...nutritionForm, date: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Meal Type</label>
              <select
                value={nutritionForm.meal_type}
                onChange={(e) => setNutritionForm({ ...nutritionForm, meal_type: e.target.value })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Food/Meal Name</label>
              <input
                type="text"
                value={nutritionForm.food_name}
                onChange={(e) => setNutritionForm({ ...nutritionForm, food_name: e.target.value })}
                placeholder="e.g., Chicken breast with rice"
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-vellera-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-300 mb-2">Calories</label>
              <input
                type="number"
                min="0"
                value={nutritionForm.calories}
                onChange={(e) => setNutritionForm({ ...nutritionForm, calories: parseInt(e.target.value) })}
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Protein (g)</label>
                <input
                  type="number"
                  min="0"
                  value={nutritionForm.protein_grams}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, protein_grams: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Carbs (g)</label>
                <input
                  type="number"
                  min="0"
                  value={nutritionForm.carbs_grams}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, carbs_grams: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Fat (g)</label>
                <input
                  type="number"
                  min="0"
                  value={nutritionForm.fat_grams}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, fat_grams: parseInt(e.target.value) })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-vellera-blue"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                submitted === 'nutrition'
                  ? 'bg-vellera-green text-black'
                  : 'bg-vellera-blue text-black hover:opacity-90'
              } disabled:opacity-50`}
            >
              {submitted === 'nutrition' ? (
                <>
                  <Check className="w-4 h-4" /> Logged!
                </>
              ) : (
                'Log Meal'
              )}
            </button>
          </form>
        )}

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-bold">Data is saved instantly</p>
            <p className="text-xs mt-1">All manual entries are synced to your profile and appear in your training analytics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}