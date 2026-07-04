import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonIcon,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { barbell, analytics, add, remove, nutrition, fitness } from 'ionicons/icons';
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

interface ExerciseEntry {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
  notes: string;
}

interface MuscleGainRecord {
  date: string;
  measurements?: {
    bodyWeight?: number;
    waist?: number;
    bodyFat?: number;
  };
  strengthStats: {
    benchPress: number;
    deadlift: number;
    squat: number;
  };
  exercises?: ExerciseEntry[];
  proteinIntake: number;
  calories?: number;
  notes: string;
}

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const createExerciseEntry = (name = ''): ExerciseEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  sets: '',
  reps: '',
  weight: '',
  notes: '',
});

const getStrength = (r: any, key: keyof MuscleGainRecord['strengthStats']): number => {
  return toNumber(r?.strengthStats?.[key] ?? r?.[key]);
};

const getRecordExercises = (record: any): ExerciseEntry[] => {
  if (Array.isArray(record?.exercises)) {
    return record.exercises;
  }

  return [];
};

const getWorkoutVolume = (record: any): number => {
  const exercises = getRecordExercises(record);
  if (exercises.length > 0) {
    return exercises.reduce((sum: number, exercise: any) => {
      return sum + toNumber(exercise?.weight) * toNumber(exercise?.sets) * toNumber(exercise?.reps);
    }, 0);
  }

  return (
    getStrength(record, 'benchPress') +
    getStrength(record, 'deadlift') +
    getStrength(record, 'squat')
  ) * 3;
};

const MuscleGainTracker: React.FC = () => {
  const [records, setRecords] = useState<MuscleGainRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [bodyWeight, setBodyWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [exerciseEntries, setExerciseEntries] = useState<ExerciseEntry[]>([createExerciseEntry('Bench Press')]);
  const [proteinIntake, setProteinIntake] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  const loadRecords = async () => {
    const token = localStorage.getItem('token') || '';

    if (!token) {
      const stored = localStorage.getItem('muscleGainRecords');
      if (stored) setRecords(JSON.parse(stored));
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
      setRecords(Array.isArray(data.records) ? data.records : []);
    } catch (err) {
      const stored = localStorage.getItem('muscleGainRecords');
      if (stored) setRecords(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const updateExercise = (id: string, field: keyof ExerciseEntry, value: string) => {
    setExerciseEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, [field]: value } : entry))
    );
  };

  const addExercise = () => {
    setExerciseEntries(prev => [...prev, createExerciseEntry('')]);
  };

  const removeExercise = (id: string) => {
    setExerciseEntries(prev => (prev.length > 1 ? prev.filter(entry => entry.id !== id) : prev));
  };

  const validateInputs = () => {
    const filledExercises = exerciseEntries.filter(entry => entry.name && entry.sets && entry.reps && entry.weight);
    return Boolean(date) && filledExercises.length > 0 && proteinIntake;
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setBodyWeight('');
    setWaist('');
    setBodyFat('');
    setExerciseEntries([createExerciseEntry('Bench Press')]);
    setProteinIntake('');
    setCalories('');
    setNotes('');
  };

  const handleUpdate = () => {
    if (!validateInputs()) {
      alert('Please complete the workout details, at least one exercise, and protein intake.');
      return;
    }

    const filledExercises = exerciseEntries.filter(entry => entry.name && entry.sets && entry.reps && entry.weight);
    const newRecord: MuscleGainRecord = {
      date,
      measurements: {
        bodyWeight: parseFloat(bodyWeight) || undefined,
        waist: parseFloat(waist) || undefined,
        bodyFat: parseFloat(bodyFat) || undefined,
      },
      strengthStats: {
        benchPress: Number(
          filledExercises.find(entry => /bench/i.test(entry.name))?.weight || 0
        ),
        deadlift: Number(
          filledExercises.find(entry => /deadlift/i.test(entry.name))?.weight || 0
        ),
        squat: Number(
          filledExercises.find(entry => /squat/i.test(entry.name))?.weight || 0
        ),
      },
      exercises: filledExercises.map(entry => ({
        id: entry.id,
        name: entry.name.trim(),
        sets: entry.sets,
        reps: entry.reps,
        weight: entry.weight,
        notes: entry.notes,
      })),
      proteinIntake: parseFloat(proteinIntake),
      calories: parseFloat(calories) || undefined,
      notes,
    };

    const updatedRecords = [...records, newRecord].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const token = localStorage.getItem('token') || '';
    if (!token) {
      setRecords(updatedRecords);
      localStorage.setItem('muscleGainRecords', JSON.stringify(updatedRecords));
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

        const nextRecords = Array.isArray(data.records) ? data.records : updatedRecords;
        setRecords(nextRecords);
        localStorage.setItem('muscleGainRecords', JSON.stringify(nextRecords));
        clearForm();
      } catch (e: any) {
        setRecords(updatedRecords);
        localStorage.setItem('muscleGainRecords', JSON.stringify(updatedRecords));
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

  const latestRecord = records[records.length - 1];
  const totalVolume = records.reduce((sum, record) => sum + getWorkoutVolume(record), 0);
  const totalExercisesLogged = records.reduce((sum, record) => sum + getRecordExercises(record).length, 0);
  const averageProtein = records.length > 0 ? Math.round(records.reduce((sum, record) => sum + toNumber(record.proteinIntake), 0) / records.length) : 0;

  const progressChartData = {
    labels: records.map(record => record.date),
    datasets: [
      {
        label: 'Workout Volume',
        data: records.map(record => getWorkoutVolume(record)),
        backgroundColor: 'rgba(34, 211, 238, 0.8)',
        borderColor: 'rgba(34, 211, 238, 1)',
        borderWidth: 1,
      },
      {
        label: 'Protein (g)',
        data: records.map(record => toNumber(record.proteinIntake)),
        backgroundColor: 'rgba(251, 191, 36, 0.8)',
        borderColor: 'rgba(251, 191, 36, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#ffffff' },
      },
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#ffffff' },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#ffffff' },
      },
      title: {
        display: true,
        text: 'Training Progress',
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
          <div className="tracker-hero">
            <div>
              <p className="hero-eyebrow">Fitness-focused training log</p>
              <h2>Track workouts like a modern gym app.</h2>
              <p>Log multiple exercises, reps, sets, food intake, and body metrics in one place.</p>
            </div>
            <div className="hero-badge">Fit-style layout</div>
          </div>

          <IonGrid fixed>
            <IonRow>
              <IonCol size="12" sizeLg="7">
                <div className="panel">
                  <div className="panel-title">
                    <IonIcon icon={barbell} />
                    <span>Workout Entry</span>
                  </div>

                  <div className="panel-description">Add your training day with exercises, sets, reps, weight, and nutrition.</div>

                  <IonItem className="tracker-input">
                    <IonLabel position="stacked">Date</IonLabel>
                    <IonInput type="date" value={date} onIonChange={e => setDate(e.detail.value ?? '')} />
                  </IonItem>

                  <div className="metric-grid">
                    <IonItem className="tracker-input">
                      <IonLabel position="stacked">Body Weight (kg)</IonLabel>
                      <IonInput type="number" value={bodyWeight} onIonChange={e => setBodyWeight(e.detail.value ?? '')} placeholder="75" />
                    </IonItem>
                    <IonItem className="tracker-input">
                      <IonLabel position="stacked">Waist (cm)</IonLabel>
                      <IonInput type="number" value={waist} onIonChange={e => setWaist(e.detail.value ?? '')} placeholder="82" />
                    </IonItem>
                    <IonItem className="tracker-input">
                      <IonLabel position="stacked">Body Fat (%)</IonLabel>
                      <IonInput type="number" value={bodyFat} onIonChange={e => setBodyFat(e.detail.value ?? '')} placeholder="16" />
                    </IonItem>
                  </div>

                  <div className="exercise-list">
                    {exerciseEntries.map((entry, index) => (
                      <div key={entry.id} className="exercise-card">
                        <div className="exercise-card-header">
                          <strong>Exercise {index + 1}</strong>
                          {exerciseEntries.length > 1 && (
                            <IonButton fill="clear" color="danger" size="small" onClick={() => removeExercise(entry.id)}>
                              <IonIcon icon={remove} slot="icon-only" />
                            </IonButton>
                          )}
                        </div>

                        <div className="exercise-grid">
                          <IonItem className="tracker-input">
                            <IonLabel position="stacked">Exercise Name</IonLabel>
                            <IonInput value={entry.name} onIonChange={e => updateExercise(entry.id, 'name', e.detail.value ?? '')} placeholder="Pull Ups" />
                          </IonItem>
                          <IonItem className="tracker-input">
                            <IonLabel position="stacked">Sets</IonLabel>
                            <IonInput type="number" value={entry.sets} onIonChange={e => updateExercise(entry.id, 'sets', e.detail.value ?? '')} placeholder="3" />
                          </IonItem>
                          <IonItem className="tracker-input">
                            <IonLabel position="stacked">Reps</IonLabel>
                            <IonInput type="number" value={entry.reps} onIonChange={e => updateExercise(entry.id, 'reps', e.detail.value ?? '')} placeholder="10" />
                          </IonItem>
                          <IonItem className="tracker-input">
                            <IonLabel position="stacked">Weight (kg)</IonLabel>
                            <IonInput type="number" value={entry.weight} onIonChange={e => updateExercise(entry.id, 'weight', e.detail.value ?? '')} placeholder="40" />
                          </IonItem>
                        </div>

                        <IonItem className="tracker-input">
                          <IonLabel position="stacked">Exercise Notes</IonLabel>
                          <IonInput value={entry.notes} onIonChange={e => updateExercise(entry.id, 'notes', e.detail.value ?? '')} placeholder="Focus on slow tempo" />
                        </IonItem>
                      </div>
                    ))}
                  </div>

                  <IonButton expand="block" fill="outline" onClick={addExercise} className="add-exercise-btn">
                    <IonIcon icon={add} slot="start" />
                    Add Another Exercise
                  </IonButton>

                  <div className="metric-grid">
                    <IonItem className="tracker-input">
                      <IonLabel position="stacked">Protein Intake (g)</IonLabel>
                      <IonInput type="number" value={proteinIntake} onIonChange={e => setProteinIntake(e.detail.value ?? '')} placeholder="180" />
                    </IonItem>
                    <IonItem className="tracker-input">
                      <IonLabel position="stacked">Calories</IonLabel>
                      <IonInput type="number" value={calories} onIonChange={e => setCalories(e.detail.value ?? '')} placeholder="2600" />
                    </IonItem>
                  </div>

                  <IonItem className="tracker-input">
                    <IonLabel position="stacked">Training Notes</IonLabel>
                    <IonInput value={notes} onIonChange={e => setNotes(e.detail.value ?? '')} placeholder="Energy level, hydration, soreness, and goals" />
                  </IonItem>
                </div>
              </IonCol>

              <IonCol size="12" sizeLg="5">
                <div className="panel summary-panel">
                  <div className="panel-title">
                    <IonIcon icon={analytics} />
                    <span>Progress Snapshot</span>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Latest Weight</div>
                      <div className="stat-value">{latestRecord?.measurements?.bodyWeight ? `${latestRecord.measurements.bodyWeight} kg` : '—'}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Avg Protein</div>
                      <div className="stat-value">{averageProtein} g</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Workout Volume</div>
                      <div className="stat-value">{totalVolume.toFixed(0)} kg</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Exercises Logged</div>
                      <div className="stat-value">{totalExercisesLogged}</div>
                    </div>
                  </div>

                  <div className="tip-card">
                    <IonIcon icon={nutrition} />
                    <div>
                      <strong>Tip</strong>
                      <p>Pair your lifts with consistent protein intake and recovery to drive muscle gain.</p>
                    </div>
                  </div>

                  <div className="tip-card">
                    <IonIcon icon={fitness} />
                    <div>
                      <strong>Goal</strong>
                      <p>Use the exercise notes section to capture form cues and progression ideas each session.</p>
                    </div>
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>

          <div className="button-row">
            <IonButton expand="block" onClick={clearForm} fill="outline">
              Clear Form
            </IonButton>
            <IonButton expand="block" onClick={handleUpdate}>
              Save Workout
            </IonButton>
            <IonButton expand="block" onClick={handleDeleteAll} color="danger" fill="outline">
              Delete All
            </IonButton>
          </div>

          {records.length > 0 && (
            <div className="charts-container">
              <div className="chart-container">
                <Bar data={progressChartData} options={chartOptions} />
              </div>
            </div>
          )}

          {records.length > 0 && (
            <>
              <div className="records-table-wrap">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Body Weight</th>
                        <th>Protein</th>
                        <th>Exercises</th>
                        <th>Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={index}>
                          <td>{record.date}</td>
                          <td>{record.measurements?.bodyWeight ? `${record.measurements.bodyWeight} kg` : '—'}</td>
                          <td>{toNumber(record.proteinIntake)} g</td>
                          <td>{getRecordExercises(record).length}</td>
                          <td>{getWorkoutVolume(record).toFixed(0)} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="records-list-wrap">
                <IonGrid>
                  <IonRow>
                    {records.map((record, index) => (
                      <IonCol key={index} size="12" sizeMd="6">
                        <IonCard>
                          <IonCardContent>
                            <div className="record-card-title">{record.date}</div>
                            <div className="record-card-meta">Weight: {record.measurements?.bodyWeight ? `${record.measurements.bodyWeight} kg` : '—'}</div>
                            <div className="record-card-meta">Protein: {toNumber(record.proteinIntake)} g</div>
                            <div className="record-card-meta">Exercises: {getRecordExercises(record).length}</div>
                            <div className="record-card-meta">Volume: {getWorkoutVolume(record).toFixed(0)} kg</div>
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