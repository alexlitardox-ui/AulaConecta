export default function LoadingState({ label = "Cargando información..." }) {
  return (
    <div className="mt-12 text-center" role="status" aria-live="polite">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      <p className="mt-4 font-semibold text-slate-600">{label}</p>
    </div>
  )
}
