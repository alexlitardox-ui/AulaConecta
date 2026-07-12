import { Link } from "react-router-dom"

function Register() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-12">
      <section className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <Link
          to="/"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Volver al inicio
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Crear una cuenta
          </h1>

          <p className="mt-3 text-slate-600">
            Regístrate para formar parte de AulaConecta.
          </p>
        </div>

        <form className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nombres
            </label>

            <input
              type="text"
              placeholder="Tus nombres"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Apellidos
            </label>

            <input
              type="text"
              placeholder="Tus apellidos"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Correo electrónico
            </label>

            <input
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Carrera
            </label>

            <select className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="">Selecciona una carrera</option>
              <option value="cdia">
                Ciencia de Datos e Inteligencia Artificial
              </option>
              <option value="sistemas">
                Sistemas de Información
              </option>
              <option value="software">
                Ingeniería de Software
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Semestre
            </label>

            <select className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
              <option value="">Selecciona un semestre</option>
              <option value="1">Primer semestre</option>
              <option value="2">Segundo semestre</option>
              <option value="3">Tercer semestre</option>
              <option value="4">Cuarto semestre</option>
              <option value="5">Quinto semestre</option>
              <option value="6">Sexto semestre</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Contraseña
            </label>

            <input
              type="password"
              placeholder="Crea una contraseña"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Confirmar contraseña
            </label>

            <input
              type="password"
              placeholder="Repite la contraseña"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 md:col-span-2"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tienes una cuenta?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  )
}

export default Register