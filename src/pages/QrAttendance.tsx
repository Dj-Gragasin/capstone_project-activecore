import React, { useEffect, useState, useRef } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonAlert,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonToast,
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonBackButton,
  IonBadge,
  IonProgressBar
} from "@ionic/react";
import {
  camera,
  gift,
  checkmarkCircle,
  flame,
  calendar,
  time,
  location,
  close,
  trophy,
  star,
  lockClosed,
  checkmark
} from "ionicons/icons";
import "./QrAttendance.css";

interface AttendanceLog {
  id: string;
  date: string;
  time: string;
  location: string;
  status: "present" | "late";
}

interface Reward {
  id: string;
  title: string;
  description: string;
  requiredAttendance: number;
  points: number;
  category: "product" | "service" | "discount";
  icon: string;
  claimed: boolean;
}

const QrAttendance: React.FC = () => {
  const [today, setToday] = useState<string>("");
  const [showAlert, setShowAlert] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>("camera");
  const [isScanning, setIsScanning] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [userName, setUserName] = useState("John Doe");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showRewardAlert, setShowRewardAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [rewardMessage, setRewardMessage] = useState("");
  const [rewards, setRewards] = useState<Reward[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setToday(formattedDate);

    // Load user data and attendance logs
    loadUserData();
    loadAttendanceData();
    initializeRewards();
  }, []);

  const initializeRewards = () => {
    const defaultRewards: Reward[] = [
      {
        id: "1",
        title: "Free Protein Shake",
        description: "Get a complimentary protein shake from our juice bar",
        requiredAttendance: 5,
        points: 10,
        category: "product",
        icon: "🥤",
        claimed: false
      },
      {
        id: "2",
        title: "Free Personal Training Session",
        description: "One-on-one session with our certified trainers",
        requiredAttendance: 10,
        points: 50,
        category: "service",
        icon: "💪",
        claimed: false
      },
      {
        id: "3",
        title: "ActiveCore Water Bottle",
        description: "Premium stainless steel water bottle",
        requiredAttendance: 15,
        points: 25,
        category: "product",
        icon: "🍶",
        claimed: false
      },
      {
        id: "4",
        title: "20% Off Supplements",
        description: "Discount on all supplement products",
        requiredAttendance: 20,
        points: 30,
        category: "discount",
        icon: "💊",
        claimed: false
      },
      {
        id: "5",
        title: "Massage Therapy Session",
        description: "45-minute relaxation massage session",
        requiredAttendance: 25,
        points: 75,
        category: "service",
        icon: "💆",
        claimed: false
      },
      {
        id: "6",
        title: "ActiveCore Gym Bag",
        description: "Premium branded gym bag with compartments",
        requiredAttendance: 30,
        points: 40,
        category: "product",
        icon: "🎒",
        claimed: false
      }
    ];

    // Load saved rewards or use defaults
    const savedRewards = localStorage.getItem("userRewards");
    if (savedRewards) {
      try {
        setRewards(JSON.parse(savedRewards));
      } catch {
        setRewards(defaultRewards);
        localStorage.setItem("userRewards", JSON.stringify(defaultRewards));
      }
    } else {
      setRewards(defaultRewards);
      localStorage.setItem("userRewards", JSON.stringify(defaultRewards));
    }
  };

  const loadUserData = () => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        setUserName(parsedUser.fullName);
      } catch (err) {
        console.error("Invalid user data");
      }
    }
  };

  const loadAttendanceData = () => {
    const savedLogs = localStorage.getItem("attendanceLogs");
    const savedStreak = localStorage.getItem("attendanceStreak");
    
    if (savedLogs) {
      try {
        const logs = JSON.parse(savedLogs);
        setAttendanceLogs(logs);
        setTotalAttendance(logs.length);
      } catch (err) {
        console.error("Error loading attendance logs");
      }
    }
    
    if (savedStreak) {
      setCurrentStreak(parseInt(savedStreak));
    }
  };

  const recordAttendance = () => {
    const now = new Date();
    const todayDate = now.toDateString();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const currentDate = now.toLocaleDateString('en-US');
    
    // Check if already recorded today
    const lastAttendance = localStorage.getItem("lastAttendance");
    if (lastAttendance === todayDate) {
      setErrorMessage("Attendance already recorded for today!");
      setShowErrorAlert(true);
      return;
    }

    // Record attendance
    localStorage.setItem("lastAttendance", todayDate);

    // Update streak
    const currentStreakValue = parseInt(localStorage.getItem("attendanceStreak") || "0", 10);
    const newStreak = currentStreakValue + 1;
    localStorage.setItem("attendanceStreak", newStreak.toString());
    setCurrentStreak(newStreak);

    // Determine if user is late (after 9 AM)
    const isLate = now.getHours() >= 9;
    
    const newLog: AttendanceLog = {
      id: Date.now().toString(),
      date: currentDate,
      time: currentTime,
      location: "ActiveCore Gym - Main Floor",
      status: isLate ? "late" : "present"
    };

    const updatedLogs = [newLog, ...attendanceLogs];
    setAttendanceLogs(updatedLogs);
    const newTotalAttendance = updatedLogs.length;
    setTotalAttendance(newTotalAttendance);
    
    // Save logs to localStorage
    localStorage.setItem("attendanceLogs", JSON.stringify(updatedLogs));
    
    // Check for new rewards
    checkForNewRewards(newTotalAttendance);
    
    setShowAlert(true);
    setShowSuccessToast(true);
  };

  const checkForNewRewards = (attendanceCount: number) => {
    const unlockedReward = rewards.find(reward => 
      reward.requiredAttendance === attendanceCount && !reward.claimed
    );

    if (unlockedReward) {
      setRewardMessage(`🎉 New reward unlocked: ${unlockedReward.title}! Check your rewards to claim it.`);
      setTimeout(() => setShowRewardAlert(true), 1000);
    }
  };

  const claimReward = (rewardId: string) => {
    const updatedRewards = rewards.map(reward => 
      reward.id === rewardId ? { ...reward, claimed: true } : reward
    );
    setRewards(updatedRewards);
    localStorage.setItem("userRewards", JSON.stringify(updatedRewards));
    
    setRewardMessage("🎉 Reward claimed successfully! Visit the front desk to collect it.");
    setShowRewardAlert(true);
  };

  const startCamera = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        
        // Simulate QR scanning after 3 seconds
        setTimeout(() => {
          if (isScanning) {
            handleQRCodeDetected("ACTIVECORE_GYM_CHECKIN_" + Date.now());
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setErrorMessage("Could not access camera. Please check permissions.");
      setShowErrorAlert(true);
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleQRCodeDetected = (data: string) => {
    console.log("QR Code detected:", data);
    
    if (data.includes("ACTIVECORE_GYM_CHECKIN")) {
      recordAttendance();
      stopCamera();
    } else {
      setErrorMessage("Invalid QR Code. Please scan the gym's attendance QR code.");
      setShowErrorAlert(true);
    }
  };

  const getRewardColor = (category: string) => {
    switch (category) {
      case "product": return "#4a90e2";
      case "service": return "#00e676";
      case "discount": return "#ff6b35";
      default: return "#666";
    }
  };

  const getNextReward = () => {
    return rewards.find(reward => 
      reward.requiredAttendance > totalAttendance && !reward.claimed
    );
  };

  const nextReward = getNextReward();
  const attendanceProgress = nextReward 
    ? (totalAttendance / nextReward.requiredAttendance) * 100 
    : 100;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/member" />
          </IonButtons>
          <IonTitle>QR Attendance</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="qrattendance-container" fullscreen>
        {/* User Welcome & Stats */}
        <div className="welcome-section">
          <IonText className="qrattendance-date">
            📅 {today}
          </IonText>
          <h2 style={{ margin: "0.5rem 0", color: "var(--ion-color-primary)" }}>
            Welcome, {userName.split(" ")[0]}! 👋
          </h2>
        </div>

        {/* Stats Cards */}
        <IonGrid style={{ marginBottom: "1rem" }}>
          <IonRow>
            <IonCol size="4">
              <IonCard className="stat-card">
                <IonCardContent style={{ textAlign: "center", padding: "1rem" }}>
                  <IonIcon 
                    icon={flame} 
                    style={{ fontSize: "1.8rem", color: "#ff6b35" }}
                  />
                  <h3 style={{ margin: "0.3rem 0", fontSize: "1.2rem" }}>
                    {currentStreak}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem" }}>Streak</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="4">
              <IonCard className="stat-card">
                <IonCardContent style={{ textAlign: "center", padding: "1rem" }}>
                  <IonIcon 
                    icon={calendar} 
                    style={{ fontSize: "1.8rem", color: "#4a90e2" }}
                  />
                  <h3 style={{ margin: "0.3rem 0", fontSize: "1.2rem" }}>
                    {totalAttendance}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem" }}>Total</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="4">
              <IonCard className="stat-card">
                <IonCardContent style={{ textAlign: "center", padding: "1rem" }}>
                  <IonIcon 
                    icon={gift} 
                    style={{ fontSize: "1.8rem", color: "#00e676" }}
                  />
                  <h3 style={{ margin: "0.3rem 0", fontSize: "1.2rem" }}>
                    {rewards.filter(r => r.claimed).length}
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem" }}>Claimed</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Progress to Next Reward */}
        {nextReward && (
          <IonCard style={{ marginBottom: "1rem" }}>
            <IonCardContent>
              <div style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                <h4 style={{ margin: 0, color: "var(--ion-color-primary)" }}>
                  Next Reward: {nextReward.title}
                </h4>
                <p style={{ margin: "0.3rem 0", fontSize: "0.9rem", color: "#666" }}>
                  {totalAttendance}/{nextReward.requiredAttendance} days
                </p>
              </div>
              <IonProgressBar 
                value={attendanceProgress / 100} 
                color="success"
                style={{ height: "8px", borderRadius: "4px" }}
              />
              <p style={{ textAlign: "center", margin: "0.5rem 0 0", fontSize: "0.8rem", color: "#666" }}>
                {nextReward.requiredAttendance - totalAttendance} more days to unlock!
              </p>
            </IonCardContent>
          </IonCard>
        )}

        {/* Segment Control */}
        <IonSegment 
          value={selectedSegment} 
          onIonChange={(e) => setSelectedSegment(e.detail.value as string)}
          style={{ marginBottom: "1rem" }}
        >
          <IonSegmentButton value="camera">
            <IonIcon icon={camera} />
            <IonLabel>Scan QR</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="rewards">
            <IonIcon icon={gift} />
            <IonLabel>Rewards</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Camera Section */}
        {selectedSegment === "camera" && (
          <div className="camera-section">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={camera} style={{ marginRight: "0.5rem" }} />
                  Scan Attendance QR Code
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {!isScanning ? (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ marginBottom: "1rem", color: "#666" }}>
                      Point your camera at the gym's QR code to mark attendance
                    </p>
                    <IonButton
                      expand="block"
                      size="large"
                      onClick={startCamera}
                      style={{ marginBottom: "1rem" }}
                    >
                      <IonIcon icon={camera} slot="start" />
                      Start Camera
                    </IonButton>
                    
                    {/* Demo button */}
                    <IonButton
                      expand="block"
                      fill="outline"
                      color="success"
                      onClick={() => recordAttendance()}
                    >
                      <IonIcon icon={checkmarkCircle} slot="start" />
                      Demo Check-in (for testing)
                    </IonButton>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <video
                      ref={videoRef}
                      style={{
                        width: "100%",
                        height: "300px",
                        objectFit: "cover",
                        borderRadius: "12px"
                      }}
                      playsInline
                      muted
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    
                    {/* Scanning overlay */}
                    <div
                      className="scanning-overlay"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        border: "3px solid #00e676",
                        width: "200px",
                        height: "200px",
                        borderRadius: "12px",
                        background: "rgba(0, 230, 118, 0.1)"
                      }}
                    />
                    
                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                      <p>Position the gym's QR code within the frame</p>
                      <IonButton color="danger" onClick={stopCamera}>
                        <IonIcon icon={close} slot="start" />
                        Stop Camera
                      </IonButton>
                    </div>
                  </div>
                )}
              </IonCardContent>
            </IonCard>

            {/* Recent Attendance Logs */}
            <IonCard style={{ marginTop: "1rem" }}>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={time} style={{ marginRight: "0.5rem" }} />
                  Recent Attendance
                  {attendanceLogs.length > 0 && (
                    <IonBadge color="primary" style={{ marginLeft: "0.5rem" }}>
                      {attendanceLogs.length}
                    </IonBadge>
                  )}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {attendanceLogs.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#666" }}>
                    No attendance records yet. Scan QR code to get started! 🎯
                  </p>
                ) : (
                  <div className="attendance-logs">
                    {attendanceLogs.slice(0, 3).map((log) => (
                      <IonItem key={log.id} className="attendance-log-item">
                        <IonIcon
                          icon={checkmarkCircle}
                          color={log.status === "present" ? "success" : "warning"}
                          slot="start"
                        />
                        <IonLabel>
                          <h3>{log.date}</h3>
                          <p>
                            <IonIcon icon={time} style={{ fontSize: "0.8rem", marginRight: "0.3rem" }} />
                            {log.time}
                          </p>
                        </IonLabel>
                        <IonLabel slot="end" color={log.status === "present" ? "success" : "warning"}>
                          <strong>{log.status.toUpperCase()}</strong>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Rewards Section */}
        {selectedSegment === "rewards" && (
          <div className="rewards-section">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  <IonIcon icon={gift} style={{ marginRight: "0.5rem" }} />
                  Available Rewards
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <div className="rewards-grid">
                  {rewards.map((reward) => (
                    <IonCard 
                      key={reward.id} 
                      className={`reward-card ${reward.claimed ? 'claimed' : ''} ${totalAttendance >= reward.requiredAttendance ? 'available' : 'locked'}`}
                    >
                      <IonCardContent style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "2rem", marginRight: "0.5rem" }}>
                            {reward.icon}
                          </span>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: "1rem" }}>{reward.title}</h3>
                            <p style={{ margin: "0.2rem 0", fontSize: "0.8rem", color: "#666" }}>
                              {reward.description}
                            </p>
                          </div>
                          {totalAttendance < reward.requiredAttendance && (
                            <IonIcon icon={lockClosed} color="medium" />
                          )}
                          {reward.claimed && (
                            <IonIcon icon={checkmark} color="success" />
                          )}
                        </div>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ 
                            fontSize: "0.8rem", 
                            color: getRewardColor(reward.category),
                            fontWeight: "600"
                          }}>
                            {reward.requiredAttendance} days required
                          </span>
                          
                          {totalAttendance >= reward.requiredAttendance && !reward.claimed && (
                            <IonButton 
                              size="small" 
                              color="success"
                              onClick={() => claimReward(reward.id)}
                            >
                              Claim
                            </IonButton>
                          )}
                          
                          {reward.claimed && (
                            <IonBadge color="success">Claimed</IonBadge>
                          )}
                          
                          {totalAttendance < reward.requiredAttendance && (
                            <IonBadge color="medium">
                              {reward.requiredAttendance - totalAttendance} more days
                            </IonBadge>
                          )}
                        </div>
                      </IonCardContent>
                    </IonCard>
                  ))}
                </div>
                
                {rewards.filter(r => r.claimed).length === 0 && (
                  <p style={{ textAlign: "center", color: "#666", marginTop: "1rem" }}>
                    Keep attending to unlock amazing rewards! 🏆
                  </p>
                )}
              </IonCardContent>
            </IonCard>
          </div>
        )}

        {/* Success Alert */}
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Attendance Recorded! 🎉"
          message="✅ Your attendance has been marked and your streak is updated."
          buttons={["OK"]}
        />

        {/* Success Toast */}
        <IonToast
          isOpen={showSuccessToast}
          onDidDismiss={() => setShowSuccessToast(false)}
          message="🔥 Attendance recorded! Keep the streak going!"
          duration={3000}
          position="top"
          color="success"
        />

        {/* Reward Alert */}
        <IonAlert
          isOpen={showRewardAlert}
          onDidDismiss={() => setShowRewardAlert(false)}
          header="New Reward Available! 🎁"
          message={rewardMessage}
          buttons={["Awesome!"]}
        />

        {/* Error Alert */}
        <IonAlert
          isOpen={showErrorAlert}
          onDidDismiss={() => setShowErrorAlert(false)}
          header="Error"
          message={errorMessage}
          buttons={["OK"]}
        />
      </IonContent>
    </IonPage>
  );
};

export default QrAttendance;