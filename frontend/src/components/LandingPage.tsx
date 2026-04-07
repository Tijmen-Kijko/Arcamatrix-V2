import { useEffect } from 'react';
import { useAppPhase, useSetAppPhase } from '../hooks/useAppPhase';
import {
  useAuthStatus,
  useBootstrapDevBypass,
  useIsDevBypass,
  useSignInWithGoogle,
  useStartMagicLink,
  useVerifyMagicLink,
} from '../hooks/useAuth';
import { SignupPanel } from './SignupPanel';
import { SandboxWorkspace } from './SandboxWorkspace';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import './LandingPage.css';

const DEV_AUTH_BYPASS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_AUTH_BYPASS !== 'false';

export function LandingPage() {
  const phase = useAppPhase();
  const setPhase = useSetAppPhase();
  const authStatus = useAuthStatus();
  const isDevBypass = useIsDevBypass();
  const bootstrapDevBypass = useBootstrapDevBypass();
  const signInWithGoogle = useSignInWithGoogle();
  const startMagicLink = useStartMagicLink();
  const verifyMagicLink = useVerifyMagicLink();

  useEffect(() => {
    if (authStatus !== 'authenticated' || phase !== 'landing') {
      return;
    }

    if (isDevBypass) {
      setPhase('workspace');
      return;
    }

    setPhase('transitioning');
    const timeoutId = window.setTimeout(() => setPhase('workspace'), 380);

    return () => window.clearTimeout(timeoutId);
  }, [authStatus, isDevBypass, phase, setPhase]);

  useEffect(() => {
    if (!DEV_AUTH_BYPASS_ENABLED || authStatus !== 'idle' || phase !== 'landing') {
      return;
    }

    bootstrapDevBypass();
  }, [authStatus, bootstrapDevBypass, phase]);

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
        <WorkspaceSidebar />
      </aside>
      <main className="right-panel">
        <SandboxWorkspace />
      </main>
    </div>
  );
}
