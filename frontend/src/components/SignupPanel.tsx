import { useState } from 'react';
import { useAppPhase } from '../hooks/useAppPhase';
import {
  useAuthError,
  useAuthSession,
  useAuthStatus,
  usePendingMagicLinkEmail,
  usePendingMagicLinkToken,
  useResetMagicLink,
} from '../hooks/useAuth';
import './SignupPanel.css';

type SignupMethod = 'google' | 'email';

interface SignupPanelProps {
  onSignup: (method: SignupMethod, email?: string) => Promise<void> | void;
  onVerifyMagicLink: () => Promise<void> | void;
}

export function SignupPanel({ onSignup, onVerifyMagicLink }: SignupPanelProps) {
  const phase = useAppPhase();
  const [email, setEmail] = useState('');
  const authStatus = useAuthStatus();
  const authError = useAuthError();
  const authSession = useAuthSession();
  const pendingEmail = usePendingMagicLinkEmail();
  const pendingMagicLinkToken = usePendingMagicLinkToken();
  const resetMagicLink = useResetMagicLink();
  const isSubmitting = authStatus === 'submitting';
  const isMagicLinkPending = authStatus === 'magic-link-sent';

  const handleGoogle = () => {
    void onSignup('google', email.trim() || undefined);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      void onSignup('email', email.trim());
    }
  };

  return (
    <>
      <div className="signup-view">
        <div className="logo-row">
          <svg className="logo-mark" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7V12C3 16.97 7.02 21.61 12 22.93C16.98 21.61 21 16.97 21 12V7L12 2Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 12L11.5 14.5L15.5 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-name">Arcamatrix</span>
        </div>

        <form className="signup-main" onSubmit={handleEmailSubmit}>
          <h1 className="signup-headline">
            Your AI that<br />actually does<br />the work.
          </h1>
          <p className="signup-sub">
            Free forever. No credit card.<br />Magic link is the default way in.
          </p>

          <button
            type="button"
            className="btn-google"
            onClick={handleGoogle}
            disabled={isSubmitting}
          >
            <svg width="15" height="15" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isSubmitting ? 'Authorizing...' : 'Continue with Google'}
          </button>

          <div className="divider">or</div>

          {isMagicLinkPending ? (
            <div className="auth-card">
              <div className="auth-card-title">Magic link sent</div>
              <p className="auth-card-copy">
                We staged a magic link for <strong>{pendingEmail}</strong>. In this local
                stub you can verify it directly to complete <code>POST /auth/email/verify</code>.
              </p>
              <label className="form-label" htmlFor="magic-link-token">
                Demo token
              </label>
              <input
                className="form-input"
                id="magic-link-token"
                type="text"
                value={pendingMagicLinkToken ?? ''}
                readOnly
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void onVerifyMagicLink()}
                disabled={isSubmitting}
              >
                Verify Magic Link &rarr;
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetMagicLink}
                disabled={isSubmitting}
              >
                Use another email
              </button>
            </div>
          ) : (
            <>
              <label className="form-label" htmlFor="signup-email">Email</label>
              <input
                className="form-input"
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sending magic link...' : 'Email Me a Magic Link →'}
              </button>
            </>
          )}

          {authError && <div className="auth-feedback auth-feedback-error">{authError}</div>}

          {authSession && phase !== 'workspace' && (
            <div className="auth-feedback auth-feedback-success">
              Signed in as {authSession.user.email}. Preparing workspace...
            </div>
          )}

          <div className="trust-row">
            <span className="trust-chip"><span className="trust-live"></span>Free forever</span>
            <span className="trust-chip">25K tokens/day</span>
            <span className="trust-chip">GDPR &middot; EU</span>
          </div>
        </form>

        <div>
          <div className="signup-footer">
            By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </>
  );
}
