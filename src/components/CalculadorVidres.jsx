import { useState, useEffect } from 'react';
import { calcularPreuVidre, getProveidors } from '../services/vidres';
import { traductiones as t } from '../locales/es';

const CalculadorVidres = () => {
  const [mides, setMides] = useState({
    amplada: '',
    alcada: '',
    quantitat: 1,
    forma: 'recte'
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
    perimetreUnitat: 0
  });

  const [pressupost, setPressupost] = useState(null);
  const [calculant, setCalculant] = useState(false);
  const [error, setError] = useState('');
  const [proveidorsDisponibles, setProveidorsDisponibles] = useState([]);

  useEffect(() => {
    carregarProveidors();
  }, []);

  const carregarProveidors = async () => {
    try {
      const proveidors = await getProveidors('vidre');
      setProveidorsDisponibles(proveidors);
    } catch (err) {
      console.error('Error cargando proveedores:', err);
      setError(t.calculador.errorCargarProveedores);
    }
  };

  const tipusVidre = [
    t.calculador.floatMonolitico,
    t.calculador.laminado,
    t.calculador.temperat,
    t.calculador.laminadoTemperat,
    t.calculador.laminadoSentryGlass
  ];

  const gruixosMonolitic = ['4', '5', '6', '8', '10', '12', '15'];
  const gruixosLaminat = ['3+3', '4+4', '5+5', '6+6', '8+8', '10+10'];

  const colors = [
    t.calculador.incoloro,
    t.calculador.verde,
    t.calculador.grisBronce,
    t.calculador.mate,
    t.calculador.optico,
    t.calculador.grisMate
  ];

  useEffect(() => {
    if (mides.amplada && mides.alcada) {
      const amplada = parseFloat(mides.amplada);
      const alcada = parseFloat(mides.alcada);
      
      const m2Unitat = (amplada * alcada) / 1000000;
      const m2Total = m2Unitat * parseInt(mides.quantitat || 1);
      const perimetreUnitat = (2 * (amplada + alcada)) / 1000;
      
      setResultat({
        m2Unitat: m2Unitat.toFixed(4),
        m2Total: m2Total.toFixed(4),
        perimetreUnitat: perimetreUnitat.toFixed(2)
      });
    }
  }, [mides.amplada, mides.alcada, mides.quantitat]);

  const potFerForats = vidre.tipus === t.calculador.temperat || 
                       vidre.tipus === t.calculador.laminadoTemperat || 
                       vidre.tipus === t.calculador.laminadoSentryGlass;

  const getOpcionsGruix = () => {
    if (vidre.tipus === t.calculador.floatMonolitico || vidre.tipus === t.calculador.temperat) {
      return gruixosMonolitic;
    } else if (vidre.tipus.includes(t.calculador.laminado)) {
      return gruixosLaminat;
    }
    return [];
  };

  const validarFormulari = () => {
    if (!mides.amplada || !mides.alcada) {
      setError(t.calculador.errorMedidas);
      return false;
    }
    if (!vidre.tipus || !vidre.gruix || !vidre.color) {
      setError(t.calculador.errorEspecificaciones);
      return false;
    }
    if (processos.forats && (!processos.quantitatForats || !processos.diametreForats)) {
      setError(t.calculador.errorForats);
      return false;
    }
    if (processos.puntes && !processos.quantitatPuntes) {
      setError(t.calculador.errorPuntas);
      return false;
    }
    return true;
  };

  const handleCalcular = async () => {
    setError('');
    
    if (!validarFormulari()) {
      return;
    }

    setCalculant(true);
    
    try {
      const configuracio = {
        amplada: parseFloat(mides.amplada),
        alcada: parseFloat(mides.alcada),
        quantitat: parseInt(mides.quantitat),
        forma: mides.forma,
        tipus: vidre.tipus,
        gruix: vidre.gruix,
        color: vidre.color,
        proveidor: vidre.proveidor,
        cantos: processos.cantos,
        puntes: processos.puntes,
        quantitatPuntes: parseInt(processos.quantitatPuntes) || 0,
        forats: processos.forats,
        quantitatForats: parseInt(processos.quantitatForats) || 0,
        diametreForats: processos.diametreForats
      };

      const resultatCalcul = await calcularPreuVidre(configuracio);
      setPressupost(resultatCalcul);
      
    } catch (err) {
      console.error('Error calculando:', err);
      setError(err.message || t.calculador.errorCalculador);
    } finally {
      setCalculant(false);
    }
  };

  const handleNetejar = () => {
    setMides({ amplada: '', alcada: '', quantitat: 1, forma: 'recte' });
    setVidre({ tipus: '', gruix: '', color: '', proveidor: 'Vallesglass' });
    setProcessos({ cantos: false, puntes: false, quantitatPuntes: 0, forats: false, quantitatForats: 0, diametreForats: '' });
    setPressupost(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        🪟 {t.calculador.titulo}
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">⚠️ {t.mensajes.error}</p>
          <p>{error}</p>
        </div>
      )}

      {/* SECCIÓN 1: MEDIDAS */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">{t.calculador.seccion1}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.amplada} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={mides.amplada}
              onChange={(e) => setMides({...mides, amplada: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder={t.calculador.amplada_placeholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.alcada} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={mides.alcada}
              onChange={(e) => setMides({...mides, alcada: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder={t.calculador.alcada_placeholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.quantitat}
            </label>
            <input
              type="number"
              value={mides.quantitat}
              onChange={(e) => setMides({...mides, quantitat: parseInt(e.target.value) || 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded border border-blue-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.m2Unidad}
            </label>
            <p className="text-lg font-semibold text-blue-600">{resultat.m2Unitat} m²</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.m2Total}
            </label>
            <p className="text-lg font-semibold text-blue-600">{resultat.m2Total} m²</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.calculador.forma}
          </label>
          <select
            value={mides.forma}
            onChange={(e) => setMides({...mides, forma: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="recte">{t.calculador.recte}</option>
            <option value="inclinat">{t.calculador.inclinat}</option>
          </select>
        </div>
      </div>

      {/* SECCIÓN 2: ESPECIFICACIONES DEL VIDRIO */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-green-800">{t.calculador.seccion2}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.tipus} <span className="text-red-500">*</span>
            </label>
            <select
              value={vidre.tipus}
              onChange={(e) => setVidre({...vidre, tipus: e.target.value, gruix: ''})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t.calculador.selectTip}</option>
              {tipusVidre.map(tipus => (
                <option key={tipus} value={tipus}>{tipus}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.gruix} <span className="text-red-500">*</span>
            </label>
            <select
              value={vidre.gruix}
              onChange={(e) => setVidre({...vidre, gruix: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              disabled={!vidre.tipus}
            >
              <option value="">{t.calculador.selectGruix}</option>
              {getOpcionsGruix().map(gruix => (
                <option key={gruix} value={gruix}>{gruix} {t.calculador.mm}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.color} <span className="text-red-500">*</span>
            </label>
            <select
              value={vidre.color}
              onChange={(e) => setVidre({...vidre, color: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t.calculador.selectColor}</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.calculador.proveidor}
            </label>
            <select
              value={vidre.proveidor}
              onChange={(e) => setVidre({...vidre, proveidor: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
            >
              {proveidorsDisponibles.map(prov => (
                <option key={prov.id} value={prov.nom}>{prov.nom}</option>
              ))}
            </select>
          </div>
        </div>

        {vidre.tipus === t.calculador.laminadoSentryGlass && (
          <p className="mt-3 text-sm text-blue-600 bg-blue-100 p-2 rounded">
            ℹ️ {t.calculador.infoSentryGlass}
          </p>
        )}
      </div>

      {/* SECCIÓN 3: PROCESOS ADICIONALES */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">{t.calculador.seccion3}</h2>
        
        {/* Cantos */}
        <div className="mb-4 p-3 bg-white rounded border border-purple-200">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={processos.cantos}
              onChange={(e) => setProcessos({...processos, cantos: e.target.checked})}
              className="mr-2 w-4 h-4"
            />
            <span className="font-medium">{t.calculador.cantosLabel}</span>
          </label>
          {processos.cantos && (
            <p className="text-sm text-gray-600 ml-6">
              {t.calculador.cantosDesc
                .replace('{perimetre}', resultat.perimetreUnitat)
                .replace('{quantitat}', mides.quantitat)
                .replace('{total}', (parseFloat(resultat.perimetreUnitat) * parseInt(mides.quantitat || 1)).toFixed(2))}
            </p>
          )}
        </div>

        {/* Puntas */}
        <div className="mb-4 p-3 bg-white rounded border border-purple-200">
          <label className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={processos.puntes}
              onChange={(e) => setProcessos({...processos, puntes: e.target.checked})}
              className="mr-2 w-4 h-4"
            />
            <span className="font-medium">{t.calculador.puntasLabel}</span>
          </label>
          {processos.puntes && (
            <div className="ml-6">
              <label className="block text-sm text-gray-600 mb-1">{t.calculador.puntasQuantitat}</label>
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

        {/* Agujeros */}
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
              {t.calculador.foratsLabel} {!potFerForats && `(${t.calculador.foratsDesc})`}
            </span>
          </label>
          {processos.forats && potFerForats && (
            <div className="ml-6 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.calculador.foratsQuantitat}</label>
                <input
                  type="number"
                  value={processos.quantitatForats}
                  onChange={(e) => setProcessos({...processos, quantitatForats: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t.calculador.foratsDiametre}</label>
                <input
                  type="number"
                  value={processos.diametreForats}
                  onChange={(e) => setProcessos({...processos, diametreForats: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md"
                  min="11"
                  max="40"
                  placeholder={t.calculador.foratsPlaceholder}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RESUMEN DEL PRESUPUESTO */}
      {pressupost && (
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300">
          <h2 className="text-2xl font-bold mb-4 text-blue-800">📊 {t.calculador.seccionResum}</h2>
          
          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">{t.calculador.vidrio}:</h3>
            <p className="text-sm text-gray-600">{pressupost.vidre.nom}</p>
            <p className="text-sm text-gray-600">{t.calculador.referencia}: {pressupost.vidre.referencia}</p>
            <div className="mt-2 text-sm">
              <p>{t.calculador.precioLista}: {pressupost.vidre.preuLlista.toFixed(2)} €/{t.calculador.m2Unidad}</p>
              <p className="text-green-600">{t.calculador.descuento}: {pressupost.vidre.descompte}%</p>
              <p className="font-semibold">{t.calculador.precioNeto}: {pressupost.vidre.preuNetM2.toFixed(2)} €/{t.calculador.m2Unidad}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-semibold text-gray-700 mb-2">{t.calculador.medidas}:</h3>
            <p className="text-sm">{pressupost.mides.amplada} × {pressupost.mides.alcada} mm</p>
            <p className="text-sm">{pressupost.mides.m2Unitat} m² × {pressupost.mides.quantitat} unidades = {pressupost.mides.m2Total} m²</p>
          </div>

          {pressupost.detallProcessos.length > 0 && (
            <div className="bg-white p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">{t.calculador.detalleProcessos}:</h3>
              {pressupost.detallProcessos.map((proc, idx) => (
                <div key={idx} className="text-sm flex justify-between py-1">
                  <span>{proc.tipus}: {proc.quantitat} {proc.unitat} × {proc.preuUnitat.toFixed(2)} €</span>
                  <span className="font-semibold">{proc.total.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-600 text-white p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">{t.calculador.vidreBase}:</span>
              <span className="text-xl font-bold">{pressupost.preus.base} €</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg">{t.calculador.procesos}:</span>
              <span className="text-xl font-bold">{pressupost.preus.processos} €</span>
            </div>
            <div className="border-t-2 border-blue-400 pt-2 flex justify-between items-center">
              <span className="text-2xl font-bold">{t.calculador.total}:</span>
              <span className="text-3xl font-bold">{pressupost.preus.total} €</span>
            </div>
          </div>
        </div>
      )}

      {/* BOTONES */}
      <div className="flex gap-3">
        <button
          onClick={handleCalcular}
          disabled={calculant}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {calculant ? t.calculador.calculando : `🔢 ${t.calculador.calcularPrecio}`}
        </button>
        <button
          onClick={handleNetejar}
          className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition"
        >
          🔄 {t.calculador.limpiar}
        </button>
        {pressupost && (
          <button
            className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            💾 {t.calculador.guardarPresupuesto}
          </button>
        )}
      </div>
    </div>
  );
};

export default CalculadorVidres;
