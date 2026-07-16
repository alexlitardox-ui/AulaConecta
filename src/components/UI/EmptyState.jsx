import Button from "./Button"

export default function EmptyState({ icon: Icon, title, description, actionLabel, actionTo, onAction }) {
  return (
    <section className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      {Icon ? <div className="mx-auto inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600"><Icon size={34} aria-hidden="true" /></div> : null}
      <h2 className="mt-5 text-xl font-black text-slate-900">{title}</h2>
      {description ? <p className="mx-auto mt-3 max-w-xl text-slate-500">{description}</p> : null}
      {actionLabel && (actionTo || onAction) ? (
        <div className="mt-6">
          <Button as={actionTo ? "link" : "button"} to={actionTo} onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </section>
  )
}
