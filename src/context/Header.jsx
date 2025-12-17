import { useAuth } from '../context/AuthContext';

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
        <nav className="flex items-center gap-6">
          <span className="text-gray-700 text-sm">
            {profile?.nombre}
          </span>

          <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700">
            {isAdmin ? 'Administrador' : 'Usuario'}
          </span>

          {/* BOTON SOLO ADMIN */}
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
