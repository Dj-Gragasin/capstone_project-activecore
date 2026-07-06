import React, { useState, useEffect } from 'react';
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

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useIonRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!token) {
      setToastMsg('Missing reset token');
      return;
    }
    if (!newPassword) {
      setToastMsg('Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastMsg('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setToastMsg(data?.message || 'Failed to reset password');
        return;
      }

      setToastMsg(data?.message || 'Password updated successfully');
      setTimeout(() => router.push('/home'), 1200);
    } catch (err) {
      console.error('Reset password error', err);
      setToastMsg('Network error resetting password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <p>Choose a new password for your account.</p>

          <IonItem>
            <IonLabel position="stacked">New password</IonLabel>
            <IonInput
              type="password"
              value={newPassword}
              onIonInput={(e) => setNewPassword(String(e.detail.value ?? ''))}
              placeholder="New password"
              required
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Confirm password</IonLabel>
            <IonInput
              type="password"
              value={confirmPassword}
              onIonInput={(e) => setConfirmPassword(String(e.detail.value ?? ''))}
              placeholder="Confirm password"
              required
            />
          </IonItem>

          <div style={{ marginTop: 16 }}>
            <IonButton expand="block" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Set new password'}
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

export default ResetPassword;
