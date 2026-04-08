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
        {isWorkspace ? (
          <div className="chat-header">
            <div className="chat-header-title">Arcamatrix</div>
            <div className="project-chip">
              <div className="project-chip-dot" />
              Daily Tasks
            </div>
          </div>
        ) : (
          <div className="ws-titlebar">
            <div className="ws-dot" style={{ background: '#ff5f57' }} />
            <div className="ws-dot" style={{ background: '#ffbd2e' }} />
            <div className="ws-dot" style={{ background: '#28c840' }} />
            <div className="ws-title">workspace · arcamatrix.com</div>
            <div className="ws-title-spacer" />
          </div>
        )}

        {children}
      </div>
    </>
  );
}
