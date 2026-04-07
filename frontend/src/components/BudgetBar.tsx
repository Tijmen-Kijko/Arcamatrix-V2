import {
  useIsBudgetExhausted,
  useStreamBudgetResetAt,
  useStreamBudgetTier,
  useStreamStatus,
  useStreamTokenLimit,
  useStreamUpgradePrompt,
  useStreamUsedTokens,
} from '../hooks/useStream';
import './BudgetBar.css';

function formatResetLabel(resetsAt: string | null) {
  if (!resetsAt) {
    return 'No reset';
  }

  const resetDate = new Date(resetsAt);

  return `Resets ${resetDate.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  })} UTC`;
}

export function BudgetBar() {
  const status = useStreamStatus();
  const usedTokens = useStreamUsedTokens();
  const tokenLimit = useStreamTokenLimit();
  const budgetTier = useStreamBudgetTier();
  const resetsAt = useStreamBudgetResetAt();
  const isBudgetExhausted = useIsBudgetExhausted();
  const upgradePrompt = useStreamUpgradePrompt();

  const percentUsed =
    tokenLimit && tokenLimit > 0 ? Math.min((usedTokens / tokenLimit) * 100, 100) : 0;
  const remainingTokens =
    tokenLimit === null ? null : Math.max(tokenLimit - usedTokens, 0);
  const label =
    budgetTier === 'sandbox'
      ? 'Sandbox budget'
      : budgetTier === 'premium'
        ? 'Premium plan'
        : 'Free tier';
  const secondaryText =
    status === 'streaming'
      ? 'Live via SSE'
      : status === 'budget-exhausted'
        ? 'Upgrade to continue'
        : budgetTier === 'sandbox'
          ? 'One-time trial budget'
          : budgetTier === 'premium'
            ? 'Unlimited runs'
            : formatResetLabel(resetsAt);
  const primaryFootText =
    tokenLimit === null
      ? 'Unlimited usage'
      : isBudgetExhausted
        ? 'Budget exhausted'
        : budgetTier === 'sandbox'
          ? `${remainingTokens?.toLocaleString() ?? '0'} left in sandbox`
          : `${remainingTokens?.toLocaleString() ?? '0'} left today`;
  const valueText =
    tokenLimit === null
      ? `${usedTokens.toLocaleString()} / Unlimited`
      : `${usedTokens.toLocaleString()} / ${tokenLimit.toLocaleString()}`;

  return (
    <div
      className={`budget-bar ${status === 'streaming' ? 'live' : ''} ${
        isBudgetExhausted ? 'exhausted' : ''
      }`}
    >
      <div className="budget-bar-row">
        <span className="budget-bar-label">{label}</span>
        <span className="budget-bar-value">{valueText}</span>
      </div>

      <div className="budget-bar-track" aria-hidden="true">
        <div className="budget-bar-fill" style={{ width: `${percentUsed}%` }} />
      </div>

      <div className="budget-bar-row budget-bar-foot">
        <span>{primaryFootText}</span>
        <span>{secondaryText}</span>
      </div>

      {upgradePrompt && <div className="budget-bar-upgrade">{upgradePrompt}</div>}
    </div>
  );
}
