const AuthLayout = ({
  kicker,
  title,
  subtitle,
  children,
  footer,
  sideTitle = "Task Manager",
  sideCopy = "A focused workspace for assigning work, tracking deadlines, and keeping every task visible.",
}) => {
  return (
    <div className="auth-shell">
      <div className="auth-card grid md:grid-cols-[0.95fr_1.05fr]">
        <aside className="auth-side hidden p-8 md:flex md:flex-col md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-100">
              Task Manager
            </p>
            <h2 className="mt-5 text-4xl font-bold leading-tight">{sideTitle}</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-teal-50/80">
              {sideCopy}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="auth-stat">
              <p className="text-lg font-bold">Plan</p>
              <p className="mt-1 text-xs text-teal-50/75">Tasks</p>
            </div>
            <div className="auth-stat">
              <p className="text-lg font-bold">Assign</p>
              <p className="mt-1 text-xs text-teal-50/75">Teams</p>
            </div>
            <div className="auth-stat">
              <p className="text-lg font-bold">Track</p>
              <p className="mt-1 text-xs text-teal-50/75">Status</p>
            </div>
          </div>
        </aside>

        <main className="p-6 sm:p-8">
          <div className="mb-7">
            <p className="auth-kicker">{kicker}</p>
            <h1 className="auth-title">{title}</h1>
            <p className="auth-copy">{subtitle}</p>
          </div>

          {children}

          {footer && <div className="mt-6">{footer}</div>}
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
