import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";
import "./AdminAttendance.css";

interface AttendanceRecord {
  memberId: string;
  fullName: string;
  date: string;
  time: string;
  status: string;
}

const AdminAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Load attendance on mount
  useEffect(() => {
    loadAttendance();

    // 🔹 Example demo scans — remove later
    simulateQRScan("M001", "John Doe");
    simulateQRScan("M002", "Jane Smith");
  }, []);

  function simulateQRScan(memberId: string, fullName: string) {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0];

    let stored = JSON.parse(localStorage.getItem("attendance") || "[]");
    stored.push({ memberId, fullName, date, time, status: "Present" });

    localStorage.setItem("attendance", JSON.stringify(stored));
    loadAttendance();
  }

  function loadAttendance() {
    const today = new Date().toISOString().split("T")[0];
    const stored = JSON.parse(localStorage.getItem("attendance") || "[]");
    const todaysRecords = stored.filter((r: AttendanceRecord) => r.date === today);
    setRecords(todaysRecords);
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Attendance Management</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="main">
          <h1>Today's Attendance</h1>
          <p>Members who scanned their QR code today</p>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((r, index) => (
                    <tr key={index}>
                      <td>{r.fullName}</td>
                      <td>{r.date}</td>
                      <td>{r.time}</td>
                      <td>
                        <span className="status present">{r.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      No attendance records for today
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminAttendance;