import { useEffect } from 'react';
import { useAppPhase, useSetAppPhase } from '../hooks/useAppPhase';
import {
  useAuthStatus,
  useSignInWithGoogle,
  useStartMagicLink,
  useVerifyMagicLink,
} from '../hooks/useAuth';
import { SignupPanel } from './SignupPanel';
import { DemoWorkspace } from './DemoWorkspace';
import './LandingPage.css';

export function LandingPage() {
  const phase = useAppPhase();
  const setPhase = useSetAppPhase();
  const authStatus = useAuthStatus();
  const signInWithGoogle = useSignInWithGoogle();
  const startMagicLink = useStartMagicLink();
  const verifyMagicLink = useVerifyMagicLink();

  useEffect(() => {
    if (authStatus !== 'authenticated' || phase !== 'landing') {
      return;
    }

    setPhase('transitioning');
    const timeoutId = window.setTimeout(() => setPhase('workspace'), 380);

    return () => window.clearTimeout(timeoutId);
  }, [authStatus, phase, setPhase]);

  const handleSignup = async (method: 'google' | 'email', email?: string) => {
    if (method === 'google') {
      await signInWithGoogle(email);
      return;
    }

    if (!email) {
      return;
    }

    await startMagicLink(email);
  };

  const handleVerifyMagicLink = async () => {
    await verifyMagicLink();
  };

  const className = [
    'landing-layout',
    phase === 'transitioning' ? 'transitioning' : '',
    phase === 'workspace' ? 'ws-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      <aside className="left-panel">
        <SignupPanel
          onSignup={handleSignup}
          onVerifyMagicLink={handleVerifyMagicLink}
        />
      </aside>
      <main className="right-panel">
        <DemoWorkspace />
      </main>
    </div>
  );
}
