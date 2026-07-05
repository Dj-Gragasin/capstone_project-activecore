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
import { barbell, analytics } from 'ionicons/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './MuscleGainTracker.css';
import { API_CONFIG } from '../config/api.config';

const API_URL = API_CONFIG.BASE_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  workoutValues: Record<string, number>;
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

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getWorkoutValue = (record: any, key: string): number => {
  return toNumber(record?.workoutValues?.[key]);
};

const normalizeRecord = (record: any): MuscleGainRecord => {
  const splitType = (record?.splitType as SplitKey) || 'push';
  const fallbackValues = Object.fromEntries(
    splitFieldConfig[splitType].fields.map((field, index) => {
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
    workoutValues: fallbackValues,
  };
};

const MuscleGainTracker: React.FC = () => {
  const [records, setRecords] = useState<MuscleGainRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [strengthStats, setStrengthStats] = useState<Record<string, string>>({});
  const [activeSplit, setActiveSplit] = useState<SplitKey>('push');
  const [chartSplit, setChartSplit] = useState<SplitKey>('push');
  const [difficulty, setDifficulty] = useState<DifficultyKey>('intermediate');

  const loadRecords = async () => {
    const token = localStorage.getItem('token') || '';
    if (!token) {
      const stored = localStorage.getItem('muscleGainRecords');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecords(
          Array.isArray(parsed)
            ? parsed.map((record: any) => ({ ...record, splitType: record.splitType || 'push' }))
            : []
        );
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
      Object.values(splitFieldConfig)
        .flatMap(config => config.fields)
        .map(field => [field.key, ''])
    );
    setStrengthStats(initialStats);
    loadRecords();
  }, []);

  const validateInputs = () => {
    const splitFields = splitFieldConfig[activeSplit].fields.map(field => field.key);
    return splitFields.some(fieldKey => Boolean(strengthStats[fieldKey]));
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    const emptyStats = Object.fromEntries(
      Object.values(splitFieldConfig)
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
      splitFieldConfig[activeSplit].fields.map(field => [field.key, parseFloat(strengthStats[field.key] || '0')])
    );

    const newRecord: MuscleGainRecord = {
      date,
      splitType: activeSplit,
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

  const displayRecords = records.map(normalizeRecord);

  const selectedChartRecords = displayRecords
    .filter(record => record.splitType === chartSplit)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const chartLabels = Array.from(new Set(selectedChartRecords.map(record => record.date).filter(Boolean)))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const chartData = {
    labels: chartLabels,
    datasets: splitFieldConfig[chartSplit].fields.map((field, index) => ({
      label: field.label,
      data: chartLabels.map(date => {
        const record = [...selectedChartRecords].reverse().find(item => item.date === date);
        return record ? getWorkoutValue(record, field.key) : null;
      }),
      backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F4A261', '#9B5DE5'][index % 5],
    })),
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
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
      title: { display: true, text: 'Strength Progress', color: '#ffffff', font: { size: 16 } },
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
                    <div className="focus-card-title">{splitFieldConfig[activeSplit].title}</div>
                    <p>{splitFieldConfig[activeSplit].description}</p>
                  </div>

                  <IonItem className="tracker-input">
                    <IonLabel position="stacked">Date</IonLabel>
                    <IonInput type="date" value={date} onIonChange={e => setDate(e.detail.value ?? '')} />
                  </IonItem>
                  <div className="input-grid">
                    {splitFieldConfig[activeSplit].fields.map(field => (
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

                  <div className="exercise-grid">
                    {splitPlans[activeSplit].map(exercise => (
                      <div key={exercise.name} className="exercise-card">
                        <h3>{exercise.name}</h3>
                        <p className="exercise-target">Targets: {exercise.target}</p>
                        <div className="exercise-meta">
                          <span>{exercise.sets}</span>
                          <span>{exercise.reps}</span>
                        </div>
                        <p className="exercise-description">{exercise.description}</p>
                      </div>
                    ))}
                  </div>

                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          {displayRecords.length > 0 && (
            <div className="panel chart-panel">
              <div className="section-title">
                <IonIcon icon={analytics} />
                <span>Progress Chart</span>
              </div>
              <div className="chart-segment-wrap">
                <IonSegment value={chartSplit} onIonChange={e => setChartSplit(e.detail.value as SplitKey)}>
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
              <div className="chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {displayRecords.length > 0 && (
            <>
              <div className="records-table-wrap">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Split</th>
                        <th>Workouts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayRecords.map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.splitType}</td>
                          <td>
                            {splitFieldConfig[record.splitType].fields.map(field => (
                              `${field.label}: ${getWorkoutValue(record, field.key)} kg`
                            )).join(' • ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="records-list-wrap">
                <IonGrid>
                  <IonRow>
                    {displayRecords.map((record, index) => (
                      <IonCol key={index} size="12" sizeMd="6">
                        <IonCard>
                          <IonCardContent>
                            <div className="record-card-title">{record.date}</div>
                            <div className="record-card-meta">Split: {record.splitType}</div>
                            {splitFieldConfig[record.splitType].fields.map(field => (
                              <div key={field.key} className="record-card-meta">
                                {field.label}: {getWorkoutValue(record, field.key)} kg
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
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MuscleGainTracker;