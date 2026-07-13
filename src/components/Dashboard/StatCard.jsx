function StatCard({
  title,
  value,
  description,
  icon: Icon,
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Icon size={24} />
        </div>

        <span className="text-3xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <h2 className="mt-5 font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  )
}

export default StatCard