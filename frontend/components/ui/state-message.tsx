type StateMessageProps = {
  title: string;
  description: string;
  tone?: 'default' | 'error';
  icon?: React.ReactNode;
};

export function StateMessage({
  title,
  description,
  tone = 'default',
  icon,
}: StateMessageProps) {
  const toneClassName =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <div className={`rounded-2xl border px-4 py-8 text-center ${toneClassName}`}>
      {icon && <div className="flex justify-center">{icon}</div>}
      <h4 className="text-sm font-black uppercase tracking-widest">{title}</h4>
      <p className="mt-2 text-sm font-medium leading-relaxed opacity-70">{description}</p>
    </div>
  );
}
