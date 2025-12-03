import { useState, useEffect } from 'react';

const CalculadorVidres = () => {
  // Estats del formulari
  const [mides, setMides] = useState({
    amplada: '',
    alcada: '',
    quantitat: 1,
    forma: 'recte' // recte o inclinat
  });

  const [vidre, setVidre] = useState({
    tipus: '',
    gruix: '',
    color: '',
    proveidor: 'Vallesglass'
  });

  const [processos, setProcessos] = useState({
    cantos: false,
    puntes: false,
    quantitatPuntes: 0,
    forats: false,
    quantitatForats: 0,
    diametreForats: ''
  });

  const [resultat, setResultat] = useState({
    m2Unitat: 0,
    m2Total: 0,
    perimetreUnitat: 0,
    preuBase: 0,
    preuProcessos: 0,
    preuTotal: 0
  });

  // Opcions de vidre
  const tipusVidre = [
    'Float / Monolític',
    'Laminat',
    'Temperat',
    'Laminat/Temperat',
    'Laminat Sentry Glass'
  ];

  const gruixosMonolitic = ['4', '5', '6', '8', '10', '12', '15'];
  const gruixosLaminat = ['3+3', '4+4', '5+5', '6+6', '8+8', '10+10'];

  const colors = [
    'INCOLORO',
    'VERDE',
    'GRIS/BRONCE',
    'MATE',
    'OPTICO',
    'GRIS/MATE'
  ];

  // Calcular m² i perímetre automàticament
  useEffect(() => {
    if (mides.amplada && mides.alcada) {
      const amplada = parseFloat(mides.amplada);
      const alcada = parseFloat(mides.alcada);
      
      // Càlcul m²
      const m2Unitat = (amplada * alcada) / 1000000;
      const m2Total = m2Unitat * parseInt(mides.quantitat || 1);
      
      // Càlcul perímetre (en metres)
      const perimetreUnitat = (2 * (amplada + alcada)) / 1000;
      
      setResultat(prev => ({
        ...prev,
        m2Unitat: m2Unitat.toFixed(4),
        m2Total: m2Total.toFixed(4),
        perimetreUnitat: perimetreUnitat.toFixed(2)
      }));
    }
  }, [mides.amplada, mides.alcada, mides.quantitat]);

  // Validació forats només per temperats
  const potFerForats = vidre.tipus === 'Temperat' || vidre.tipus === 'Laminat/Temperat' || vidre.tipus === 'Laminat Sentry Glass';

  // Obtenir opcions de gruix segons el tipus
  const getOpcionsGruix = () => {
    if (vidre.tipus === 'Float / Monolític' || vidre.tipus === 'Temperat') {
      return gruixosMonolitic;
    } else if (vidre.tipus.includes('Laminat')) {
      return gruixosLaminat;
    }
    return [];
  };

  const handleCalcular = async () => {
    // TODO: Calcular preu real des de la base de dades
    alert('Càlcul en desenvolupament - Properament!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        🪟 Calculador de Vidres
      </h1>

      {/* SECCIÓ 1: MIDES */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">1. Mides</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amplada (mm)
            </label>
            <input
              type="number"
              value={mides.amplada}
              onChange={(e) => setMides({...mides, amplada: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alçada (mm)
            </label>
            <input
              type="number"
              value={mides.alcada}
              onChange={(e) => setMides({...mides, alcada: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: 1500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantitat
            </label>
            <input
              type="number"
              value={mides.quantitat}
              onChange={(e) => setMides({...mides, quantitat: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="text-sm text-gray-600">m² per unitat:</p>
            <p className="text-2xl font-bold text-blue-600">{resultat.m2Unitat}</p>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="text-sm text-gray-600">m² total:</p>
            <p className="text-2xl font-bold text-blue-600">{resultat.m2Total}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Forma
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="recte"
                checked={mides.forma === 'recte'}
                onChange={(e) => setMides({...mides, forma: e.target.value})}
                className="mr-2"
              />
              Recte
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="inclinat"
                checked={mides.forma === 'inclinat'}
                onChange={(e) => setMides({...mides, forma: e.target.value})}
                className="mr-2"
              />
              Inclinat
            </label>
          </div>
          {mides.forma === 'inclinat' && (
            <p className="mt-2 text-sm text-orange-600">
              ⚠️ Recàrrec per vidre inclinat: Pendent de definir
            </p>
          )}
        </div>
      </div>

      {/* SECCIÓ 2: TIPUS DE VIDRE */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-green-800">2. Tipus de Vidre</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipus
            </label>
            <select
              value={vidre.tipus}
              onChange={(e) => setVidre({...vidre, tipus: e.target.value, gruix: ''})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecciona tipus...</option>
              {tipusVidre.map(tipus => (
                <option key={tipus} value={tipus}>{tipus}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gruix
            </label>
            <select
              value={vidre.gruix}
              onChange={(e) => setVidre({...vidre, gruix: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              disabled={!vidre.tipus}
            >
              <option value="">Selecciona gruix...</option>
              {getOpcionsGruix().map(gruix => (
                <option key={gruix} value={gruix}>{gruix} mm</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select
              value={vidre.color}
              onChange={(e) => setVidre({...vidre, color: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="">Selecciona color...</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveïdor
            </label>
            <select
              value={vidre.proveidor}
              onChange={(e) => setVidre({...vidre, proveidor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="Vallesglass">Vallesglass</option>
              <option value="Baros Vision" disabled>Baros Vision (Pròximament)</option>
              <option value="Control Glass" disabled>Control Glass (Pròximament)</option>
            </select>
          </div>
        </div>

        {vidre.tipus === 'Laminat Sentry Glass' && (
          <p className="mt-3 text-sm text-blue-600 bg-blue-100 p-2 rounded">
            ℹ️ Laminat Sentry Glass sempre és temperat i s'utilitza per marquesines
          </p>
        )}
      </div>

      {/* SECCIÓ 3: PROCESSOS */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">3. Processos Addicionals</h2>
        
        {/* Cantos */}
        <div className="mb-4 p-3 bg-white rounded border border-purple-200">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={processos.cantos}
              onChange={(e) => setProcessos({...processos, cantos: e.target.checked})}
              className="mr-2 w-4 h-4"
            />
            <span className="font-medium">Cantos (perímetre automàtic)</span>
          </label>
          {processos.cantos && (
            <p className="text-sm text-gray-600 ml-6">
              Perímetre: {resultat.perimetreUnitat} ml × {mides.quantitat} = {(parseFloat(resultat.perimetreUnitat) * parseInt(mides.quantitat || 1)).toFixed(2)} ml
            </p>
          )}
        </div>

        {/* Puntes */}
        <div className="mb-4 p-3 bg-white rounded border border-purple-200">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={processos.puntes}
              onChange={(e) => setProcessos({...processos, puntes: e.target.checked})}
              className="mr-2 w-4 h-4"
            />
            <span className="font-medium">Puntes (sempre roma polida radi 2mm)</span>
          </label>
          {processos.puntes && (
            <div className="ml-6">
              <label className="block text-sm text-gray-600 mb-1">Quantitat de puntes:</label>
              <input
                type="number"
                value={processos.quantitatPuntes}
                onChange={(e) => setProcessos({...processos, quantitatPuntes: e.target.value})}
                className="w-32 px-3 py-1 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
          )}
        </div>

        {/* Forats */}
        <div className="p-3 bg-white rounded border border-purple-200">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={processos.forats}
              onChange={(e) => setProcessos({...processos, forats: e.target.checked})}
              className="mr-2 w-4 h-4"
              disabled={!potFerForats}
            />
            <span className={`font-medium ${!potFerForats ? 'text-gray-400' : ''}`}>
              Forats/Taladres {!potFerForats && '(només per vidres temperats)'}
            </span>
          </label>
          {processos.forats && potFerForats && (
            <div className="ml-6 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantitat:</label>
                <input
                  type="number"
                  value={processos.quantitatForats}
                  onChange={(e) => setProcessos({...processos, quantitatForats: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Diàmetre (mm):</label>
                <input
                  type="number"
                  value={processos.diametreForats}
                  onChange={(e) => setProcessos({...processos, diametreForats: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md"
                  min="11"
                  max="40"
                  placeholder="11-40"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESUM */}
      <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">📊 Resum del Pressupost</h2>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-lg">
            <span>Vidre base:</span>
            <span className="font-semibold">--- €</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>Processos:</span>
            <span className="font-semibold">--- €</span>
          </div>
          <div className="border-t-2 border-gray-400 pt-2 flex justify-between text-2xl font-bold text-blue-600">
            <span>TOTAL:</span>
            <span>--- €</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCalcular}
            className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Calcular Preu
          </button>
          <button
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Guardar Pressupost
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-500 text-center">
          ℹ️ El càlcul de preus es farà consultantla base de dades de tarifes
        </p>
      </div>
    </div>
  );
};

export default CalculadorVidres;
