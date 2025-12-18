import { useAuth } from './AuthContext';

// Fallback local por email (por si AuthContext no está aplicando cambios)
const ADMIN_EMAILS = new Set([
  'david@rfserveis.com',
  'rafael@rfserveis.com',
]);

export default function Header() {
  const auth = useAuth();

  // Compatibilidad: a veces existe profile, otras userProfile, y a veces solo user
  const profile = auth?.profile || auth?.userProfile || null;
  const user = auth?.user || null;

  const email =
    (profile?.email || user?.email || '').toLowerCase().trim();

  // isAdmin real (lo que venga del contexto) + fallback por email
  const isAdmin = !!auth?.isAdmin || ADMIN_EMAILS.has(email);

  const signOut = auth?.signOut || (() => {});

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo / titulo */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-slate-800">RF Presupuestos</span>
          <span className="text-sm text-gray-500 hidden sm:inline">Sistema de presupuestos</span>
        </div>

        {/* Navegacion */}
        <nav className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-800 font-semibold">
              {profile?.nombre || (email ? email.split('@')[0] : 'Usuario')}
            </div>
            <div className="text-xs text-gray-500">
              {isAdmin ? 'Administrador' : 'Usuario'}
            </div>

            {/* DEBUG VISIBLE (temporal): para saber qué está leyendo la app */}
            <div className="text-[10px] text-gray-400 mt-1 leading-tight">
              <div>debug email: {email || '(vacío)'}</div>
              <div>debug auth.isAdmin: {String(!!auth?.isAdmin)}</div>
              <div>debug fallbackAdmin: {String(ADMIN_EMAILS.has(email))}</div>
            </div>
          </div>

          {/* Botón Admin visible si eres admin */}
          {isAdmin && (
            <span className="px-3 py-1.5 text-sm rounded bg-blue-50 text-blue-700 font-semibold">
              Panel Admin
            </span>
          )}

          <button
            onClick={signOut}
            className="px-3 py-1.5 text-sm rounded bg-gray-100 hover:bg-gray-200"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
