import { Link } from "react-router-dom"

function Login() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link
          to="/"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Volver al inicio
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Iniciar sesión
          </h1>

          <p className="mt-3 text-slate-600">
            Accede a tu cuenta de AulaConecta.
          </p>
        </div>

        <form className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Todavía no tienes cuenta?{" "}
          <Link
            to="/registro"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Registrarse
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Login