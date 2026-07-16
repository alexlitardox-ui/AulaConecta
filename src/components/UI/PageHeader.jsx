export default function PageHeader({ eyebrow, title, description, actions, icon: Icon }) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-blue-600">
            {Icon ? <Icon size={16} aria-hidden="true" /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-col gap-3 sm:flex-row">{actions}</div> : null}
    </header>
  )
}
