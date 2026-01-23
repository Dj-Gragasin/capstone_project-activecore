import React, { useState, useEffect } from 'react';
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
  IonSelect,
  IonCard,
  IonCardContent,
  IonSelectOption,
} from '@ionic/react';
import {
  barbell,
  analytics,
} from 'ionicons/icons';
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
import { Line, Bar } from 'react-chartjs-2';
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

interface MuscleGainRecord {
  date: string;
  measurements: {
    chest: number;
    arms: number;
    shoulders: number;
    back: number;
    legs: number;
  };
  strengthStats: {
    benchPress: number;
    deadlift: number;
    squat: number;
  };
  proteinIntake: number;
  notes: string;
}

const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const getMeasurement = (r: any, key: keyof MuscleGainRecord['measurements']): number => {
  // Supports both canonical shape: r.measurements.key and legacy/flattened shape: r.key
  return toNumber(r?.measurements?.[key] ?? r?.[key]);
};

const getStrength = (r: any, key: keyof MuscleGainRecord['strengthStats']): number => {
  // Supports both canonical shape: r.strengthStats.key and legacy/flattened shape: r.key
  return toNumber(r?.strengthStats?.[key] ?? r?.[key]);
};

const MuscleGainTracker: React.FC = () => {
  const [records, setRecords] = useState<MuscleGainRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [measurements, setMeasurements] = useState({
    chest: '',
    arms: '',
    shoulders: '',
    back: '',
    legs: ''
  });
  const [strengthStats, setStrengthStats] = useState({
    benchPress: '',
    deadlift: '',
    squat: ''
  });
  const [proteinIntake, setProteinIntake] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedChart, setSelectedChart] = useState('measurements');

  const loadRecords = async () => {
    const token = localStorage.getItem('token') || '';

    // If not logged in, fall back to local-only storage.
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
      // Fallback to local cache so the page still works if offline,
      // but note: this does NOT sync across devices.
      const stored = localStorage.getItem('muscleGainRecords');
      if (stored) setRecords(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleUpdate = () => {
    if (!validateInputs()) {
      alert('Please fill in all required fields');
      return;
    }

    const newRecord: MuscleGainRecord = {
      date,
      measurements: {
        chest: parseFloat(measurements.chest),
        arms: parseFloat(measurements.arms),
        shoulders: parseFloat(measurements.shoulders),
        back: parseFloat(measurements.back),
        legs: parseFloat(measurements.legs)
      },
      strengthStats: {
        benchPress: parseFloat(strengthStats.benchPress),
        deadlift: parseFloat(strengthStats.deadlift),
        squat: parseFloat(strengthStats.squat)
      },
      proteinIntake: parseFloat(proteinIntake),
      notes
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Persist to server when logged in; otherwise local-only.
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
        // keep a local cache as a fallback for offline mode
        localStorage.setItem('muscleGainRecords', JSON.stringify(nextRecords));
        clearForm();
      } catch (e: any) {
        // If server save fails, keep local so user doesn't lose the entry.
        setRecords(updatedRecords);
        localStorage.setItem('muscleGainRecords', JSON.stringify(updatedRecords));
        clearForm();
        alert(`Saved locally only (server sync failed): ${e?.message || 'unknown error'}`);
      }
    })();
  };

  const validateInputs = () => {
    return (
      measurements.chest &&
      measurements.arms &&
      measurements.shoulders &&
      measurements.back &&
      measurements.legs &&
      strengthStats.benchPress &&
      strengthStats.deadlift &&
      strengthStats.squat &&
      proteinIntake
    );
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setMeasurements({
      chest: '',
      arms: '',
      shoulders: '',
      back: '',
      legs: ''
    });
    setStrengthStats({
      benchPress: '',
      deadlift: '',
      squat: ''
    });
    setProteinIntake('');
    setNotes('');
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

  const measurementsChartData = {
    labels: records.map(r => r.date),
    datasets: [
      {
        label: 'Chest (cm)',
        data: records.map(r => getMeasurement(r, 'chest')),
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.4
      },
      {
        label: 'Arms (cm)',
        data: records.map(r => getMeasurement(r, 'arms')),
        borderColor: '#4ECDC4',
        backgroundColor: 'rgba(78, 205, 196, 0.1)',
        tension: 0.4
      },
      {
        label: 'Shoulders (cm)',
        data: records.map(r => getMeasurement(r, 'shoulders')),
        borderColor: '#45B7D1',
        backgroundColor: 'rgba(69, 183, 209, 0.1)',
        tension: 0.4
      },
      {
        label: 'Back (cm)',
        data: records.map(r => getMeasurement(r, 'back')),
        borderColor: '#F7B801',
        backgroundColor: 'rgba(247, 184, 1, 0.1)',
        tension: 0.4
      },
      {
        label: 'Legs (cm)',
        data: records.map(r => getMeasurement(r, 'legs')),
        borderColor: '#9B5DE5',
        backgroundColor: 'rgba(155, 93, 229, 0.1)',
        tension: 0.4
      }
    ]
  };

  const strengthChartData = {
    labels: records.map(r => r.date),
    datasets: [
      {
        label: 'Bench Press (kg)',
        data: records.map(r => getStrength(r, 'benchPress')),
        backgroundColor: '#FF6B6B'
      },
      {
        label: 'Deadlift (kg)',
        data: records.map(r => getStrength(r, 'deadlift')),
        backgroundColor: '#4ECDC4'
      },
      {
        label: 'Squat (kg)',
        data: records.map(r => getStrength(r, 'squat')),
        backgroundColor: '#45B7D1'
      }
    ]
  };

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff'
        }
      },
      title: {
        display: true,
        text: selectedChart === 'measurements' ? 'Body Measurements Progress' : 'Strength Progress',
        color: '#ffffff',
        font: {
          size: 16
        }
      }
    }
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
        <IonGrid fixed>
          <IonRow className="form-container">
            <IonCol size="12" sizeMd="6">
              <div className="form-section">
                <div className="form-section-title">
                  <IonIcon icon={barbell} />
                  <span>Body Measurements</span>
                </div>
                <div className="form-section-description">Track your body measurements in centimeters</div>
                <IonItem>
                  <IonLabel position="stacked">Date</IonLabel>
                  <IonInput type="date" value={date} onIonChange={e => setDate(e.detail.value!)} />
                </IonItem>
                {Object.entries(measurements).map(([key, value]) => (
                  <IonItem key={key}>
                    <IonLabel position="stacked">{key.charAt(0).toUpperCase() + key.slice(1)} (cm)</IonLabel>
                    <IonInput
                      type="number"
                      value={value}
                      onIonChange={e =>
                        setMeasurements(prev => ({
                          ...prev,
                          [key]: e.detail.value!,
                        }))
                      }
                      placeholder={`Enter ${key} measurement`}
                    />
                  </IonItem>
                ))}
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="6">
              <div className="form-section">
                <div className="form-section-title">
                  <IonIcon icon={analytics} />
                  <span>Strength Stats</span>
                </div>
                <div className="form-section-description">Record your lifting achievements in kilograms</div>
                {Object.entries(strengthStats).map(([key, value]) => (
                  <IonItem key={key}>
                    <IonLabel position="stacked">{key.replace(/([A-Z])/g, ' $1').trim()} (kg)</IonLabel>
                    <IonInput
                      type="number"
                      value={value}
                      onIonChange={e =>
                        setStrengthStats(prev => ({
                          ...prev,
                          [key]: e.detail.value!,
                        }))
                      }
                      placeholder={`Enter ${key}`}
                    />
                  </IonItem>
                ))}
                <IonItem>
                  <IonLabel position="stacked">Daily Protein Intake (g)</IonLabel>
                  <IonInput
                    type="number"
                    value={proteinIntake}
                    onIonChange={e => setProteinIntake(e.detail.value!)}
                    placeholder="Enter daily protein intake"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Notes</IonLabel>
                  <IonInput value={notes} onIonChange={e => setNotes(e.detail.value!)} placeholder="Add any notes" />
                </IonItem>
              </div>
            </IonCol>
          </IonRow>

          <IonRow className="button-container">
            <IonCol size="12" sizeMd="4">
              <IonButton expand="block" onClick={clearForm} fill="outline">
                Clear Form
              </IonButton>
            </IonCol>
            <IonCol size="12" sizeMd="4">
              <IonButton expand="block" onClick={handleUpdate}>
                Update Progress
              </IonButton>
            </IonCol>
            <IonCol size="12" sizeMd="4">
              <IonButton expand="block" onClick={handleDeleteAll} color="danger" fill="outline">
                Delete All
              </IonButton>
            </IonCol>
          </IonRow>
        </IonGrid>

        {records.length > 0 && (
          <div className="charts-container">
            <div className="chart-controls">
              <IonItem>
                <IonLabel>Chart</IonLabel>
                <IonSelect value={selectedChart} onIonChange={(e) => setSelectedChart(e.detail.value)} interface="popover">
                  <IonSelectOption value="measurements">Measurements</IonSelectOption>
                  <IonSelectOption value="strength">Strength</IonSelectOption>
                </IonSelect>
              </IonItem>
            </div>
            
            <div className="chart-container">
              {selectedChart === 'measurements' ? (
                <Line key="measurements" data={measurementsChartData} options={chartOptions as ChartOptions<'line'>} />
              ) : (
                <Bar key="strength" data={strengthChartData} options={chartOptions as ChartOptions<'bar'>} />
              )}
            </div>
          </div>
        )}

        {records.length > 0 && (
          <>
            {/* Desktop/tablet table */}
            <div className="records-table-wrap">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      {selectedChart === 'measurements' ? (
                        <>
                          <th>Chest</th>
                          <th>Arms</th>
                          <th>Shoulders</th>
                          <th>Back</th>
                          <th>Legs</th>
                        </>
                      ) : (
                        <>
                          <th>Bench</th>
                          <th>Deadlift</th>
                          <th>Squat</th>
                        </>
                      )}
                      <th>Protein</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index}>
                        <td>{record.date}</td>
                        {selectedChart === 'measurements' ? (
                          <>
                            <td>{getMeasurement(record, 'chest')} cm</td>
                            <td>{getMeasurement(record, 'arms')} cm</td>
                            <td>{getMeasurement(record, 'shoulders')} cm</td>
                            <td>{getMeasurement(record, 'back')} cm</td>
                            <td>{getMeasurement(record, 'legs')} cm</td>
                          </>
                        ) : (
                          <>
                            <td>{getStrength(record, 'benchPress')} kg</td>
                            <td>{getStrength(record, 'deadlift')} kg</td>
                            <td>{getStrength(record, 'squat')} kg</td>
                          </>
                        )}
                        <td>{toNumber((record as any)?.proteinIntake)} g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile stacked cards */}
            <div className="records-list-wrap">
              <IonGrid>
                <IonRow>
                  {records.map((record, index) => (
                    <IonCol key={index} size="12" sizeMd="6">
                      <IonCard>
                        <IonCardContent>
                          <div style={{ fontWeight: 700, marginBottom: 10 }}>{record.date}</div>
                          <IonGrid style={{ padding: 0 }}>
                            <IonRow>
                              {selectedChart === 'measurements' ? (
                                <>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Chest</div>
                                    <div style={{ fontWeight: 700 }}>{getMeasurement(record, 'chest')} cm</div>
                                  </IonCol>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Arms</div>
                                    <div style={{ fontWeight: 700 }}>{getMeasurement(record, 'arms')} cm</div>
                                  </IonCol>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Shoulders</div>
                                    <div style={{ fontWeight: 700 }}>{getMeasurement(record, 'shoulders')} cm</div>
                                  </IonCol>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Back</div>
                                    <div style={{ fontWeight: 700 }}>{getMeasurement(record, 'back')} cm</div>
                                  </IonCol>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Legs</div>
                                    <div style={{ fontWeight: 700 }}>{getMeasurement(record, 'legs')} cm</div>
                                  </IonCol>
                                </>
                              ) : (
                                <>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Bench</div>
                                    <div style={{ fontWeight: 700 }}>{getStrength(record, 'benchPress')} kg</div>
                                  </IonCol>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Deadlift</div>
                                    <div style={{ fontWeight: 700 }}>{getStrength(record, 'deadlift')} kg</div>
                                  </IonCol>
                                  <IonCol size="6">
                                    <div style={{ color: '#b0b0b0', fontSize: 12 }}>Squat</div>
                                    <div style={{ fontWeight: 700 }}>{getStrength(record, 'squat')} kg</div>
                                  </IonCol>
                                </>
                              )}
                              <IonCol size="6">
                                <div style={{ color: '#b0b0b0', fontSize: 12 }}>Protein</div>
                                <div style={{ fontWeight: 700 }}>{toNumber((record as any)?.proteinIntake)} g</div>
                              </IonCol>
                            </IonRow>
                          </IonGrid>
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default MuscleGainTracker;