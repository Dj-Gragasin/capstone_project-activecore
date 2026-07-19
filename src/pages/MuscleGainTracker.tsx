import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonItem,
  IonInput,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import { barbell, analytics, calendarOutline, warningOutline, personOutline, checkmarkCircle } from 'ionicons/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './MuscleGainTracker.css';
import { API_CONFIG } from '../config/api.config';
import pushUpGif from '../assets/workouts/push-up.gif';
import inclinePushUpGif from '../assets/workouts/incline-push-up.gif';
import barbellBenchPressGif from '../assets/workouts/barbell-bench-press.gif';
import inclineDumbbellPressGif from '../assets/workouts/incline-dumbbell-press.gif';
import latPulldownGif from '../assets/workouts/lat-pulldown.gif';
import seatedCableRowGif from '../assets/workouts/seated-cable-row.gif';
import facePullGif from '../assets/workouts/face-pull.gif';
import dumbbellCurlGif from '../assets/workouts/dumbbell-curl.gif';
import trapBarDeadliftGif from '../assets/workouts/trap-bar-deadlift.gif';
import dumbbellRomanianDeadliftGif from '../assets/workouts/dumbbell-romanian-deadlift.gif';
import legCurlGif from '../assets/workouts/leg-curl.gif';
import standingCalfRaiseGif from '../assets/workouts/standing-calf-raise.gif';

const API_URL = API_CONFIG.BASE_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type SplitKey = 'push' | 'pull' | 'legs';
type DifficultyKey = 'beginner' | 'intermediate' | 'advanced';
type AgeBand = 'unknown' | 'under18' | '18to39' | '40to54' | '55plus';

interface ExerciseItem {
  name: string;
  target: string;
  sets: string;
  reps: string;
  description: string;
}

interface DifficultyProfile {
  title: string;
  days: string;
  sets: string;
  load: string;
  focus: string;
}

interface WeeklySplitDay {
  day: string;
  workout: string;
  note: string;
}

interface WeeklySplitPlan {
  title: string;
  subtitle: string;
  days: WeeklySplitDay[];
}

interface AgeGuidance {
  label: string;
  intensity: string;
  recovery: string;
  focus: string;
  caution: string;
}

interface SplitFieldConfig {
  title: string;
  description: string;
  fields: Array<{
    label: string;
    key: string;
  }>;
}

interface MuscleGainRecord {
  date: string;
  splitType: SplitKey;
  difficulty: DifficultyKey;
  workoutValues: Record<string, number>;
}

const splitPlans: Record<DifficultyKey, Record<SplitKey, ExerciseItem[]>> = {
  beginner: {
    push: [
      {
        name: 'Incline Push-Up',
        target: 'Chest, shoulders, triceps',
        sets: '2–3 sets',
        reps: '8–12 reps',
        description: 'Build pressing mechanics safely before moving to heavy barbell work.',
      },
      {
        name: 'Machine Chest Press',
        target: 'Chest, front delts, triceps',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Stable setup helps beginners focus on range of motion and control.',
      },
      {
        name: 'Seated Dumbbell Shoulder Press',
        target: 'Shoulders, triceps',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Safer shoulder-friendly press with manageable loading.',
      },
      {
        name: 'Lateral Raise',
        target: 'Side delts',
        sets: '2–3 sets',
        reps: '12–15 reps',
        description: 'Light accessory work for shoulder balance and posture.',
      },
      {
        name: 'Rope Triceps Pushdown',
        target: 'Triceps',
        sets: '2–3 sets',
        reps: '12–15 reps',
        description: 'Controlled elbow extension to finish push sessions safely.',
      },
    ],
    pull: [
      {
        name: 'Lat Pulldown',
        target: 'Lats, biceps',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Foundational vertical pull that builds back strength with less risk.',
      },
      {
        name: 'Chest-Supported Row',
        target: 'Upper back, lats',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Reduces lower-back fatigue while teaching clean rowing mechanics.',
      },
      {
        name: 'Seated Cable Row',
        target: 'Mid-back, lats',
        sets: '2–3 sets',
        reps: '10–12 reps',
        description: 'Builds pulling strength and helps improve posture.',
      },
      {
        name: 'Face Pull',
        target: 'Rear delts, rotator cuff',
        sets: '2–3 sets',
        reps: '12–15 reps',
        description: 'Supports shoulder health and balances pressing volume.',
      },
      {
        name: 'Dumbbell Curl',
        target: 'Biceps',
        sets: '2–3 sets',
        reps: '10–15 reps',
        description: 'Simple arm work to support pull-day development.',
      },
    ],
    legs: [
      {
        name: 'Goblet Squat',
        target: 'Quads, glutes, core',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Great first squat pattern for depth, bracing, and balance.',
      },
      {
        name: 'Leg Press',
        target: 'Quads, glutes',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Adds lower-body volume with stable machine support.',
      },
      {
        name: 'Dumbbell Romanian Deadlift',
        target: 'Hamstrings, glutes',
        sets: '2–3 sets',
        reps: '10–12 reps',
        description: 'Beginner hinge work without the load demands of heavy deadlifts.',
      },
      {
        name: 'Seated Leg Curl',
        target: 'Hamstrings',
        sets: '2–3 sets',
        reps: '12–15 reps',
        description: 'Direct hamstring work for knee stability and balance.',
      },
      {
        name: 'Standing Calf Raise',
        target: 'Calves',
        sets: '2–3 sets',
        reps: '12–15 reps',
        description: 'Builds ankle strength and lower-leg endurance.',
      },
    ],
  },
  intermediate: {
    push: [
      {
        name: 'Bench Press',
        target: 'Chest, shoulders, triceps',
        sets: '3–4 sets',
        reps: '6–10 reps',
        description: 'Primary compound press for progressive overload and muscle gain.',
      },
      {
        name: 'Incline Dumbbell Press',
        target: 'Upper chest, shoulders',
        sets: '3 sets',
        reps: '8–12 reps',
        description: 'Improves upper-chest development and pressing balance.',
      },
      {
        name: 'Overhead Press',
        target: 'Shoulders, triceps',
        sets: '3 sets',
        reps: '8–10 reps',
        description: 'Builds vertical pressing strength with strict technique.',
      },
      {
        name: 'Lateral Raise',
        target: 'Side delts',
        sets: '3 sets',
        reps: '12–15 reps',
        description: 'Adds shoulder volume with low joint stress.',
      },
      {
        name: 'Triceps Pushdown',
        target: 'Triceps',
        sets: '3 sets',
        reps: '10–15 reps',
        description: 'Supports pressing lockout and upper-arm growth.',
      },
    ],
    pull: [
      {
        name: 'Trap-Bar Deadlift',
        target: 'Back, glutes, hamstrings',
        sets: '3 sets',
        reps: '5–8 reps',
        description: 'Intermediate-friendly deadlift variation with cleaner mechanics.',
      },
      {
        name: 'Barbell Row',
        target: 'Upper back, lats',
        sets: '3 sets',
        reps: '8–10 reps',
        description: 'Adds back thickness and carries over to heavy pulls.',
      },
      {
        name: 'Lat Pulldown',
        target: 'Lats, biceps',
        sets: '3 sets',
        reps: '8–12 reps',
        description: 'High-quality vertical pulling for back width.',
      },
      {
        name: 'Face Pull',
        target: 'Rear delts, external rotators',
        sets: '3 sets',
        reps: '12–15 reps',
        description: 'Supports shoulder integrity and posture under higher volumes.',
      },
      {
        name: 'EZ-Bar Curl',
        target: 'Biceps, forearms',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Direct arm work with a wrist-friendlier grip option.',
      },
    ],
    legs: [
      {
        name: 'Back Squat',
        target: 'Quads, glutes, core',
        sets: '3–4 sets',
        reps: '6–10 reps',
        description: 'Main lower-body strength and mass movement.',
      },
      {
        name: 'Romanian Deadlift',
        target: 'Hamstrings, glutes',
        sets: '3 sets',
        reps: '8–10 reps',
        description: 'Key posterior-chain lift for strength and injury prevention.',
      },
      {
        name: 'Leg Press',
        target: 'Quads, glutes',
        sets: '3 sets',
        reps: '10–12 reps',
        description: 'Additional quad volume without heavy spinal loading.',
      },
      {
        name: 'Leg Curl',
        target: 'Hamstrings',
        sets: '3 sets',
        reps: '10–15 reps',
        description: 'Complements hinge work and supports knee health.',
      },
      {
        name: 'Standing Calf Raise',
        target: 'Calves',
        sets: '3 sets',
        reps: '12–15 reps',
        description: 'Adds lower-leg strength for better lower-body function.',
      },
    ],
  },
  advanced: {
    push: [
      {
        name: 'Bench Press (Heavy Day)',
        target: 'Chest, shoulders, triceps',
        sets: '4–5 sets',
        reps: '4–8 reps',
        description: 'Primary heavy press for strength-biased hypertrophy.',
      },
      {
        name: 'Incline Barbell or Dumbbell Press',
        target: 'Upper chest, front delts',
        sets: '4 sets',
        reps: '6–10 reps',
        description: 'Second compound press to drive upper-chest development.',
      },
      {
        name: 'Overhead Press',
        target: 'Shoulders, triceps',
        sets: '3–4 sets',
        reps: '6–10 reps',
        description: 'Vertical press for full shoulder and triceps output.',
      },
      {
        name: 'Cable or Dumbbell Lateral Raise',
        target: 'Side delts',
        sets: '3–4 sets',
        reps: '12–20 reps',
        description: 'High-rep shoulder isolation to complement heavy pressing.',
      },
      {
        name: 'Skullcrusher or Pushdown',
        target: 'Triceps',
        sets: '3–4 sets',
        reps: '10–15 reps',
        description: 'Arm specialization work to finish push sessions.',
      },
    ],
    pull: [
      {
        name: 'Conventional Deadlift',
        target: 'Back, glutes, hamstrings',
        sets: '3–4 sets',
        reps: '3–6 reps',
        description: 'High-demand pull reserved for advanced technique and recovery.',
      },
      {
        name: 'Weighted Pull-Up or Lat Pulldown',
        target: 'Lats, upper back, biceps',
        sets: '4 sets',
        reps: '6–10 reps',
        description: 'Vertical pulling focus for width and upper-body strength.',
      },
      {
        name: 'Barbell or Chest-Supported Row',
        target: 'Mid-back, lats',
        sets: '4 sets',
        reps: '6–10 reps',
        description: 'Heavy horizontal pull to increase overall back density.',
      },
      {
        name: 'Face Pull or Rear-Delt Fly',
        target: 'Rear delts, rotator cuff',
        sets: '3 sets',
        reps: '12–20 reps',
        description: 'Shoulder prehab-style volume to balance pressing stress.',
      },
      {
        name: 'Barbell or Incline Dumbbell Curl',
        target: 'Biceps, brachialis',
        sets: '3–4 sets',
        reps: '8–12 reps',
        description: 'Targeted arm work to support heavy pulling progression.',
      },
    ],
    legs: [
      {
        name: 'Back or Front Squat',
        target: 'Quads, glutes, core',
        sets: '4–5 sets',
        reps: '4–8 reps',
        description: 'Primary lower-body strength lift with progressive overload.',
      },
      {
        name: 'Romanian Deadlift',
        target: 'Hamstrings, glutes',
        sets: '4 sets',
        reps: '6–10 reps',
        description: 'Posterior-chain loading to support leg and pull performance.',
      },
      {
        name: 'Leg Press or Hack Squat',
        target: 'Quads, glutes',
        sets: '3–4 sets',
        reps: '8–12 reps',
        description: 'Extra volume for quad growth after heavy squat work.',
      },
      {
        name: 'Leg Curl',
        target: 'Hamstrings',
        sets: '3–4 sets',
        reps: '10–15 reps',
        description: 'Isolation volume for hamstring size and knee resilience.',
      },
      {
        name: 'Seated or Standing Calf Raise',
        target: 'Calves',
        sets: '4 sets',
        reps: '10–15 reps',
        description: 'Dedicated calf training for complete lower-body development.',
      },
    ],
  },
};

const difficultyProfiles: Record<DifficultyKey, DifficultyProfile> = {
  beginner: {
    title: 'Beginner',
    days: '3 workout days/week',
    sets: '2–3 sets/exercise',
    load: 'Light to moderate weights',
    focus: 'Master movement quality and consistency',
  },
  intermediate: {
    title: 'Intermediate',
    days: '4–5 workout days/week',
    sets: '3–4 sets/exercise',
    load: 'Moderate to challenging loads',
    focus: 'Progressive overload and balanced recovery',
  },
  advanced: {
    title: 'Advanced',
    days: '5–6 workout days/week (PPL x2)',
    sets: '4–5 sets/exercise',
    load: 'Heavy loads with planned fatigue management',
    focus: 'High volume and advanced intensity control',
  },
};

const weeklySplitPlans: Record<DifficultyKey, WeeklySplitPlan> = {
  beginner: {
    title: '3-Day Foundation Split',
    subtitle: 'Simple weekly flow focused on technique and full recovery.',
    days: [
      { day: 'Mon', workout: 'Push', note: 'Learn press patterns and control tempo.' },
      { day: 'Tue', workout: 'Recovery', note: 'Walk, stretch, or mobility (20–30 min).' },
      { day: 'Wed', workout: 'Pull', note: 'Back and posture-focused pulling session.' },
      { day: 'Thu', workout: 'Recovery', note: 'Sleep and hydration priority day.' },
      { day: 'Fri', workout: 'Legs', note: 'Lower-body basics plus core stability.' },
      { day: 'Sat', workout: 'Active Rest', note: 'Light cardio and mobility only.' },
      { day: 'Sun', workout: 'Full Rest', note: 'No heavy lifting; prepare for next week.' },
    ],
  },
  intermediate: {
    title: '5-Day Growth Split',
    subtitle: 'Higher weekly volume while preserving at least two lighter days.',
    days: [
      { day: 'Mon', workout: 'Push', note: 'Primary pressing strength and accessories.' },
      { day: 'Tue', workout: 'Pull', note: 'Rows, pulldowns, and rear-delt work.' },
      { day: 'Wed', workout: 'Recovery', note: 'Light cardio, mobility, and sleep focus.' },
      { day: 'Thu', workout: 'Legs', note: 'Squat/hinge session with controlled volume.' },
      { day: 'Fri', workout: 'Push (Volume)', note: 'Lighter loads, higher reps, clean form.' },
      { day: 'Sat', workout: 'Pull (Volume)', note: 'Back and arm volume, avoid max efforts.' },
      { day: 'Sun', workout: 'Full Rest', note: 'Next week starts with Legs for balance.' },
    ],
  },
  advanced: {
    title: '6-Day PPL x2 Split',
    subtitle: 'High-frequency schedule for lifters with strong recovery habits.',
    days: [
      { day: 'Mon', workout: 'Push A', note: 'Heavier compounds first, then accessories.' },
      { day: 'Tue', workout: 'Pull A', note: 'Deadlift variant plus heavy rows.' },
      { day: 'Wed', workout: 'Legs A', note: 'Strength-biased squat day.' },
      { day: 'Thu', workout: 'Push B', note: 'Different angles, moderate load and volume.' },
      { day: 'Fri', workout: 'Pull B', note: 'Horizontal/vertical pull balance and arms.' },
      { day: 'Sat', workout: 'Legs B', note: 'Volume-focused lower-body session.' },
      { day: 'Sun', workout: 'Full Rest', note: 'Recovery check before next cycle.' },
    ],
  },
};

const ageGuidanceByBand: Record<AgeBand, AgeGuidance> = {
  unknown: {
    label: 'Age-based guidance ready',
    intensity: 'Set your age to receive tailored intensity and recovery guidance.',
    recovery: 'Default rule: rest 48 hours before training the same muscles hard again.',
    focus: 'Start conservative and increase load only when technique stays stable.',
    caution: 'If you have medical conditions or pain history, get medical clearance first.',
  },
  under18: {
    label: 'Under 18',
    intensity: 'Use moderate loads; avoid max-effort singles or forced reps.',
    recovery: 'At least 1 full rest day between heavy sessions.',
    focus: 'Prioritize movement quality, supervision, and consistency over heavy weight.',
    caution: 'Train with a coach or adult spotter for all compound lifts.',
  },
  '18to39': {
    label: '18–39',
    intensity: 'Progress load gradually when all prescribed reps are clean.',
    recovery: '1–2 rest days weekly and deload every 6–8 weeks as needed.',
    focus: 'Balanced overload and sleep/nutrition to maximize hypertrophy.',
    caution: 'Avoid ego lifting and keep 1–2 reps in reserve on heavy compounds.',
  },
  '40to54': {
    label: '40–54',
    intensity: 'Use controlled tempo and moderate-heavy loads with strict form.',
    recovery: 'Add extra warm-up sets and prioritize 48–72h recovery for sore joints.',
    focus: 'Joint-friendly variations (trap bar, machine press, chest-supported row).',
    caution: 'Reduce volume at first signs of tendon/joint irritation.',
  },
  '55plus': {
    label: '55+',
    intensity: 'Use moderate loads and avoid frequent near-failure work.',
    recovery: 'Include additional recovery days and lower-impact conditioning.',
    focus: 'Strength, stability, and balance with safe range of motion.',
    caution: 'Stop any exercise that causes sharp pain, dizziness, or unusual breathlessness.',
  },
};

const sharedSafetyNotes = [
  'Warm up for 5–10 minutes, then do 2–3 lighter ramp-up sets before your first heavy compound lift.',
  'Use a spotter or safety pins for bench press and squat, especially when load increases.',
  'Keep your spine neutral on squats, hinges, and deadlifts. Stop the set if your form breaks.',
  'Do not hold your breath for too long; brace properly and breathe between reps.',
  'Increase weight gradually (about 2.5–5 kg for big lifts) only after you hit rep targets cleanly.',
  'Sharp pain is a stop signal. Do not push through pain that feels unstable, pinching, or sudden.',
];

const splitSpecificCautions: Record<SplitKey, string[]> = {
  push: [
    'Keep shoulder blades retracted during presses to protect shoulder joints.',
    'Do not flare elbows aggressively on bench press; keep controlled bar path.',
  ],
  pull: [
    'For deadlifts, brace before each rep and keep the bar close to the body.',
    'If lower back rounds under load, reduce weight and reset technique immediately.',
  ],
  legs: [
    'On squats and leg press, keep knees tracking over toes and avoid knee collapse inward.',
    'For Romanian deadlifts, hinge from hips and avoid excessive lumbar flexion.',
  ],
};

const workoutGifFiles = {
  pushUpGif,
  inclinePushUpGif,
  barbellBenchPressGif,
  inclineDumbbellPressGif,
  latPulldownGif,
  seatedCableRowGif,
  facePullGif,
  dumbbellCurlGif,
  trapBarDeadliftGif,
  dumbbellRomanianDeadliftGif,
  legCurlGif,
  standingCalfRaiseGif,
};

const workoutGif = (key: keyof typeof workoutGifFiles): string => workoutGifFiles[key];

const splitFieldConfig: Record<SplitKey, SplitFieldConfig> = {
  push: {
    title: 'Push Day',
    description: 'Focus on chest, shoulders, and triceps with pressing volume.',
    fields: [
      { label: 'Bench Press (kg)', key: 'benchPress' },
      { label: 'Incline Press (kg)', key: 'inclinePress' },
      { label: 'Overhead Press (kg)', key: 'overheadPress' },
      { label: 'Lateral Raise (kg)', key: 'lateralRaise' },
      { label: 'Triceps Pushdown (kg)', key: 'tricepsPushdown' },
    ],
  },
  pull: {
    title: 'Pull Day',
    description: 'Train your back and biceps with rows, pulls, and arm work.',
    fields: [
      { label: 'Deadlift (kg)', key: 'deadlift' },
      { label: 'Barbell Row (kg)', key: 'barbellRow' },
      { label: 'Lat Pulldown (kg)', key: 'latPulldown' },
      { label: 'Face Pull (kg)', key: 'facePull' },
      { label: 'Bicep Curl (kg)', key: 'bicepCurl' },
    ],
  },
  legs: {
    title: 'Leg Day',
    description: 'Build lower-body strength with squats, hinges, and leg work.',
    fields: [
      { label: 'Squat (kg)', key: 'squat' },
      { label: 'Romanian Deadlift (kg)', key: 'romanianDeadlift' },
      { label: 'Leg Press (kg)', key: 'legPress' },
      { label: 'Leg Curl (kg)', key: 'legCurl' },
      { label: 'Standing Calf Raise (kg)', key: 'calfRaise' },
    ],
  },
};

const splitFieldConfigByDifficulty: Record<DifficultyKey, Record<SplitKey, SplitFieldConfig>> = {
  beginner: {
    push: {
      title: 'Push Day (Beginner)',
      description: 'Use beginner-safe movements and controlled reps.',
      fields: [
        { label: 'Incline Push-Up (reps)', key: 'inclinePushupReps' },
        { label: 'Machine Chest Press (kg)', key: 'machineChestPress' },
        { label: 'Seated DB Shoulder Press (kg)', key: 'seatedDbShoulderPress' },
        { label: 'Lateral Raise (kg)', key: 'lateralRaise' },
        { label: 'Rope Triceps Pushdown (kg)', key: 'ropeTricepsPushdown' },
      ],
    },
    pull: {
      title: 'Pull Day (Beginner)',
      description: 'Focus on posture and controlled pulling mechanics.',
      fields: [
        { label: 'Lat Pulldown (kg)', key: 'latPulldown' },
        { label: 'Chest-Supported Row (kg)', key: 'chestSupportedRow' },
        { label: 'Seated Cable Row (kg)', key: 'seatedCableRow' },
        { label: 'Face Pull (kg)', key: 'facePull' },
        { label: 'DB Curl (kg)', key: 'dbCurl' },
      ],
    },
    legs: {
      title: 'Leg Day (Beginner)',
      description: 'Build lower-body fundamentals with stable patterns.',
      fields: [
        { label: 'Goblet Squat (kg)', key: 'gobletSquat' },
        { label: 'Leg Press (kg)', key: 'legPress' },
        { label: 'DB Romanian Deadlift (kg)', key: 'dbRomanianDeadlift' },
        { label: 'Seated Leg Curl (kg)', key: 'seatedLegCurl' },
        { label: 'Standing Calf Raise (kg)', key: 'calfRaise' },
      ],
    },
  },
  intermediate: splitFieldConfig,
  advanced: {
    push: {
      title: 'Push Day (Advanced)',
      description: 'Track heavy compounds and assistance volume.',
      fields: [
        { label: 'Bench Press (kg)', key: 'benchPress' },
        { label: 'Incline Press (kg)', key: 'inclinePress' },
        { label: 'Overhead Press (kg)', key: 'overheadPress' },
        { label: 'Lateral Raise (kg)', key: 'lateralRaise' },
        { label: 'Skullcrusher/Pushdown (kg)', key: 'tricepsIsolation' },
      ],
    },
    pull: {
      title: 'Pull Day (Advanced)',
      description: 'Track heavy pulls with shoulder-health accessories.',
      fields: [
        { label: 'Deadlift (kg)', key: 'deadlift' },
        { label: 'Weighted Pull-Up / Pulldown (kg)', key: 'weightedPullupOrPulldown' },
        { label: 'Barbell/Chest-Supported Row (kg)', key: 'barbellOrSupportedRow' },
        { label: 'Face Pull / Rear-Delt Fly (kg)', key: 'rearDeltAccessory' },
        { label: 'Barbell/Incline Curl (kg)', key: 'barbellOrInclineCurl' },
      ],
    },
    legs: {
      title: 'Leg Day (Advanced)',
      description: 'Capture strength-biased lower-body progression.',
      fields: [
        { label: 'Back/Front Squat (kg)', key: 'backOrFrontSquat' },
        { label: 'Romanian Deadlift (kg)', key: 'romanianDeadlift' },
        { label: 'Leg Press/Hack Squat (kg)', key: 'legPressOrHackSquat' },
        { label: 'Leg Curl (kg)', key: 'legCurl' },
        { label: 'Calf Raise (kg)', key: 'calfRaise' },
      ],
    },
  },
};

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getWorkoutValue = (record: any, key: string): number => {
  return toNumber(record?.workoutValues?.[key]);
};

const formatWorkoutValue = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

const compactHeaderLabel = (label: string): string => {
  return label
    .replace(' (kg)', '')
    .replace('Romanian Deadlift', 'RDL')
    .replace('Standing Calf Raise', 'Calf Raise')
    .replace('Triceps Pushdown', 'Triceps')
    .replace('Lateral Raise', 'Lateral')
    .replace('Overhead Press', 'OHP');
};

const normalizeRecord = (record: any): MuscleGainRecord => {
  const splitType = (record?.splitType as SplitKey) || 'push';
  const difficulty = (record?.difficulty as DifficultyKey) || 'intermediate';
  const fieldSource = splitFieldConfigByDifficulty[difficulty] || splitFieldConfigByDifficulty.intermediate;
  const fallbackValues = Object.fromEntries(
    fieldSource[splitType].fields.map((field, index) => {
      const legacyValue = record?.workoutValues?.[field.key];
      if (legacyValue !== undefined && legacyValue !== null) {
        return [field.key, toNumber(legacyValue)];
      }
      const oldStats = record?.strengthStats;
      const mappedValue = index === 0
        ? toNumber(oldStats?.benchPress)
        : index === 1
          ? toNumber(oldStats?.deadlift)
          : index === 2
            ? toNumber(oldStats?.squat)
            : 0;
      return [field.key, mappedValue];
    })
  );

  return {
    date: record?.date || '',
    splitType,
    difficulty,
    workoutValues: fallbackValues,
  };
};

const parseStoredProfile = (raw: string | null): Record<string, unknown> | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const ageFromDateInput = (value: unknown): number | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasBirthdayPassed =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasBirthdayPassed) age -= 1;

  if (age < 10 || age > 100) return null;
  return age;
};

const inferInitialAge = (): number | null => {
  const profileKeys = ['user', 'currentUser'];
  const dateFields = ['dateOfBirth', 'date_of_birth', 'dob', 'birthDate'];
  const ageFields = ['age'];

  for (const storageKey of profileKeys) {
    const profile = parseStoredProfile(localStorage.getItem(storageKey));
    if (!profile) continue;

    for (const field of ageFields) {
      const ageValue = Number(profile[field]);
      if (Number.isFinite(ageValue) && ageValue >= 10 && ageValue <= 100) {
        return Math.floor(ageValue);
      }
    }

    for (const field of dateFields) {
      const age = ageFromDateInput(profile[field]);
      if (age !== null) return age;
    }
  }

  return null;
};

const getAgeBand = (age: number | null): AgeBand => {
  if (age === null) return 'unknown';
  if (age < 18) return 'under18';
  if (age <= 39) return '18to39';
  if (age <= 54) return '40to54';
  return '55plus';
};

const splitFormVisualCues: Record<SplitKey, { setup: string; execute: string; finish: string }> = {
  push: {
    setup: 'Shoulders packed, wrists stacked over elbows, feet planted.',
    execute: 'Press in a controlled path; avoid shoulder shrugging and elbow flare.',
    finish: 'Lock out softly with core tight and chest up.',
  },
  pull: {
    setup: 'Brace core and set a neutral spine before every pull.',
    execute: 'Drive elbows back and keep load close to your body.',
    finish: 'Squeeze upper back without excessive neck extension.',
  },
  legs: {
    setup: 'Tripod foot pressure and knees tracking with toes.',
    execute: 'Control depth, keep chest proud, and maintain spinal neutrality.',
    finish: 'Stand tall by driving through mid-foot and heels.',
  },
};

const splitGifFallback: Record<SplitKey, string> = {
  push: workoutGif('pushUpGif'),
  pull: workoutGif('latPulldownGif'),
  legs: workoutGif('dumbbellRomanianDeadliftGif'),
};

const exerciseGifMap: Record<string, string> = {
  'incline push-up': workoutGif('inclinePushUpGif'),
  'machine chest press': workoutGif('barbellBenchPressGif'),
  'seated dumbbell shoulder press': workoutGif('barbellBenchPressGif'),
  'lateral raise': workoutGif('inclineDumbbellPressGif'),
  'rope triceps pushdown': workoutGif('barbellBenchPressGif'),
  'triceps pushdown': workoutGif('barbellBenchPressGif'),
  'bench press': workoutGif('barbellBenchPressGif'),
  'bench press heavy day': workoutGif('barbellBenchPressGif'),
  'incline dumbbell press': workoutGif('inclineDumbbellPressGif'),
  'incline barbell or dumbbell press': workoutGif('inclineDumbbellPressGif'),
  'overhead press': workoutGif('barbellBenchPressGif'),
  'cable or dumbbell lateral raise': workoutGif('inclineDumbbellPressGif'),
  'skullcrusher or pushdown': workoutGif('barbellBenchPressGif'),
  'lat pulldown': workoutGif('latPulldownGif'),
  'chest-supported row': workoutGif('seatedCableRowGif'),
  'seated cable row': workoutGif('seatedCableRowGif'),
  'face pull': workoutGif('facePullGif'),
  'dumbbell curl': workoutGif('dumbbellCurlGif'),
  'trap-bar deadlift': workoutGif('trapBarDeadliftGif'),
  'barbell row': workoutGif('seatedCableRowGif'),
  'ez-bar curl': workoutGif('dumbbellCurlGif'),
  'conventional deadlift': workoutGif('trapBarDeadliftGif'),
  'weighted pull-up or lat pulldown': workoutGif('latPulldownGif'),
  'barbell or chest-supported row': workoutGif('seatedCableRowGif'),
  'face pull or rear-delt fly': workoutGif('facePullGif'),
  'barbell or incline dumbbell curl': workoutGif('dumbbellCurlGif'),
  'goblet squat': workoutGif('dumbbellRomanianDeadliftGif'),
  'leg press': workoutGif('dumbbellRomanianDeadliftGif'),
  'dumbbell romanian deadlift': workoutGif('dumbbellRomanianDeadliftGif'),
  'seated leg curl': workoutGif('legCurlGif'),
  'standing calf raise': workoutGif('standingCalfRaiseGif'),
  'back squat': workoutGif('dumbbellRomanianDeadliftGif'),
  'romanian deadlift': workoutGif('dumbbellRomanianDeadliftGif'),
  'leg curl': workoutGif('legCurlGif'),
  'back or front squat': workoutGif('dumbbellRomanianDeadliftGif'),
  'leg press or hack squat': workoutGif('dumbbellRomanianDeadliftGif'),
  'seated or standing calf raise': workoutGif('standingCalfRaiseGif'),
};

const normalizeExerciseName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[\/]/g, ' or ')
    .replace(/\s+/g, ' ')
    .trim();

const getExerciseGifUrl = (exerciseName: string, split: SplitKey): string => {
  const normalized = normalizeExerciseName(exerciseName);
  return exerciseGifMap[normalized] || splitGifFallback[split];
};

const ExerciseGifPreview: React.FC<{ split: SplitKey; exerciseName: string }> = ({ split, exerciseName }) => {
  const gifUrl = getExerciseGifUrl(exerciseName, split);
  const [imgSrc, setImgSrc] = useState(gifUrl);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    setImgSrc(gifUrl);
    setShouldLoad(false);
    setHasFailed(false);
  }, [gifUrl]);

  const handleImageError = () => {
    if (imgSrc !== splitGifFallback[split]) {
      setImgSrc(splitGifFallback[split]);
      return;
    }
    setHasFailed(true);
  };

  if (!shouldLoad) {
    return (
      <div className="motion-preview-wrap">
        <div className="gif-placeholder">
          <div className="gif-placeholder-title">{exerciseName} demo</div>
          <button className="gif-load-btn" type="button" onClick={() => setShouldLoad(true)}>
            Load Form Demo
          </button>
        </div>
        <div className="motion-preview-legend">Tap to load GIF (saves data and improves speed)</div>
      </div>
    );
  }

  if (hasFailed) {
    return (
      <div className="motion-preview-wrap">
        <div className="gif-placeholder">
          <div className="gif-placeholder-title">Demo unavailable</div>
          <button
            className="gif-load-btn"
            type="button"
            onClick={() => {
              setHasFailed(false);
              setImgSrc(splitGifFallback[split]);
            }}
          >
            Retry Demo
          </button>
        </div>
        <div className="motion-preview-legend">Form demo GIF</div>
      </div>
    );
  }

  return (
    <div className="motion-preview-wrap">
      <img
        src={imgSrc}
        alt={`${exerciseName} demo`}
        className="exercise-gif"
        loading="lazy"
        onError={handleImageError}
      />
      <div className="motion-preview-legend">Form demo GIF</div>
    </div>
  );
};

const MuscleGainTracker: React.FC = () => {
  const [records, setRecords] = useState<MuscleGainRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [strengthStats, setStrengthStats] = useState<Record<string, string>>({});
  const [activeSplit, setActiveSplit] = useState<SplitKey>('push');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('intermediate');
  const [ageInput, setAgeInput] = useState<string>(() => {
    const inferredAge = inferInitialAge();
    return inferredAge !== null ? String(inferredAge) : '';
  });

  const parsedAge = Number.parseInt(ageInput, 10);
  const age = Number.isFinite(parsedAge) && parsedAge > 0 ? parsedAge : null;
  const ageBand = getAgeBand(age);
  const ageGuidance = ageGuidanceByBand[ageBand];
  const selectedWeeklyPlan = weeklySplitPlans[difficulty];
  const selectedSplitFieldConfig = splitFieldConfigByDifficulty[difficulty][activeSplit];

  const loadRecords = async () => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      const stored = localStorage.getItem('muscleGainRecords');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecords(Array.isArray(parsed) ? parsed.map((record: any) => normalizeRecord(record)) : []);
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/muscle-gain/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load records');
      }
      const normalized = Array.isArray(data.records) ? data.records.map((record: any) => normalizeRecord(record)) : [];
      setRecords(normalized);
    } catch {
      const stored = localStorage.getItem('muscleGainRecords');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecords(Array.isArray(parsed) ? parsed.map((record: any) => normalizeRecord(record)) : []);
      }
    }
  };

  useEffect(() => {
    const initialStats = Object.fromEntries(
      Object.values(splitFieldConfigByDifficulty)
        .flatMap((configBySplit) => Object.values(configBySplit))
        .flatMap(config => config.fields)
        .map(field => [field.key, ''])
    );
    setStrengthStats(initialStats);
    loadRecords();
  }, []);

  const validateInputs = () => {
    const splitFields = selectedSplitFieldConfig.fields.map(field => field.key);
    return splitFields.some(fieldKey => Boolean(strengthStats[fieldKey]));
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    const emptyStats = Object.fromEntries(
      Object.values(splitFieldConfigByDifficulty)
        .flatMap((configBySplit) => Object.values(configBySplit))
        .flatMap(config => config.fields)
        .map(field => [field.key, ''])
    );
    setStrengthStats(emptyStats);
  };

  const handleUpdate = () => {
    if (!validateInputs()) {
      alert('Please fill in all required fields.');
      return;
    }

    const workoutValues = Object.fromEntries(
      selectedSplitFieldConfig.fields.map(field => [field.key, parseFloat(strengthStats[field.key] || '0')])
    );

    const newRecord: MuscleGainRecord = {
      date,
      splitType: activeSplit,
      difficulty,
      workoutValues,
    };

    const updatedRecords = [...records, newRecord].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const token = localStorage.getItem('token') || '';
    if (!token) {
      const normalizedRecords = updatedRecords.map(normalizeRecord);
      setRecords(normalizedRecords);
      localStorage.setItem('muscleGainRecords', JSON.stringify(normalizedRecords));
      clearForm();
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/muscle-gain/records`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newRecord),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to save record');
        }

        const nextRecords = Array.isArray(data.records)
          ? data.records.map(normalizeRecord)
          : updatedRecords.map(normalizeRecord);
        setRecords(nextRecords);
        localStorage.setItem('muscleGainRecords', JSON.stringify(nextRecords));
        clearForm();
      } catch (e: any) {
        const normalizedRecords = updatedRecords.map(normalizeRecord);
        setRecords(normalizedRecords);
        localStorage.setItem('muscleGainRecords', JSON.stringify(normalizedRecords));
        clearForm();
        alert(`Saved locally only (server sync failed): ${e?.message || 'unknown error'}`);
      }
    })();
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all records?')) {
      const token = localStorage.getItem('token') || '';
      if (!token) {
        setRecords([]);
        localStorage.removeItem('muscleGainRecords');
        clearForm();
        return;
      }

      (async () => {
        try {
          const res = await fetch(`${API_URL}/muscle-gain/records`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.message || 'Failed to delete records');
          }
          setRecords([]);
          localStorage.removeItem('muscleGainRecords');
          clearForm();
        } catch (e: any) {
          alert(`Failed to delete from server: ${e?.message || 'unknown error'}`);
        }
      })();
    }
  };

  const displayRecords = records
    .map(normalizeRecord)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const selectedRecordItems = displayRecords.filter(
    record => record.splitType === activeSplit && record.difficulty === difficulty
  );
  const selectedRecordFields = selectedSplitFieldConfig.fields;

  const selectedChartRecords = displayRecords
    .filter(record => record.splitType === activeSplit && record.difficulty === difficulty)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartLabels = Array.from(new Set(selectedChartRecords.map(record => record.date).filter(Boolean)))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const chartData = {
    labels: chartLabels,
    datasets: selectedSplitFieldConfig.fields.map((field, index) => ({
      label: compactHeaderLabel(field.label),
      data: chartLabels.map(date => {
        const record = [...selectedChartRecords].reverse().find(item => item.date === date);
        return record ? getWorkoutValue(record, field.key) : null;
      }),
      borderColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F4A261', '#9B5DE5'][index % 5],
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F4A261', '#9B5DE5'][index % 5],
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      tension: 0.28,
      fill: false,
    })),
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#ffffff' },
      },
      x: {
        grid: { color: 'rgba(255,255,255,0.1)' },
        ticks: { color: '#ffffff' },
      },
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#ffffff' } },
      title: {
        display: true,
        text: `${selectedSplitFieldConfig.title} Progress` ,
        color: '#ffffff',
        font: { size: 16 },
      },
    },
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Muscle Gain Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding muscle-gain-content">
        <div className="tracker-shell">
          <IonGrid fixed>
            <IonRow>
              <IonCol size="12">
                <div className="panel">
                  <div className="section-title">
                    <IonIcon icon={barbell} />
                    <span>Log Your Workout</span>
                  </div>

                  <div className="split-segment-wrap">
                    <IonSegment value={activeSplit} onIonChange={e => setActiveSplit(e.detail.value as SplitKey)}>
                      <IonSegmentButton value="push">
                        <IonLabel>Push</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="pull">
                        <IonLabel>Pull</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="legs">
                        <IonLabel>Legs</IonLabel>
                      </IonSegmentButton>
                    </IonSegment>
                  </div>

                  <div className="focus-card">
                    <div className="focus-card-title">{selectedSplitFieldConfig.title}</div>
                    <p>{selectedSplitFieldConfig.description}</p>
                  </div>

                  <IonItem className="tracker-input">
                    <IonLabel position="stacked">Date</IonLabel>
                    <IonInput type="date" value={date} onIonChange={e => setDate(e.detail.value ?? '')} />
                  </IonItem>
                  <div className="input-grid">
                    {selectedSplitFieldConfig.fields.map(field => (
                      <IonItem key={field.key} className="tracker-input">
                        <IonLabel position="stacked">{field.label}</IonLabel>
                        <IonInput
                          type="number"
                          value={strengthStats[field.key] ?? ''}
                          onIonChange={e => setStrengthStats(prev => ({ ...prev, [field.key]: e.detail.value ?? '' }))}
                        />
                      </IonItem>
                    ))}
                  </div>
                  <div className="button-row">
                    <IonButton expand="block" fill="outline" onClick={clearForm}>Clear</IonButton>
                    <IonButton expand="block" onClick={handleUpdate}>Save Entry</IonButton>
                    <IonButton expand="block" fill="outline" color="danger" onClick={handleDeleteAll}>Delete All</IonButton>
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {displayRecords.length > 0 && (
            <div className="panel chart-panel">
              <div className="section-title">
                <IonIcon icon={analytics} />
                <span>Progress Graph</span>
              </div>
              <div className="chart-container">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {displayRecords.length > 0 && (
            <>
              {selectedRecordItems.length === 0 && (
                <div className="panel">
                  <p className="records-empty-state">
                    No {difficulty} {activeSplit} records yet.
                  </p>
                </div>
              )}

              {selectedRecordItems.length > 0 && (
                <>
                  <div className="records-table-wrap">
                    <div className="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            {selectedRecordFields.map((field) => (
                              <th key={field.key} className="metric-header">
                                {compactHeaderLabel(field.label)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRecordItems.map((record, index) => (
                            <tr key={index}>
                              <td>{record.date}</td>
                              {selectedRecordFields.map((field) => (
                                <td key={field.key} className="metric-cell">
                                  {formatWorkoutValue(getWorkoutValue(record, field.key))}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="records-list-wrap">
                    <IonGrid>
                      <IonRow>
                        {selectedRecordItems.map((record, index) => (
                          <IonCol key={index} size="12" sizeMd="6">
                            <IonCard>
                              <IonCardContent>
                                <div className="record-card-title">{record.date}</div>
                                {selectedRecordFields.map(field => (
                                  <div key={field.key} className="record-card-meta">
                                    {compactHeaderLabel(field.label)}: {formatWorkoutValue(getWorkoutValue(record, field.key))}
                                  </div>
                                ))}
                              </IonCardContent>
                            </IonCard>
                          </IonCol>
                        ))}
                      </IonRow>
                    </IonGrid>
                  </div>
                </>
              )}
            </>
          )}

          <div className="panel">
            <div className="section-title">
              <IonIcon icon={barbell} />
              <span>Training Guidance</span>
            </div>

            <div className="difficulty-buttons">
              {(['beginner', 'intermediate', 'advanced'] as DifficultyKey[]).map(level => (
                <IonButton key={level} fill={difficulty === level ? 'solid' : 'outline'} onClick={() => setDifficulty(level)}>
                  {difficultyProfiles[level].title}
                </IonButton>
              ))}
            </div>

            <div className="difficulty-panel">
              <h3>{difficultyProfiles[difficulty].title}</h3>
              <ul>
                <li><strong>Frequency:</strong> {difficultyProfiles[difficulty].days}</li>
                <li><strong>Volume:</strong> {difficultyProfiles[difficulty].sets}</li>
                <li><strong>Load:</strong> {difficultyProfiles[difficulty].load}</li>
                <li><strong>Focus:</strong> {difficultyProfiles[difficulty].focus}</li>
              </ul>
            </div>

            <div className="age-guidance-grid">
              <IonItem className="tracker-input">
                <IonIcon icon={personOutline} slot="start" />
                <IonLabel position="stacked">Age (years)</IonLabel>
                <IonInput
                  type="number"
                  value={ageInput}
                  min={10}
                  max={100}
                  onIonChange={e => setAgeInput((e.detail.value ?? '').replace(/[^\d]/g, ''))}
                />
              </IonItem>

              <div className="age-guidance-card">
                <h3>{ageGuidance.label}</h3>
                <ul>
                  <li><strong>Intensity:</strong> {ageGuidance.intensity}</li>
                  <li><strong>Recovery:</strong> {ageGuidance.recovery}</li>
                  <li><strong>Focus:</strong> {ageGuidance.focus}</li>
                  <li><strong>Caution:</strong> {ageGuidance.caution}</li>
                </ul>
              </div>
            </div>

            <div className="weekly-plan-panel">
              <div className="section-title">
                <IonIcon icon={calendarOutline} />
                <span>Weekly Split Plan</span>
              </div>
              <p className="weekly-plan-subtitle">{selectedWeeklyPlan.title}: {selectedWeeklyPlan.subtitle}</p>
              <div className="week-grid">
                {selectedWeeklyPlan.days.map(item => (
                  <div key={`${item.day}-${item.workout}`} className="week-day-card">
                    <div className="week-day-head">
                      <span className="week-day-name">{item.day}</span>
                      <span className="week-day-workout">{item.workout}</span>
                    </div>
                    <p className="week-day-note">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="exercise-grid">
              {splitPlans[difficulty][activeSplit].map(exercise => (
                <div key={exercise.name} className="exercise-card">
                  <ExerciseGifPreview split={activeSplit} exerciseName={exercise.name} />
                  <h3>{exercise.name}</h3>
                  <p className="exercise-target">Targets: {exercise.target}</p>
                  <div className="exercise-meta">
                    <span>{exercise.sets}</span>
                    <span>{exercise.reps}</span>
                  </div>
                  <p className="exercise-description">{exercise.description}</p>
                  <div className="form-cues">
                    <div className="form-cue-row">
                      <IonIcon icon={checkmarkCircle} />
                      <span><strong>Setup:</strong> {splitFormVisualCues[activeSplit].setup}</span>
                    </div>
                    <div className="form-cue-row">
                      <IonIcon icon={checkmarkCircle} />
                      <span><strong>Movement:</strong> {splitFormVisualCues[activeSplit].execute}</span>
                    </div>
                    <div className="form-cue-row">
                      <IonIcon icon={checkmarkCircle} />
                      <span><strong>Finish:</strong> {splitFormVisualCues[activeSplit].finish}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="safety-panel">
              <div className="section-title">
                <IonIcon icon={warningOutline} />
                <span>Safety Notes and Cautions</span>
              </div>
              <ul className="safety-list">
                {sharedSafetyNotes.map(note => (
                  <li key={note}>{note}</li>
                ))}
                {splitSpecificCautions[activeSplit].map(note => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <p className="medical-note">
                If you feel dizziness, chest pain, sharp joint pain, or numbness, stop training immediately and seek medical help.
              </p>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MuscleGainTracker;