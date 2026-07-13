function PageLoader({ label = "Cargando contenido..." }) {
  return (
    <main className="flex min-h-[55vh] items-center justify-center px-5">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 dark:border-slate-700 dark:border-t-blue-400" />
        <p className="mt-4 font-semibold text-slate-600 dark:text-slate-300">{label}</p>
      </div>
    </main>
  )
}

export default PageLoader
