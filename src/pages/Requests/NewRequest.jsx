import RequestForm from "../../components/Requests/RequestForm"

function NewRequest() {
  return (
    <main className="px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Tutorías
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Nueva solicitud
        </h1>

        <p className="mt-2 text-slate-600">
          Completa la información para publicar una solicitud.
        </p>

        <div className="mt-8">
          <RequestForm />
        </div>
      </div>
    </main>
  )
}

export default NewRequest