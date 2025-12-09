<h1 className="text-xl font-bold text-gray-900">
RF Serveis - Pressupostos
</h1>
            <p className="text-sm text-gray-500">
              Benvingut/da, {currentUser.name || currentUser.email} (
              {currentUser.role === 'admin' ? 'Admin' : 'Usuari'})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Sortir
          </button>
        </div>
      </header>

      {/* SI ÉS ADMIN: panell complet */}
      {currentUser.role === 'admin' ? (
        <>
          {/* MENÚ DE NAVEGACIÓ ADMIN */}
          <nav className="bg-gray-100 border-b">
            <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
              <button
                onClick={() => setVistaActual('inici')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  vistaActual === 'inici'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Inici
              </button>

              <button
                onClick={() => setVistaActual('calculador')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  vistaActual === 'calculador'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Calculador de Vidres
              </button>

              <button
                disabled
                className="px-6 py-2 rounded-lg font-semibold text-gray-400 cursor-not-allowed"
              >
                Pressupostos (Pròximament)
              </button>
            </div>
          </nav>

          {/* CONTINGUT ADMIN */}
          <main className="max-w-6xl mx-auto px-4 py-6">
            {vistaActual === 'inici' && (
              <div className="space-y-6">
                <section>
                  <h2 className="text-lg font-semibold mb-2">
                    Crear Nou Pressupost
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona la categoria del pressupost:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setVistaActual('calculador')}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:scale-[1.01] text-left"
                    >
                      <h3 className="text-lg font-semibold mb-1">Vidres</h3>
                      <p className="text-sm text-blue-100">
                        Catàleg complet de vidres
                      </p>
                    </button>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Barandilla All Glass
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Barandilla Top Glass
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">Marquesines</h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Escaleras D&apos;opera
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">Escaleras RF</h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>

                    <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-left">
                      <h3 className="text-lg font-semibold mb-1">
                        Escaleras Escamoteables
                      </h3>
                      <p className="text-sm text-gray-500">Pròximament</p>
                      <span className="mt-2 inline-block text-xs font-semibold text-gray-400">
                        PRÒXIMAMENT
                      </span>
                    </div>
                  </div>
                </section>

                <section className="bg-white rounded-lg border p-4 text-sm text-gray-600">
                  <h4 className="font-semibold mb-2">ℹ️ Estat del Sistema</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>✅ Login funcional</li>
                    <li>✅ Base de dades configurada</li>
                    <li>✅ Tarifes Vallesglass importades</li>
                    <li>✅ Calculador de vidres operatiu</li>
                    <li>7 categories disponibles (1 activa, 6 pròximament)</li>
                  </ul>
                </section>
             </div>
        )}

        {vistaActual === 'calculador' && (
          <CalculadorVidres />
        )}
      </main>
    </div>
  );
}

export default App;
