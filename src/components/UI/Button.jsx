import { Link } from "react-router-dom"

const variants = {
  primary: "bg-blue-600 text-white shadow-lg shadow-blue-200 hover:-translate-y-0.5 hover:bg-blue-700 focus:ring-blue-200 dark:shadow-none",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200",
  dark: "bg-slate-900 text-white hover:bg-blue-700 focus:ring-slate-300",
  danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-100",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-200",
}

const sizes = {
  sm: "rounded-lg px-3 py-2 text-sm",
  md: "rounded-xl px-5 py-3",
  lg: "rounded-2xl px-6 py-3.5",
}

function classNames(...values) {
  return values.filter(Boolean).join(" ")
}

export default function Button({
  as = "button",
  to,
  variant = "primary",
  size = "md",
  className = "",
  children,
  type = "button",
  ...props
}) {
  const classes = classNames(
    "inline-flex items-center justify-center gap-2 font-bold transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className,
  )

  if (as === "link" || to) {
    return <Link to={to} className={classes} {...props}>{children}</Link>
  }

  return <button type={type} className={classes} {...props}>{children}</button>
}
