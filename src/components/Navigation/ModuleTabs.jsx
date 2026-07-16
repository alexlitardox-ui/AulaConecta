import { NavLink } from "react-router-dom"

function ModuleTabs({ label, items }) {
  return (
    <nav
      aria-label={label}
      className="mb-7 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
    >
      <div className="flex min-w-max gap-2">
        {items.map(({ label: itemLabel, to, end = false, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            {Icon ? <Icon size={17} aria-hidden="true" /> : null}
            {itemLabel}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default ModuleTabs
