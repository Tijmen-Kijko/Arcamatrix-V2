import type { ReactNode } from 'react';
import { useAppPhase } from '../hooks/useAppPhase';

interface WorkspaceWindowProps {
  label?: string;
  children: ReactNode;
}

export function WorkspaceWindow({ label = 'ARCAMATRIX WORKSPACE', children }: WorkspaceWindowProps) {
  const phase = useAppPhase();
  const isWorkspace = phase === 'workspace';

  return (
    <>
      <div className={`ws-label ${isWorkspace ? 'hidden' : ''}`}>
        {label}
      </div>

      <div className={`ws-window ${isWorkspace ? 'full' : ''}`}>
        <div className="ws-titlebar">
          {!isWorkspace && (
            <>
              <div className="ws-dot" style={{ background: '#ff5f57' }} />
              <div className="ws-dot" style={{ background: '#ffbd2e' }} />
              <div className="ws-dot" style={{ background: '#28c840' }} />
            </>
          )}
          <div className="ws-title">
            {isWorkspace ? 'Chat · Arcamatrix' : 'workspace · arcamatrix.com'}
          </div>
          {!isWorkspace && <div className="ws-title-spacer" />}
        </div>

        {children}
      </div>
    </>
  );
}
