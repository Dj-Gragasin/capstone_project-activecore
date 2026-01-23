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
  IonCard,
  IonCardContent,
} from '@ionic/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calendar, analytics } from 'ionicons/icons';
import './ProgressTracker.css';
import { API_CONFIG } from '../config/api.config';

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

interface ProgressRecord {
  id?: number;
  date: string;
  weight: number;
  bmi: number;
  notes: string;
}

const ProgressTracker: React.FC = () => {
  const [records, setRecords] = useState<ProgressRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [notes, setNotes] = useState('');

  const loadRecords = async () => {
    const token = localStorage.getItem('token') || '';

    // If not logged in, fall back to local-only storage.
    if (!token) {
      const stored = localStorage.getItem('progressRecords');
      if (stored) setRecords(JSON.parse(stored));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/progress/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to load records');
      }
      const nextRecords = Array.isArray(data.records) ? data.records : [];
      setRecords(nextRecords);
      // keep a local cache as a fallback for offline mode
      localStorage.setItem('progressRecords', JSON.stringify(nextRecords));
    } catch (err) {
      const stored = localStorage.getItem('progressRecords');
      if (stored) setRecords(JSON.parse(stored));
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleUpdate = () => {
    if (!weight || !bmi) {
      alert('Please enter both weight and BMI');
      return;
    }

    const newRecord: ProgressRecord = {
      date,
      weight: parseFloat(weight),
      bmi: parseFloat(bmi),
      notes
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Persist to server when logged in; otherwise local-only.
    const token = localStorage.getItem('token') || '';
    if (!token) {
      setRecords(updatedRecords);
      localStorage.setItem('progressRecords', JSON.stringify(updatedRecords));
      clearForm();
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/progress/records`, {
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
        localStorage.setItem('progressRecords', JSON.stringify(nextRecords));
        clearForm();
      } catch (e: any) {
        setRecords(updatedRecords);
        localStorage.setItem('progressRecords', JSON.stringify(updatedRecords));
        clearForm();
        alert(`Saved locally only (server sync failed): ${e?.message || 'unknown error'}`);
      }
    })();
  };

  const clearForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setWeight('');
    setBmi('');
    setNotes('');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all records?')) {
      const token = localStorage.getItem('token') || '';
      if (!token) {
        setRecords([]);
        localStorage.removeItem('progressRecords');
        clearForm();
        return;
      }

      (async () => {
        try {
          const res = await fetch(`${API_URL}/progress/records`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok || !data?.success) {
            throw new Error(data?.message || 'Failed to delete records');
          }
          setRecords([]);
          localStorage.removeItem('progressRecords');
          clearForm();
        } catch (e: any) {
          alert(`Failed to delete from server: ${e?.message || 'unknown error'}`);
        }
      })();
    }
  };

  const handleDeleteRecord = (index: number) => {
    if (window.confirm('Delete this record?')) {
      const token = localStorage.getItem('token') || '';
      const record = records[index];

      // If server-backed record (has id) and logged in, delete on server.
      if (token && record?.id) {
        (async () => {
          try {
            const res = await fetch(`${API_URL}/progress/records/${record.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || !data?.success) {
              throw new Error(data?.message || 'Failed to delete record');
            }
            const updatedRecords = records.filter((_, i) => i !== index);
            setRecords(updatedRecords);
            localStorage.setItem('progressRecords', JSON.stringify(updatedRecords));
          } catch (e: any) {
            alert(`Failed to delete from server: ${e?.message || 'unknown error'}`);
          }
        })();
        return;
      }

      // Local-only fallback.
      const updatedRecords = records.filter((_, i) => i !== index);
      setRecords(updatedRecords);
      localStorage.setItem('progressRecords', JSON.stringify(updatedRecords));
    }
  };

  const chartData: ChartData<'line'> = {
    labels: records.map(r => r.date),
    datasets: [
      {
        label: 'Weight (kg)',
        data: records.map(r => r.weight),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'BMI',
        data: records.map(r => r.bmi),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          },
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Progress Timeline',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Weight (kg)',
          color: '#ffffff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'BMI',
          color: '#ffffff'
        },
        grid: {
          drawOnChartArea: false
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
          },
          maxRotation: 45
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
          <IonTitle>Progress Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding progress-tracker-content">
        <IonGrid fixed>
          <IonRow className="form-container">
            <IonCol size="12" sizeMd="6">
              <div className="form-section">
                <div className="form-section-title">
                  <IonIcon icon={calendar} />
                  <span>Date & Weight Details</span>
                </div>
                <IonItem>
                  <IonLabel position="stacked">Date</IonLabel>
                  <IonInput type="date" value={date} onIonChange={e => setDate(e.detail.value!)} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Weight (kg)</IonLabel>
                  <IonInput
                    type="number"
                    value={weight}
                    onIonChange={e => setWeight(e.detail.value!)}
                    placeholder="Enter your weight"
                  />
                </IonItem>
              </div>
            </IonCol>

            <IonCol size="12" sizeMd="6">
              <div className="form-section">
                <div className="form-section-title">
                  <IonIcon icon={analytics} />
                  <span>BMI & Notes</span>
                </div>
                <IonItem>
                  <IonLabel position="stacked">BMI</IonLabel>
                  <IonInput
                    type="number"
                    value={bmi}
                    onIonChange={e => setBmi(e.detail.value!)}
                    placeholder="Enter your BMI"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Notes</IonLabel>
                  <IonInput value={notes} onIonChange={e => setNotes(e.detail.value!)} placeholder="Add notes" />
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
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
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
                      <th>Weight (kg)</th>
                      <th>BMI</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, index) => (
                      <tr key={index}>
                        <td>{record.date}</td>
                        <td>{record.weight}</td>
                        <td>{record.bmi}</td>
                        <td>{record.notes}</td>
                        <td>
                          <IonButton
                            fill="clear"
                            color="danger"
                            size="small"
                            onClick={() => handleDeleteRecord(index)}
                          >
                            Delete
                          </IonButton>
                        </td>
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
                    <IonCol key={index} size="12">
                      <IonCard>
                        <IonCardContent>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 700 }}>{record.date}</div>
                              <div style={{ color: '#b0b0b0', fontSize: 13 }}>{record.notes || '—'}</div>
                            </div>
                            <IonButton
                              color="danger"
                              fill="outline"
                              size="small"
                              onClick={() => handleDeleteRecord(index)}
                            >
                              Delete
                            </IonButton>
                          </div>

                          <IonGrid style={{ padding: 0, marginTop: 12 }}>
                            <IonRow>
                              <IonCol size="6">
                                <div style={{ color: '#b0b0b0', fontSize: 12 }}>Weight</div>
                                <div style={{ fontWeight: 700 }}>{record.weight} kg</div>
                              </IonCol>
                              <IonCol size="6">
                                <div style={{ color: '#b0b0b0', fontSize: 12 }}>BMI</div>
                                <div style={{ fontWeight: 700 }}>{record.bmi}</div>
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

export default ProgressTracker;