import { useAuth } from './AuthContext';

export default function Header() {
  const { profile, isAdmin, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo / titulo */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-slate-800">
            RF Presupuestos
          </span>
          <span className="text-sm text-gray-500">
            Sistema de presupuestos
          </span>
        </div>

        {/* Navegacion */}
        <nav className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-slate-800 font-semibold">
              {profile?.nombre || 'Usuario'}
            </div>
            <div className="text-xs text-gray-500">
              {isAdmin ? 'Administrador' : 'Usuario'}
            </div>
          </div>

          {/* Texto/boton visible solo para admin */}
          {isAdmin && (
            <span className="text-sm font-semibold text-blue-600">
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
