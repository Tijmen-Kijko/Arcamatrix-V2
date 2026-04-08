import { useEffect, useState } from 'react';
import { useAppPhase, useSetAppPhase } from '../hooks/useAppPhase';
import {
  useAuthStatus,
  useBootstrapDevBypass,
  useIsDevBypass,
  useSignInWithGoogle,
  useStartMagicLink,
  useVerifyMagicLink,
} from '../hooks/useAuth';
import { useIsSplitView } from '../hooks/useWorkspaceLayout';
import { SignupPanel } from './SignupPanel';
import { SandboxWorkspace } from './SandboxWorkspace';
import { WorkspaceSidebar, type WorkspaceView } from './WorkspaceSidebar';
import { IntegrationsPage } from './IntegrationsPage';
import { SkillsPage } from './SkillsPage';
import { SecretsPanel } from './SecretsPanel';
import { TasksPage } from './TasksPage';
import { PreviewPanel } from './PreviewPanel';
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

  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('chat');

  const isSplitView = useIsSplitView();
  const isWorkspace = phase === 'workspace';
  const isTransitioning = phase === 'transitioning';
  const showPreview = isWorkspace && workspaceView === 'chat' && isSplitView;

  const className = [
    'landing-layout',
    isTransitioning ? 'transitioning' : '',
    isWorkspace ? 'ws-mode' : '',
    showPreview ? 'split-view' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      {/* Pre-login: signup panel as left panel */}
      {!isWorkspace && (
        <aside className="left-panel">
          <SignupPanel
            onSignup={handleSignup}
            onVerifyMagicLink={handleVerifyMagicLink}
          />
        </aside>
      )}

      {/* Post-login: sidebar */}
      <WorkspaceSidebar activeView={workspaceView} onNavigate={setWorkspaceView} />

      {/* Main content */}
      <main className="right-panel">
        {isWorkspace && workspaceView === 'tasks' ? (
          <TasksPage />
        ) : isWorkspace && workspaceView === 'integrations' ? (
          <IntegrationsPage />
        ) : isWorkspace && workspaceView === 'skills' ? (
          <SkillsPage />
        ) : isWorkspace && workspaceView === 'secrets' ? (
          <SecretsPanel />
        ) : (
          <SandboxWorkspace />
        )}
      </main>

      {/* Preview panel — triggered by Arcamatrix via open_split_view event */}
      {showPreview && <PreviewPanel />}
    </div>
  );
}
