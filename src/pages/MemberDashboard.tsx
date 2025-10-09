import React, { useEffect, useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  useIonRouter,
  IonIcon
} from "@ionic/react";
import { barbell } from 'ionicons/icons';
import "./MemberDashboard.css";

const MemberDashboard: React.FC = () => {
  const [memberName, setMemberName] = useState("John Doe");
  const [firstName, setFirstName] = useState("John");
  const router = useIonRouter();

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        setMemberName(parsedUser.fullName);
        setFirstName(parsedUser.fullName.split(" ")[0]);
      } catch (err) {
        console.error("Invalid user data in localStorage");
      }
    } else {
      // ✅ If no user is found, redirect back to home
      router.push("/home", "root", "replace");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser"); // ✅ Clear user data
    router.push("/home", "root", "replace"); // ✅ Redirect back to home
  };

  // Alternative navigation methods for testing
  const handleQrAttendanceNavigation = () => {
    console.log('QR Attendance clicked');
    
    // Method 1: Try direct router push
    try {
      router.push('/myattendance', 'forward', 'push');
    } catch (error) {
      console.error('Method 1 failed:', error);
      
      // Method 2: Try with different animation
      try {
        router.push('/myattendance', 'root', 'replace');
      } catch (error2) {
        console.error('Method 2 failed:', error2);
        
        // Method 3: Try window location
        window.location.href = '/myattendance';
      }
    }
  };

  // ✅ Navigation handler function with error handling
  const handleNavigation = (path: string) => {
    console.log(`Attempting to navigate to: ${path}`);
    
    // Check if we're in a valid navigation context
    if (!router) {
      console.error('Router is not available');
      return;
    }

    try {
      // Use Ionic router for navigation
      router.push(path, "forward", "push");
      console.log(`Successfully navigated to: ${path}`);
    } catch (error) {
      console.error(`Navigation error for path ${path}:`, error);
      
      // Try alternative navigation method
      try {
        router.push(path, "root", "replace");
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
        alert(`Cannot navigate to ${path}. Please check if the route exists.`);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Member Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="dashboard-container">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="profile-section">
              <div className="profile-avatar">
                <i className="fas fa-user"></i>
              </div>
              <h2 className="profile-name">{memberName}</h2>
              <span className="membership-status">Premium Member</span>
            </div>

            <nav>
              <ul className="nav-menu">
                <li className="nav-item">
                  <button 
                    className="nav-link active"
                    onClick={() => handleNavigation("/member-dashboard")}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-home"></i>
                    Dashboard
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation("/myattendance")}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-calendar-check"></i>
                    QR Attendance
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation("/calorie")}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-calculator"></i>
                    Calorie Calculator
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation("/mealplan")}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-utensils"></i>
                    Meal Plan
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation("/progress")}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-chart-line"></i>
                    Progress
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation("/settings")}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-cog"></i>
                    Settings
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className="nav-link"
                    onClick={() => handleNavigation("/muscle-gain")}
                  >
                    <IonIcon icon={barbell} />
                    Muscle Gain Tracker
                  </button>
                </li>
                {/* ✅ Logout now works */}
                <li className="nav-item">
                  <button
                    className="nav-link logout-btn"
                    onClick={handleLogout}
                    style={{
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    Logout
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="main-content">
            <div className="content-wrapper">
              <header className="page-header">
                <div className="welcome-text">
                  <h1>Welcome back, {firstName}! 👋</h1>
                  <p>Track your fitness journey and achieve your goals</p>
                </div>
                <div className="quick-stats">
                  <span className="attendance-streak">
                    <i className="fas fa-fire"></i>
                    Streak: 5 days
                  </span>
                </div>
              </header>

              <section className="dashboard-grid">
                <div 
                  className="dashboard-card"
                  onClick={() => handleNavigation("/calorie")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fas fa-calculator card-icon"></i>
                  <h3 className="card-title">Check My Calories</h3>
                  <p className="card-description">
                    Calculate your daily calorie needs
                  </p>
                </div>

                <div 
                  className="dashboard-card"
                  onClick={() => handleNavigation("/mealplan")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fas fa-utensils card-icon"></i>
                  <h3 className="card-title">Meal Planner</h3>
                  <p className="card-description">
                    View your personalized meal plan
                  </p>
                </div>

                <div 
                  className="dashboard-card"
                  onClick={() => handleNavigation("/progress")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fas fa-chart-line card-icon"></i>
                  <h3 className="card-title">Track Progress</h3>
                  <p className="card-description">
                    Monitor your fitness journey
                  </p>
                </div>

                <div 
                  className="dashboard-card"
                  onClick={() => handleNavigation("/myattendance")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="fas fa-qrcode card-icon"></i>
                  <h3 className="card-title">QR Attendance</h3>
                  <p className="card-description">
                    Scan QR code for attendance tracking
                  </p>
                </div>
              </section>

              <section className="progress-section">
                <div className="progress-header">
                  <h2 className="progress-title">Your Progress</h2>
                  <button className="btn-update">Update Progress</button>
                </div>

                <div className="progress-grid">
                  <div className="progress-item">
                    <h4>Weight</h4>
                    <p>75 kg</p>
                  </div>
                  <div className="progress-item">
                    <h4>Body Fat</h4>
                    <p>18%</p>
                  </div>
                  <div className="progress-item">
                    <h4>Muscle Mass</h4>
                    <p>32%</p>
                  </div>
                  <div className="progress-item">
                    <h4>BMI</h4>
                    <p>22.5</p>
                  </div>
                </div>
              </section>
            </div>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MemberDashboard;