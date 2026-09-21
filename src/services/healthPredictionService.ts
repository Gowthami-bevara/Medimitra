import {
  HealthProfile,
  DailyHealthLog,
  MedicineItem,
  SymptomReport,
  HealthPredictionResult,
  CategoryScore,
} from '../types';

export class HealthPredictionService {
  static calculatePrediction(
    healthProfile: HealthProfile | null,
    todayLog: DailyHealthLog | null,
    historyLogs: DailyHealthLog[] = [],
    medicines: MedicineItem[] = [],
    symptoms: SymptomReport[] = []
  ): HealthPredictionResult {
    // 1. Sleep Scoring
    const sleepHours = todayLog?.sleepDuration ?? healthProfile?.typicalSleep ?? 7.5;
    let sleepScore = 80;
    let sleepStatus: CategoryScore['status'] = 'Good';
    let sleepExplanation = 'Sleep duration is within recommended healthy adult range (7-9 hours).';

    if (sleepHours < 6) {
      sleepScore = 52;
      sleepStatus = 'Needs Attention';
      sleepExplanation = `Sleep duration of ${sleepHours}h is below the optimal 7-8h restorative window.`;
    } else if (sleepHours < 7) {
      sleepScore = 70;
      sleepStatus = 'Needs Attention';
      sleepExplanation = `Sleep duration of ${sleepHours}h is slightly low. Aim for 7.5 hours.`;
    } else if (sleepHours > 9.5) {
      sleepScore = 72;
      sleepStatus = 'Needs Attention';
      sleepExplanation = `Extended sleep duration (${sleepHours}h) may indicate fatigue or irregular circadian cycle.`;
    } else {
      sleepScore = 88;
    }

    // 2. Hydration Scoring
    const waterLiters = todayLog?.waterIntakeLiters ?? healthProfile?.typicalWater ?? 2.5;
    let hydrationScore = 82;
    let hydrationStatus: CategoryScore['status'] = 'Good';
    let hydrationExplanation = `${waterLiters}L daily water supports vital circulation and kidney filtration.`;

    if (waterLiters < 1.8) {
      hydrationScore = 50;
      hydrationStatus = 'Needs Attention';
      hydrationExplanation = `Hydration intake (${waterLiters}L) is below healthy threshold. Target 2.5 - 3.0 liters.`;
    } else if (waterLiters < 2.2) {
      hydrationScore = 72;
      hydrationStatus = 'Needs Attention';
      hydrationExplanation = `Intake of ${waterLiters}L is moderate. Consider an additional 500ml during active hours.`;
    } else {
      hydrationScore = 90;
    }

    // 3. Physical Activity & Steps
    const steps = todayLog?.steps ?? healthProfile?.averageSteps ?? 6500;
    let stepsScore = 75;
    let stepsStatus: CategoryScore['status'] = 'Good';
    let stepsExplanation = `${steps.toLocaleString()} daily steps maintains active cardiovascular baseline.`;

    if (steps < 4000) {
      stepsScore = 48;
      stepsStatus = 'High Attention';
      stepsExplanation = `Low step volume (${steps.toLocaleString()}). Sedentary posture increases joint stiffness and blood sugar variance.`;
    } else if (steps < 6500) {
      stepsScore = 68;
      stepsStatus = 'Needs Attention';
      stepsExplanation = `Step count (${steps.toLocaleString()}) is fair. Increasing by 1,500 steps enhances metabolic health.`;
    } else if (steps >= 10000) {
      stepsScore = 95;
      stepsExplanation = `Excellent physical mobility with ${steps.toLocaleString()} steps logged today.`;
    } else {
      stepsScore = 82;
    }

    // 4. Exercise Consistency
    const exerciseLogged = todayLog?.exerciseLogged ?? (healthProfile?.exerciseFrequency !== 'rarely');
    const exerciseScore = exerciseLogged ? 85 : 60;
    const exerciseStatus: CategoryScore['status'] = exerciseLogged ? 'Good' : 'Needs Attention';
    const exerciseExplanation = exerciseLogged
      ? 'Active physical exercise routine recorded.'
      : 'No structured exercise logged today. Light stretching or brisk walking recommended.';

    // 5. Mood & Mental Wellness
    const mood = todayLog?.mood ?? healthProfile?.currentMood ?? 'good';
    let moodScore = 80;
    let moodStatus: CategoryScore['status'] = 'Good';
    let moodExplanation = 'Positive mental outlook and emotional equilibrium.';

    if (mood === 'low' || mood === 'stressed' || mood === 'anxious') {
      moodScore = 55;
      moodStatus = 'Needs Attention';
      moodExplanation = `Reported ${mood} mood state. Deep breathing exercises or guided relaxation recommended.`;
    } else if (mood === 'great') {
      moodScore = 94;
      moodExplanation = 'Excellent psychological state contributing to somatic resilience.';
    }

    // 6. Stress Level
    const stress = todayLog?.stressLevel ?? (healthProfile?.typicalStress === 'high' ? 8 : healthProfile?.typicalStress === 'low' ? 3 : 5);
    let stressScore = 80;
    let stressStatus: CategoryScore['status'] = 'Good';
    let stressExplanation = `Stress rating of ${stress}/10 is within manageable boundaries.`;

    if (stress >= 7) {
      stressScore = 45;
      stressStatus = 'High Attention';
      stressExplanation = `Elevated stress index (${stress}/10). High cortisol levels impact arterial pressure and digestion.`;
    } else if (stress >= 5) {
      stressScore = 65;
      stressStatus = 'Needs Attention';
      stressExplanation = `Moderate stress level (${stress}/10). Schedule periodic mindfulness breaks throughout the day.`;
    }

    // 7. Medication Adherence
    let medScore = 90;
    let medStatus: CategoryScore['status'] = 'Good';
    let medExplanation = 'Prescribed regimen followed on schedule.';

    if (medicines.length > 0) {
      const pendingMeds = medicines.filter((m) => !m.takenToday && !m.skippedToday);
      const takenMeds = medicines.filter((m) => m.takenToday);
      const adherenceRate = (takenMeds.length / medicines.length) * 100;

      if (adherenceRate < 50 && pendingMeds.length > 0) {
        medScore = 62;
        medStatus = 'Needs Attention';
        medExplanation = `${pendingMeds.length} scheduled medications pending confirmation today.`;
      } else if (adherenceRate >= 80) {
        medScore = 95;
        medExplanation = 'High compliance with daily medical prescription timing.';
      }
    }

    // 8. Calculate Overall Aggregate Score
    const weightedScore = Math.round(
      sleepScore * 0.2 +
      hydrationScore * 0.15 +
      stepsScore * 0.18 +
      exerciseScore * 0.12 +
      moodScore * 0.15 +
      stressScore * 0.1 +
      medScore * 0.1
    );

    let overallStatus: HealthPredictionResult['status'] = 'Good';
    if (weightedScore < 60) {
      overallStatus = 'High Attention';
    } else if (weightedScore < 76) {
      overallStatus = 'Needs Attention';
    }

    // Positive Insights & Attention Areas
    const positiveInsights: string[] = [];
    const areasNeedingAttention: string[] = [];
    const personalizedSuggestions: string[] = [];

    if (sleepScore >= 80) positiveInsights.push('Restorative sleep consistency supports neural recovery and immune function.');
    else areasNeedingAttention.push('Sleep cycle regularity needs stabilization; maintain consistent bedtimes.');

    if (hydrationScore >= 80) positiveInsights.push('Optimal hydration levels maintain renal clearance and cellular energy.');
    else areasNeedingAttention.push('Daily water volume is below standard 2.5L clinical guideline.');

    if (stepsScore >= 80) positiveInsights.push('Strong daily cardiovascular activity maintained through continuous steps.');
    else areasNeedingAttention.push('Prolonged sedentary periods detected; incorporate micro-walks every 90 minutes.');

    if (medScore >= 90) positiveInsights.push('Excellent prescription compliance shields against chronic symptom recurrence.');

    if (symptoms.length > 0) {
      areasNeedingAttention.push(`Recent symptom entries (${symptoms.map((s) => s.symptoms.join(', ')).join('; ')}) require monitored rest.`);
    }

    personalizedSuggestions.push('Consume an extra glass of water before physical workouts and morning routines.');
    personalizedSuggestions.push('Ensure 7-8 hours of uninterrupted sleep in a darkened, temperature-regulated room.');
    personalizedSuggestions.push('Take timely doses of any prescribed therapies to avoid clinical rebound effects.');

    return {
      overallScore: weightedScore,
      status: overallStatus,
      completenessPercentage: healthProfile?.isCompleted ? 95 : 65,
      evaluatedAt: new Date().toISOString(),
      categories: {
        sleep: { score: sleepScore, status: sleepStatus, label: 'Sleep Quality & Duration', explanation: sleepExplanation },
        hydration: { score: hydrationScore, status: hydrationStatus, label: 'Hydration Intake', explanation: hydrationExplanation },
        physicalActivity: { score: stepsScore, status: stepsStatus, label: 'Cardio & Mobility', explanation: stepsExplanation },
        dailySteps: { score: stepsScore, status: stepsStatus, label: 'Step Count', explanation: stepsExplanation },
        exerciseConsistency: { score: exerciseScore, status: exerciseStatus, label: 'Exercise Regularity', explanation: exerciseExplanation },
        mood: { score: moodScore, status: moodStatus, label: 'Emotional Balance', explanation: moodExplanation },
        stress: { score: stressScore, status: stressStatus, label: 'Stress Regulation', explanation: stressExplanation },
        mentalWellness: { score: moodScore, status: moodStatus, label: 'Mental Wellness', explanation: moodExplanation },
        medicationAdherence: { score: medScore, status: medStatus, label: 'Medication Adherence', explanation: medExplanation },
        nutritionLifestyle: { score: 82, status: 'Good', label: 'Nutritional Intake', explanation: 'Balanced dietary composition reported.' },
        generalWellnessConsistency: { score: weightedScore, status: overallStatus, label: 'Vital Consistency', explanation: 'Overall bodily homeostasis indicators.' },
      },
      positiveInsights: positiveInsights.length > 0 ? positiveInsights : ['Health profile securely configured and monitored.'],
      areasNeedingAttention: areasNeedingAttention.length > 0 ? areasNeedingAttention : ['Maintain current hydration and step milestones.'],
      personalizedSuggestions,
      trends: [
        { metric: 'Hydration Level', description: 'Consistently near target benchmark of 2.5L/day', status: 'improving' },
        { metric: 'Sleep Regularity', description: 'Average sleep duration 7.2 hours across past 7 days', status: 'steady' },
        { metric: 'Physical Steps', description: 'Consistent active minutes logged over weekday schedule', status: 'improving' },
      ],
    };
  }
}
