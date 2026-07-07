import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  useIonRouter,
  IonIcon,
} from '@ionic/react';
import { checkmarkCircleOutline, keyOutline, warningOutline } from 'ionicons/icons';
import { API_CONFIG } from '../config/api.config';
import './AuthRecovery.css';

const getPasswordStrength = (value: string): { level: 'weak' | 'medium' | 'strong'; label: string } => {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;

  if (score >= 3) return { level: 'strong', label: 'Strong' };
  if (score === 2) return { level: 'medium', label: 'Medium' };
  return { level: 'weak', label: value ? 'Weak' : 'Add a password' };
};

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useIonRouter();
  const strength = getPasswordStrength(newPassword);

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
      <IonContent className="recovery-content" fullscreen>
        <div className="recovery-shell">
          <div className="recovery-card">
            <span className="recovery-badge">
              <IonIcon icon={checkmarkCircleOutline} />
              Secure reset
            </span>

            <h1 className="recovery-title">Create a new password</h1>
            <p className="recovery-subtitle">
              Use a strong password you have not used before for this account.
            </p>

            {!token && (
              <p className="recovery-token-warning">
                <IonIcon icon={warningOutline} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Missing or invalid reset token. Request and verify a new code first.
              </p>
            )}

            <form className="recovery-form" onSubmit={handleSubmit}>
              <IonItem>
                <IonLabel position="stacked">New password</IonLabel>
                <IonInput
                  type="password"
                  value={newPassword}
                  onIonInput={(e) => setNewPassword(String(e.detail.value ?? ''))}
                  placeholder="New password"
                  required
                >
                  <IonIcon icon={keyOutline} slot="end" />
                </IonInput>
              </IonItem>

              <div className="recovery-strength">
                <span>Password strength</span>
                <span className={`recovery-strength-pill ${strength.level}`}>{strength.label}</span>
              </div>

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

              <ul className="recovery-tips">
                <li>Use at least 8 characters.</li>
                <li>Mix uppercase, lowercase, numbers, and symbols.</li>
              </ul>

              <div className="recovery-actions">
                <IonButton className="recovery-primary-btn" expand="block" type="submit" disabled={busy || !token}>
                  {busy ? 'Saving password...' : 'Set new password'}
                </IonButton>

                <IonButton className="recovery-secondary-btn" fill="clear" onClick={() => router.push('/home')}>
                  Back to login
                </IonButton>
              </div>
            </form>
          </div>
        </div>

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
