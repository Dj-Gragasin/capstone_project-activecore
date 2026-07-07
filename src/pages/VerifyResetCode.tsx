import React, { useEffect, useState } from 'react';
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
import { keyOutline, mailOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { API_CONFIG } from '../config/api.config';
import './AuthRecovery.css';

const isValidEmailFormat = (value: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
};

const VerifyResetCode: React.FC = () => {
  const router = useIonRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = String(params.get('email') || '').trim().toLowerCase();
    if (fromQuery) {
      setEmail(fromQuery);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, '').slice(0, 6);

    if (!normalizedEmail) {
      setToastMsg('Please enter your email');
      return;
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      setToastMsg('Please enter a valid email address');
      return;
    }

    if (normalizedCode.length !== 6) {
      setToastMsg('Please enter the 6-digit code from your email');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/auth/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, code: normalizedCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setToastMsg(data?.message || 'Invalid or expired verification code');
        return;
      }

      const resetToken = String(data?.resetToken || '').trim();
      if (!resetToken) {
        setToastMsg('Verification succeeded but no reset token was returned');
        return;
      }

      setToastMsg(data?.message || 'Code verified. Continue to reset your password.');
      setTimeout(() => {
        router.push(`/reset-password?token=${encodeURIComponent(resetToken)}`);
      }, 700);
    } catch (error) {
      console.error('Verify reset code error', error);
      setToastMsg('Network error verifying code');
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
              <IonIcon icon={shieldCheckmarkOutline} />
              Verification step
            </span>

            <h1 className="recovery-title">Enter verification code</h1>
            <p className="recovery-subtitle">
              We sent a 6-digit code to your account email. Enter it below to continue.
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

              <IonItem>
                <IonLabel position="stacked">6-digit code</IonLabel>
                <IonInput
                  type="text"
                  inputmode="numeric"
                  maxlength={6}
                  value={code}
                  onIonInput={(e) => setCode(String(e.detail.value ?? '').replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  required
                >
                  <IonIcon icon={keyOutline} slot="end" />
                </IonInput>
              </IonItem>

              <div className="recovery-actions">
                <IonButton className="recovery-primary-btn" expand="block" type="submit" disabled={busy}>
                  {busy ? 'Verifying code...' : 'Verify code'}
                </IonButton>

                <IonButton className="recovery-secondary-btn" fill="clear" onClick={() => router.push('/forgot-password')}>
                  Resend code
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

export default VerifyResetCode;
