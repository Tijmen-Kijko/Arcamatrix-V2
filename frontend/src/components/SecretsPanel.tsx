import { useState, useCallback } from 'react';
import './SecretsPanel.css';

interface Secret {
  id: string;
  name: string;
  value: string;
}

export function SecretsPanel() {
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = useCallback(() => {
    const name = newName.trim();
    const value = newValue.trim();
    if (!name || !value) return;

    setSecrets((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, name, value },
    ]);
    setNewName('');
    setNewValue('');
  }, [newName, newValue]);

  const handleRemove = useCallback((id: string) => {
    setSecrets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAdd();
    },
    [handleAdd],
  );

  return (
    <div className="secrets-panel">
      <div className="secrets-header">
        <h2 className="secrets-title">Secrets</h2>
        <p className="secrets-subtitle">
          Environment variables available to your agent's backend functions.
        </p>
      </div>

      <div className="secrets-list-card">
        {secrets.length === 0 ? (
          <div className="secrets-empty">
            <svg
              className="secrets-empty-icon"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <span className="secrets-empty-text">No secrets yet</span>
          </div>
        ) : (
          <div className="secrets-entries">
            {secrets.map((s) => (
              <div key={s.id} className="secret-row">
                <span className="secret-name">{s.name}</span>
                <span className="secret-value">{'•'.repeat(12)}</span>
                <button
                  className="secret-remove"
                  type="button"
                  onClick={() => handleRemove(s.id)}
                  title="Remove secret"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="secrets-add-card">
        <span className="secrets-add-label">Add a secret</span>
        <div className="secrets-add-row">
          <input
            className="secrets-input secrets-input-name"
            type="text"
            placeholder="SECRET_NAME"
            value={newName}
            onChange={(e) => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
            onKeyDown={handleKeyDown}
          />
          <input
            className="secrets-input secrets-input-value"
            type="password"
            placeholder="value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="secrets-add-btn"
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim() || !newValue.trim()}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
