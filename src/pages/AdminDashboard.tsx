import React, { useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from "@ionic/react";

import "./AdminDashboard.css";
function loadPayments() {
  const payments = JSON.parse(localStorage.getItem("payments") || "[]");
  console.log("Loaded Payments:", payments);

  // Example: update a table dynamically
  const table = document.getElementById("paymentsTable");
  if (table) {
    table.innerHTML = payments
      .map(
        (p: any) =>
          `<tr><td>${p.memberName}</td><td>${p.amount}</td><td>${p.date}</td></tr>`
      )
      .join("");
  }
}
const AdminDashboard: React.FC = () => {
  useEffect(() => {
    // Load counts & data on mount
    updateEquipmentCount();
    checkMaintenanceNotifications();
  }, []);

  function openModal(id: string) {
    document.getElementById(id)?.classList.add("active");
    if (id === "paymentsModal") loadPayments();
    if (id === "attendanceModal") generateAttendanceQR();
  }

  function closeModal(id: string) {
    document.getElementById(id)?.classList.remove("active");
  }

  function updateEquipmentCount() {
    const records = JSON.parse(localStorage.getItem("equipments") || "[]");
    const el = document.getElementById("totalEquipment");
    if (el) el.textContent = records.length;
  }

  function generateAttendanceQR() {
    const today = new Date();
    const todayStr = today.toDateString();

    const qrContainer = document.getElementById("qrcode");
    if (!qrContainer) return;

    qrContainer.innerHTML = "";
    new (window as any).QRCode(qrContainer, {
      text: "Attendance - " + todayStr,
      width: 200,
      height: 200,
    });

    const dateEl = document.getElementById("todayDate");
    if (dateEl) dateEl.textContent = todayStr;
  }

  function checkMaintenanceNotifications() {
    const records = JSON.parse(localStorage.getItem("equipments") || "[]");
    const today = new Date().toISOString().split("T")[0];
    records.forEach((rec: any) => {
      if (rec.nextSchedule && rec.nextSchedule <= today) {
        alert(
          `⚠️ Reminder: "${rec.equipName}" is due for maintenance (scheduled: ${rec.nextSchedule})`
        );
      }
    });
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Admin Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding dashboard-body">
        <div className="dashboard-container">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="profile">
              <div className="avatar">A</div>
              <div>
                <span className="text-secondary">Welcome back</span>
                <div className="name" id="whoami">
                  Admin
                </div>
              </div>
            </div>

            <nav>
              <ul className="nav-menu">
                <li>
                  <button className="nav-link active">
                    <i className="fas fa-home"></i> Dashboard
                  </button>
                </li>
                <li>
                  <button className="nav-link" onClick={() => openModal("equipmentsModal")}>
                    <i className="fas fa-dumbbell"></i> Equipment
                  </button>
                </li>
                <li>
                  <button className="nav-link" onClick={() => openModal("paymentsModal")}>
                    <i className="fas fa-credit-card"></i> Payments
                  </button>
                </li>
                <li>
                  <button className="nav-link" onClick={() => openModal("attendanceModal")}>
                    <i className="fas fa-calendar-check"></i> Attendance
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <header className="page-header">
              <h1>Dashboard Overview</h1>
              <p className="text-secondary">
                Welcome back to your admin dashboard
              </p>
            </header>

            {/* Dashboard Stats */}
            <section className="dashboard-stats">
              <div className="stat-card">
                <i className="fas fa-users icon"></i>
                <h3>Total Members</h3>
                <p className="stat-number" id="totalMembers">
                  0
                </p>
                <p className="stat-label">Active members</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-dumbbell icon"></i>
                <h3>Equipment</h3>
                <p className="stat-number" id="totalEquipment">
                  0
                </p>
                <p className="stat-label">Total equipment</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-money-bill-wave icon"></i>
                <h3>Revenue</h3>
                <p className="stat-number" id="totalRevenue">
                  ₱0
                </p>
                <p className="stat-label">This month</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-clipboard-check icon"></i>
                <h3>Attendance</h3>
                <p className="stat-number" id="todayAttendance">
                  0
                </p>
                <p className="stat-label">Today's check-ins</p>
              </div>
            </section>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminDashboard;