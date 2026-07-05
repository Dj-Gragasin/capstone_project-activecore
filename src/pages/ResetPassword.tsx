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
  IonButtons,
  IonBackButton,
} from '@ionic/react';
import { resetPassword } from '../services/auth.service';
import { useLocation, useHistory } from 'react-router-dom';
import './AccountSettings.css';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword: React.FC = () => {
  const query = useQuery();
  const tokenFromQuery = query.get('token') || '';
  const [token, setToken] = useState(tokenFromQuery);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const history = useHistory();

  useEffect(() => {
    setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await resetPassword(token, newPassword);
      setMessage('Password updated. You can now log in.');
      setShowToast(true);
      setTimeout(() => history.push('/home'), 1200);
    } catch (err: any) {
      setMessage(err?.message || 'Failed to reset password');
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
          <IonTitle>Reset Password</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <form onSubmit={handleSubmit}>
          <IonItem>
            <IonLabel position="stacked">Reset Token</IonLabel>
            <IonInput
              value={token}
              onIonInput={(e) => setToken(String(e.detail.value ?? ''))}
              placeholder="Paste token if not using link"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">New password</IonLabel>
            <IonInput
              type="password"
              value={newPassword}
              onIonInput={(e) => setNewPassword(String(e.detail.value ?? ''))}
              placeholder="Choose a strong password"
              required
            />
          </IonItem>

          <div style={{ marginTop: 16 }}>
            <IonButton expand="block" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Set new password'}
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

export default ResetPassword;
