import { jsPDF } from 'jspdf';
import type { UserProfile, WorkoutData, ExerciseHistory } from '../types';

class ExportService {
  /**
   * Export user data as CSV
   */
  async exportToCSV(
    profile: UserProfile,
    workouts: WorkoutData[],
    history: ExerciseHistory[]
  ): Promise<void> {
    try {
      // Create CSV content
      let csvContent = '';

      // User Profile Section
      csvContent += 'USER PROFILE\n';
      csvContent += 'Name,Email,Birthday,Gender,Experience Level,Height,Weight\n';
      csvContent += `"${profile.displayName}","${profile.email}","${profile.birthday || ''}","${profile.gender || ''}","${profile.experienceLevel || ''}","${profile.height || ''}${profile.heightUnit}","${profile.weight || ''}${profile.weightUnit}"\n\n`;

      // Workouts Section
      csvContent += 'SAVED WORKOUTS\n';
      csvContent += 'Workout Name,Description,Category,Tags,Exercises Count,Created Date\n';
      workouts.forEach(workout => {
        csvContent += `"${workout.name}","${workout.description || ''}","${workout.category || ''}","${workout.tags.join(', ')}","${workout.exercises.length}","${new Date(workout.createdAt).toLocaleDateString()}"\n`;
      });
      csvContent += '\n';

      // Exercise History Section
      csvContent += 'EXERCISE HISTORY\n';
      csvContent += 'Date,Exercise,Workout,Sets,Total Reps,Total Weight (kg),Total Volume (kg),Notes\n';
      history.forEach(entry => {
        const completedSets = entry.sets.filter(s => s.completed);
        const totalReps = completedSets.reduce((sum, set) => sum + (set.actualReps || 0), 0);
        const totalWeight = completedSets.reduce((sum, set) => sum + (set.actualWeight || 0), 0);
        const totalVolume = completedSets.reduce((sum, set) => sum + ((set.actualWeight || 0) * (set.actualReps || 0)), 0);
        
        csvContent += `"${new Date(entry.performedAt).toLocaleDateString()}","${entry.exerciseName}","${entry.workoutName || ''}","${completedSets.length}","${totalReps}","${totalWeight}","${totalVolume}","${entry.notes || ''}"\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `workout-data-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Export user data as PDF
   */
  async exportToPDF(
    profile: UserProfile,
    workouts: WorkoutData[],
    history: ExerciseHistory[],
    stats?: {
      personalRecords?: Record<string, {
        maxWeight?: { weight: number; reps: number; date: Date };
        maxReps?: { weight: number; reps: number; date: Date };
        maxVolume?: { volume: number; sets: number; date: Date };
      }>;
    }
  ): Promise<void> {
    try {
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text('Workout Progress Report', 105, yPosition, { align: 'center' });
      yPosition += 15;

      // Date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, yPosition, { align: 'center' });
      yPosition += 20;

      // User Profile Section
      pdf.setFontSize(16);
      pdf.text('User Profile', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.text(`Name: ${profile.displayName}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Email: ${profile.email}`, 20, yPosition);
      yPosition += 7;
      
      if (profile.birthday) {
        const age = this.calculateAge(new Date(profile.birthday));
        pdf.text(`Age: ${age} years`, 20, yPosition);
        yPosition += 7;
      }

      if (profile.height && profile.weight) {
        pdf.text(`Height: ${profile.height}${profile.heightUnit}`, 20, yPosition);
        yPosition += 7;
        pdf.text(`Weight: ${profile.weight}${profile.weightUnit}`, 20, yPosition);
        yPosition += 7;
        
        // Calculate BMI
        const heightInCm = profile.heightUnit === 'ft' ? 0 : profile.height; // TODO: Convert ft to cm
        const weightInKg = profile.weightUnit === 'lbs' ? profile.weight * 0.453592 : profile.weight;
        const bmi = weightInKg / Math.pow(heightInCm / 100, 2);
        pdf.text(`BMI: ${bmi.toFixed(1)}`, 20, yPosition);
        yPosition += 7;
      }

      pdf.text(`Experience: ${profile.experienceLevel || 'Not specified'}`, 20, yPosition);
      yPosition += 15;

      // Workout Summary Section
      pdf.setFontSize(16);
      pdf.text('Workout Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.text(`Total Saved Workouts: ${workouts.length}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Total Exercise Sessions: ${history.length}`, 20, yPosition);
      yPosition += 15;

      // Recent Workouts
      pdf.setFontSize(14);
      pdf.text('Recent Workouts', 20, yPosition);
      yPosition += 10;

      const recentWorkouts = workouts.slice(0, 5);
      pdf.setFontSize(11);
      recentWorkouts.forEach(workout => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.text(`• ${workout.name}`, 25, yPosition);
        yPosition += 6;
        pdf.setFontSize(10);
        pdf.text(`  ${workout.exercises.length} exercises | ${workout.tags.join(', ')}`, 30, yPosition);
        yPosition += 8;
        pdf.setFontSize(11);
      });

      yPosition += 10;

      // Exercise History Summary
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('Exercise Progress Summary', 20, yPosition);
      yPosition += 10;

      // Group history by exercise
      const exerciseGroups = this.groupHistoryByExercise(history);
      const topExercises = Object.entries(exerciseGroups)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);

      pdf.setFontSize(11);
      topExercises.forEach(([exerciseName, entries]) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        const totalSets = entries.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0);
        const lastPerformed = new Date(Math.max(...entries.map(e => new Date(e.performedAt).getTime())));
        
        pdf.text(`• ${exerciseName}`, 25, yPosition);
        yPosition += 6;
        pdf.setFontSize(10);
        pdf.text(`  Performed ${entries.length} times | ${totalSets} total sets | Last: ${lastPerformed.toLocaleDateString()}`, 30, yPosition);
        yPosition += 8;
        pdf.setFontSize(11);
      });

      // Personal Records Section
      if (stats && stats.personalRecords) {
        if (yPosition > 200) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text('Personal Records', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(11);
        Object.entries(stats.personalRecords).forEach(([exercise, records]: [string, any]) => {
          if (yPosition > 240) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.text(`${exercise}:`, 25, yPosition);
          yPosition += 6;
          pdf.setFontSize(10);
          
          if (records.maxWeight) {
            pdf.text(`  Max Weight: ${records.maxWeight.weight}kg × ${records.maxWeight.reps} reps`, 30, yPosition);
            yPosition += 5;
          }
          if (records.maxReps) {
            pdf.text(`  Max Reps: ${records.maxReps.reps} @ ${records.maxReps.weight}kg`, 30, yPosition);
            yPosition += 5;
          }
          yPosition += 3;
          pdf.setFontSize(11);
        });
      }

      // Save PDF
      pdf.save(`workout-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }

  /**
   * Export specific workout as PDF
   */
  async exportWorkoutToPDF(workout: WorkoutData): Promise<void> {
    try {
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(18);
      pdf.text(workout.name, 105, yPosition, { align: 'center' });
      yPosition += 10;

      // Description
      if (workout.description) {
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(workout.description, 170);
        lines.forEach((line: string) => {
          pdf.text(line, 105, yPosition, { align: 'center' });
          yPosition += 6;
        });
      }
      yPosition += 10;

      // Metadata
      pdf.setFontSize(10);
      pdf.text(`Category: ${workout.category || 'General'}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Tags: ${workout.tags.join(', ')}`, 20, yPosition);
      yPosition += 15;

      // Exercises
      pdf.setFontSize(14);
      pdf.text('Exercises', 20, yPosition);
      yPosition += 10;

      workout.exercises.forEach((exercise, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.text(`${index + 1}. ${exercise.exerciseName}`, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        exercise.sets.forEach((set, setIndex) => {
          let setText = `   Set ${setIndex + 1}: `;
          
          if (set.targetReps) setText += `${set.targetReps} reps`;
          if (set.targetWeight) setText += ` @ ${set.targetWeight}kg`;
          if (set.targetTime) setText += ` ${set.targetTime}s`;
          if (set.rpe) setText += ` RPE ${set.rpe}`;
          
          pdf.text(setText, 25, yPosition);
          yPosition += 6;
        });

        if (exercise.notes) {
          pdf.setFontSize(9);
          pdf.text(`   Notes: ${exercise.notes}`, 25, yPosition);
          yPosition += 6;
        }

        yPosition += 5;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });

      // Save PDF
      pdf.save(`workout-${workout.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error exporting workout to PDF:', error);
      throw error;
    }
  }

  /**
   * Helper: Calculate age from birthday
   */
  private calculateAge(birthday: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Helper: Group history by exercise
   */
  private groupHistoryByExercise(history: ExerciseHistory[]): Record<string, ExerciseHistory[]> {
    return history.reduce((groups, entry) => {
      const exerciseName = entry.exerciseName;
      if (!groups[exerciseName]) {
        groups[exerciseName] = [];
      }
      groups[exerciseName].push(entry);
      return groups;
    }, {} as Record<string, ExerciseHistory[]>);
  }
}

export const exportService = new ExportService();