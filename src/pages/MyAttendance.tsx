import React, { useEffect, useState } from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import './MyAttendance.css';

const MyAttendance: React.FC = () => {
  const [attendance, setAttendance] = useState<string[]>([]);

  useEffect(() => {
    // Load data from localStorage (same logic as before)
    const currentUser = localStorage.getItem("currentUser") || "demo_member";
    const data = JSON.parse(localStorage.getItem("attendance") || "{}");
    if (data[currentUser] && Array.isArray(data[currentUser].attendance)) {
      setAttendance(data[currentUser].attendance);
    }
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Attendance</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 className="attendance-title">My Attendance</h2>
        <ul className="attendance-list">
          {attendance.length > 0 ? (
            attendance.map((day, index) => (
              <li key={index}>✅ {day}</li>
            ))
          ) : (
            <li>No attendance records yet.</li>
          )}
        </ul>
      </IonContent>
    </IonPage>
  );
};

export default MyAttendance;