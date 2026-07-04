import React, { useState } from 'react';
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
} from '@ionic/react';
import { barbell, bulb, analytics, fitness } from 'ionicons/icons';
import './MuscleGainTracker.css';

type SplitKey = 'push' | 'pull' | 'legs';
type DifficultyKey = 'beginner' | 'intermediate' | 'advanced';

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

const splitPlans: Record<SplitKey, ExerciseItem[]> = {
  push: [
    {
      name: 'Bench Press',
      target: 'Chest, shoulders, triceps',
      sets: '3–4 sets',
      reps: '8–12 reps',
      description: 'A compound press that builds upper-body pushing strength and size.',
    },
    {
      name: 'Incline Dumbbell Press',
      target: 'Upper chest, shoulders',
      sets: '3 sets',
      reps: '10–12 reps',
      description: 'Highlights the upper chest and helps create a fuller push look.',
    },
    {
      name: 'Overhead Press',
      target: 'Shoulders, triceps',
      sets: '3 sets',
      reps: '8–12 reps',
      description: 'Develops shoulder strength and helps support pressing volume.',
    },
    {
      name: 'Lateral Raises',
      target: 'Side delts',
      sets: '3 sets',
      reps: '12–15 reps',
      description: 'Great for building shoulder width and improving upper-body shape.',
    },
    {
      name: 'Triceps Pushdown',
      target: 'Triceps',
      sets: '3 sets',
      reps: '10–15 reps',
      description: 'Adds direct triceps work to improve arm size and pressing performance.',
    },
  ],
  pull: [
    {
      name: 'Deadlift',
      target: 'Back, glutes, hamstrings',
      sets: '3–4 sets',
      reps: '5–8 reps',
      description: 'A powerful hinge movement that builds total-body strength and back mass.',
    },
    {
      name: 'Barbell Row',
      target: 'Upper back, lats',
      sets: '3 sets',
      reps: '8–12 reps',
      description: 'Improves posture and strengthens the mid-back for balanced growth.',
    },
    {
      name: 'Lat Pulldown',
      target: 'Lats, biceps',
      sets: '3 sets',
      reps: '10–12 reps',
      description: 'Helps build a wider back and strengthens pull movement patterns.',
    },
    {
      name: 'Face Pull',
      target: 'Rear delts, rotator cuff',
      sets: '3 sets',
      reps: '12–15 reps',
      description: 'Support shoulder health while adding upper-back volume.',
    },
    {
      name: 'Bicep Curl',
      target: 'Biceps',
      sets: '3 sets',
      reps: '10–15 reps',
      description: 'Adds direct arm work to support pulling strength and arm size.',
    },
  ],
  legs: [
    {
      name: 'Squat',
      target: 'Quads, glutes',
      sets: '3–4 sets',
      reps: '8–12 reps',
      description: 'The foundation of leg training and one of the best overall mass builders.',
    },
    {
      name: 'Romanian Deadlift',
      target: 'Hamstrings, glutes',
      sets: '3 sets',
      reps: '8–12 reps',
      description: 'Excellent for building hamstrings and improving posterior-chain strength.',
    },
    {
      name: 'Leg Press',
      target: 'Quads, glutes',
      sets: '3 sets',
      reps: '10–12 reps',
      description: 'Lets you train legs hard while keeping tension on the target muscles.',
    },
    {
      name: 'Leg Curl',
      target: 'Hamstrings',
      sets: '3 sets',
      reps: '10–15 reps',
      description: 'Adds isolation volume for the hamstrings and supports leg balance.',
    },
    {
      name: 'Standing Calf Raise',
      target: 'Calves',
      sets: '3 sets',
      reps: '12–15 reps',
      description: 'Useful for calf size and ankle strength, especially for lower-body development.',
    },
  ],
};

const difficultyProfiles: Record<DifficultyKey, DifficultyProfile> = {
  beginner: {
    title: 'Beginner',
    days: '3 workout days/week',
    sets: '3 sets/exercise',
    load: 'Light to moderate weights',
    focus: 'Focus on proper form',
  },
  intermediate: {
    title: 'Intermediate',
    days: '4–5 workout days/week',
    sets: '3–4 sets/exercise',
    load: 'Moderate weight',
    focus: 'Progressive overload',
  },
  advanced: {
    title: 'Advanced',
    days: '5–6 workout days/week',
    sets: '4–5 sets/exercise',
    load: 'Heavy weights',
    focus: 'Advanced intensity techniques',
  },
};

const MuscleGainTracker: React.FC = () => {
  const [activeSplit, setActiveSplit] = useState<SplitKey>('push');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('intermediate');
  const [completedDays, setCompletedDays] = useState<Record<SplitKey, boolean>>({
    push: true,
    pull: false,
    legs: false,
  });

  const weeklyGoal = 4;
  const completedWorkouts = Object.values(completedDays).filter(Boolean).length;
  const progressPercent = Math.min(100, Math.round((completedWorkouts / weeklyGoal) * 100));

  const toggleDay = (key: SplitKey) => {
    setCompletedDays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Muscle Gain Guide</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding muscle-gain-content">
        <div className="guide-shell">
          <div className="guide-hero">
            <div>
              <p className="hero-eyebrow">Educational PPL guide</p>
              <h2>Build muscle with a simple Push-Pull-Legs structure.</h2>
              <p>This page is designed as a workout reference for users who want a clear muscle-gain plan.</p>
            </div>
            <div className="hero-badge">No logging required</div>
          </div>

          <IonCard className="guide-card">
            <IonCardContent>
              <div className="section-title">
                <IonIcon icon={barbell} />
                <span>Workout Split</span>
              </div>
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

              <div className="planner-grid">
                {(Object.entries(completedDays) as [SplitKey, boolean][]).map(([key, completed]) => (
                  <button
                    key={key}
                    className={`planner-pill ${completed ? 'planner-pill-active' : ''}`}
                    onClick={() => toggleDay(key)}
                  >
                    <span>{key === 'push' ? 'Push' : key === 'pull' ? 'Pull' : 'Legs'}</span>
                    <small>{completed ? 'Completed' : 'Planned'}</small>
                  </button>
                ))}
              </div>

              <div className="exercise-grid">
                {splitPlans[activeSplit].map(exercise => (
                  <div key={exercise.name} className="exercise-card">
                    <h3>{exercise.name}</h3>
                    <p className="exercise-target">{exercise.target}</p>
                    <div className="exercise-meta">
                      <span>{exercise.sets}</span>
                      <span>{exercise.reps}</span>
                    </div>
                    <p className="exercise-description">{exercise.description}</p>
                  </div>
                ))}
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard className="guide-card">
            <IonCardContent>
              <div className="section-title">
                <IonIcon icon={fitness} />
                <span>Difficulty Level</span>
              </div>
              <div className="difficulty-buttons">
                {(['beginner', 'intermediate', 'advanced'] as DifficultyKey[]).map(level => (
                  <IonButton
                    key={level}
                    fill={difficulty === level ? 'solid' : 'outline'}
                    onClick={() => setDifficulty(level)}
                  >
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
            </IonCardContent>
          </IonCard>

          <div className="bottom-grid">
            <IonCard className="guide-card">
              <IonCardContent>
                <div className="section-title">
                  <IonIcon icon={bulb} />
                  <span>Muscle Gain Tips</span>
                </div>
                <ul className="tip-list">
                  <li>Consume 1.6–2.2 g protein per kg of body weight daily.</li>
                  <li>Eat enough calories to support muscle growth.</li>
                  <li>Sleep 7–9 hours each night.</li>
                  <li>Rest each muscle group for 48–72 hours.</li>
                  <li>Increase weight gradually while keeping proper form.</li>
                </ul>
              </IonCardContent>
            </IonCard>

            <IonCard className="guide-card progress-card">
              <IonCardContent>
                <div className="section-title">
                  <IonIcon icon={analytics} />
                  <span>Progress</span>
                </div>
                <div className="progress-row">
                  <div>
                    <p className="progress-label">Weekly Goal</p>
                    <strong>{weeklyGoal} workouts</strong>
                  </div>
                  <div>
                    <p className="progress-label">Completed Workouts</p>
                    <strong>{completedWorkouts}</strong>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="progress-caption">Tap a day card above to mark it as completed and update your weekly progress.</p>
              </IonCardContent>
            </IonCard>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MuscleGainTracker;