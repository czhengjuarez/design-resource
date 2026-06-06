/* Vendored from github.com/czhengjuarez/Keel @ b26c1f9 */

export type KeelSize = 'sm' | 'md' | 'lg';
export type KeelButtonVariant = 'primary' | 'secondary' | 'ghost' | 'tint' | 'danger';
export type KeelBadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'default';

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export function buttonClass({
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}: { variant?: KeelButtonVariant; size?: KeelSize; disabled?: boolean; className?: string } = {}) {
  return cx('of-btn', `of-btn--${variant}`, `of-btn--${size}`, disabled && 'of-btn--disabled', className);
}

export function badgeClass({
  variant = 'default',
  className,
}: { variant?: KeelBadgeVariant; className?: string } = {}) {
  return cx('of-badge', `of-badge--${variant}`, className);
}

export function cardClass({ className }: { className?: string } = {}) {
  return cx('of-card', className);
}

export function inputClass({ className }: { className?: string } = {}) {
  return cx('of-input', className);
}

export function selectClass({ className }: { className?: string } = {}) {
  return cx('of-select', className);
}
