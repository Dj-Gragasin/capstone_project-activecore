import React, { useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { requestPasswordReset } from '../services/auth.service';
import './AccountSettings.css';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setMessage('If an account exists, a reset email has been sent');
      setShowToast(true);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to request password reset');
      setShowToast(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Forgot Password</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonItem>
            <IonLabel position="stacked">Email</IonLabel>
            <IonInput
              type="email"
              value={email}
              onIonInput={(e) => setEmail(String(e.detail.value ?? ''))}
              placeholder="you@example.com"
              required
            />
          </IonItem>

          <div style={{ marginTop: 16 }}>
            <IonButton expand="block" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Send reset email'}
            </IonButton>
          </div>
        </form>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={message}
          duration={3000}
        />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
