import React, { useState } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  useIonRouter
} from "@ionic/react";

import {
  home,
  star,
  logIn,
  informationCircle,
  playCircle,
  trophyOutline
} from "ionicons/icons";
import "./Home.css";

const Home: React.FC = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useIonRouter();

  const handleLogin = () => {
    // ✅ Test login credentials
    if (email === "test@test.com" && password === "12345") {
      // Store user info in localStorage
      const user = { fullName: "John Doe", email };
      localStorage.setItem("currentUser", JSON.stringify(user));

      // ✅ Redirect to correct route in App.tsx
      router.push("/member", "root", "replace");

      setShowLogin(false);
    } else {
      alert(
        "❌ Invalid email or password.\n\nUse:\nEmail: test@test.com\nPassword: 12345"
      );
    }
  };

  return (
    <IonPage>
      {/* Header */}
      <IonHeader className="ion-no-border">
        <IonToolbar color="dark">
          <IonTitle>
            <span style={{ fontSize: "1.4rem" }}>🏋️ ActiveCore</span>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton fill="clear" routerLink="/home">
              <IonIcon icon={home} />
            </IonButton>
            <IonButton fill="clear" routerLink="/features">
              <IonIcon icon={star} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      {/* Main Content */}
      <IonContent className="ion-padding">
        {/* Hero Section */}
        <div className="hero">
          <h1>Transform Your Life Today</h1>
          <p>
            Join ActiveCore and experience a new way of fitness tracking,
            personalized training, and community support. Start your journey
            to a healthier, stronger you.
          </p>
          <div className="cta-buttons">
            <IonButton
              expand="block"
              color="primary"
              routerLink="/payment"
              size="large"
            >
              <IonIcon icon={playCircle} slot="start" />
              Start Your Journey
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              routerLink="/features"
              size="large"
            >
              <IonIcon icon={informationCircle} slot="start" />
              Learn More
            </IonButton>

            {/* ✅ Login Button */}
            <IonButton
              expand="block"
              fill="outline"
              color="primary"
              size="large"
              onClick={() => setShowLogin(true)}
            >
              <IonIcon icon={logIn} slot="start" />
              Log In
            </IonButton>
          </div>
        </div>

        {/* Stats Section */}
        <IonGrid className="stats-grid">
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeSm="6" sizeMd="3">
              <IonCard button>
                <IonCardHeader>
                  <IonCardTitle>5,000+</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>Active Members</strong>
                  <br />
                  <small>Growing daily</small>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeSm="6" sizeMd="3">
              <IonCard button>
                <IonCardHeader>
                  <IonCardTitle>500+</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>Classes Weekly</strong>
                  <br />
                  <small>Various disciplines</small>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeSm="6" sizeMd="3">
              <IonCard button>
                <IonCardHeader>
                  <IonCardTitle>50+</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>Expert Trainers</strong>
                  <br />
                  <small>Certified professionals</small>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="12" sizeSm="6" sizeMd="3">
              <IonCard button>
                <IonCardHeader>
                  <IonCardTitle>95%</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <strong>Success Rate</strong>
                  <br />
                  <small>Member satisfaction</small>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Features Section */}
        <div style={{ margin: "3rem 0" }}>
          <h2
            style={{
              textAlign: "center",
              marginBottom: "2rem",
              color: "var(--primary-color)"
            }}
          >
            Why Choose ActiveCore?
          </h2>
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <IonIcon
                    icon={trophyOutline}
                    style={{ fontSize: "3rem", color: "var(--primary-color)" }}
                  />
                  <h3>Proven Results</h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Our members achieve their fitness goals 95% of the time
                  </p>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <IonIcon
                    icon={star}
                    style={{ fontSize: "3rem", color: "var(--primary-color)" }}
                  />
                  <h3>Expert Guidance</h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Work with certified trainers and nutrition specialists
                  </p>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <div style={{ textAlign: "center", padding: "1rem" }}>
                  <IonIcon
                    icon={home}
                    style={{ fontSize: "3rem", color: "var(--primary-color)" }}
                  />
                  <h3>Flexible Training</h3>
                  <p style={{ color: "var(--text-secondary)" }}>
                    Train at home, in the gym, or anywhere you prefer
                  </p>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </div>

        {/* Footer */}
        <footer>
          <p>&copy; 2025 ActiveCore. All rights reserved.</p>
          <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            Transform your fitness journey with us
          </p>
        </footer>
      </IonContent>

      {/* 🔑 Login Modal */}
      <IonModal
        isOpen={showLogin}
        onDidDismiss={() => setShowLogin(false)}
        className="centered-modal"
        presentingElement={undefined}
      >
        <IonContent>
          <div className="login-modal-content">
            <h2 className="login-title">Login</h2>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                placeholder="Enter your email"
                onIonInput={(e) => setEmail(e.detail.value!)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                placeholder="Enter your password"
                onIonInput={(e) => setPassword(e.detail.value!)}
              />
            </IonItem>

            <IonButton expand="block" className="login-btn" onClick={handleLogin}>
              Log In
            </IonButton>
            <IonButton
              expand="block"
              fill="clear"
              className="cancel-btn"
              onClick={() => setShowLogin(false)}
            >
              Cancel
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Home;
