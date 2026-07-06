import React, { useState } from 'react';
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
import { keyOutline, mailOutline } from 'ionicons/icons';
import { API_CONFIG } from '../config/api.config';
import './AuthRecovery.css';

const isValidEmailFormat = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const router = useIonRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setToastMsg('Please enter your email');
      return;
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      setToastMsg('Please enter a valid email address');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
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
      <IonContent className="recovery-content" fullscreen>
        <div className="recovery-shell">
          <div className="recovery-card">
            <span className="recovery-badge">
              <IonIcon icon={keyOutline} />
              Account recovery
            </span>

            <h1 className="recovery-title">Forgot your password?</h1>
            <p className="recovery-subtitle">
              Enter your account email and we will send you a secure reset link.
            </p>

            <form className="recovery-form" onSubmit={handleSubmit}>
              <IonItem>
                <IonLabel position="stacked">Email address</IonLabel>
                <IonInput
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(String(e.detail.value ?? '').trim())}
                  placeholder="you@example.com"
                  required
                >
                  <IonIcon icon={mailOutline} slot="end" />
                </IonInput>
              </IonItem>

              <div className="recovery-actions">
                <IonButton className="recovery-primary-btn" expand="block" type="submit" disabled={busy}>
                  {busy ? 'Sending reset link...' : 'Send reset link'}
                </IonButton>

                <IonButton className="recovery-secondary-btn" fill="clear" onClick={() => router.push('/home')}>
                  Back to login
                </IonButton>
              </div>

              <div className="recovery-note">
                For security, we always show the same response even if the email is not registered.
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

export default ForgotPassword;
