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
  useIonRouter,
} from '@ionic/react';
import { API_CONFIG } from '../config/api.config';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useIonRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      setToastMsg('Please enter your email');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Backend intentionally returns generic success message to avoid enumeration
      const data = await res.json().catch(() => ({}));
      setToastMsg(data?.message || 'If an account exists, a reset email has been sent');

      // After sending, navigate back to home/login
      setTimeout(() => router.push('/home'), 1400);
    } catch (err) {
      console.error('Forgot password error', err);
      setToastMsg('Network error sending reset request');
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Forgot Password</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <p>Enter the email address for your account. We'll send a link to reset your password.</p>

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
              {busy ? 'Sending…' : 'Send reset link'}
            </IonButton>
          </div>

          <div style={{ marginTop: 12 }}>
            <IonButton fill="clear" onClick={() => router.push('/home')}>Back</IonButton>
          </div>
        </form>

        <IonToast
          isOpen={Boolean(toastMsg)}
          message={toastMsg || ''}
          duration={3000}
          onDidDismiss={() => setToastMsg(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;
