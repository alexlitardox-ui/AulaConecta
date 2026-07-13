function ChartCard({ title, description, children, className = "" }) {
  return <article className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`}>
    <div className="mb-5"><h2 className="text-lg font-black text-slate-950 dark:text-white">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}</div>
    {children}
  </article>
}
export default ChartCard
