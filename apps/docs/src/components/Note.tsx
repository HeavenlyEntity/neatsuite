import clsx from 'clsx';
import type { ReactNode } from 'react';

type NoteProps = {
  type?: 'info' | 'warning' | 'success' | 'danger';
  className?: string;
  children: ReactNode;
};

const styles: Record<NonNullable<NoteProps['type']>, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200',
  danger: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200',
};

export function Note({ type = 'info', className, children }: NoteProps) {
  return (
    <div className={clsx('rounded-lg border p-3 text-sm', styles[type], className)}>
      {children}
    </div>
  );
}
