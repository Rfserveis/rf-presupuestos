// CalculadorEscalerasRF.jsx - Calculador de Escaleras RF (Resistentes al Fuego)
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { searchClientes } from '../services/clientes';

const CERTIFICACIONES = [
  { id: 'ei30', nombre: 'EI-30', factor: 1.0, descripcion: '30 minutos' },
  { id: 'ei60', nombre: 'EI-60', factor: 1.25, descripcion: '60 minutos' },
  { id: 'ei90', nombre: 'EI-90', factor: 1.50, descripcion: '90 minutos' },
  { id: 'ei120', nombre: 'EI-120', factor: 1.80, descripcion: '120 minutos' },
];

const ESTRUCTURAS_RF = [
  { id: 'acero_protegido', nombre: 'Acero con Protección', precio_base: 550 },
  { id: 'hormigon', nombre: 'Hormigón Prefabricado', precio_base: 480 },
  { id: 'acero_encapsulado', nombre: 'Acero Encapsulado', precio_base: 620 },
];

const PELDANOS_RF = [
  { id: 'hormigon', nombre: 'Hormigón', precio_ud: 85 },
  { id: 'chapa_relleno', nombre: 'Chapa con Relleno RF', precio_ud: 110 },
  { id: 'piedra_natural', nombre: 'Piedra Natural', precio_ud: 145 },
];

const BARANDILLAS_RF = [
  { id: 'metalica', nombre: 'Metálica Estándar', precio_ml: 120 },
  { id: 'metalica_vidrio', nombre: 'Metálica + Vidrio RF', precio_ml: 280 },
  { id: 'sin', nombre: 'Sin barandilla (muro)', precio_ml: 0 },
];

const CalculadorEscalerasRF = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    plantas: 1,
    peldanos_planta: 18,
    ancho: 1000,
    certificacion: 'ei60',
    estructura: 'acero_protegido',
    tipo_peldano: 'hormigon',
    barandilla: 'metalica',
    lados_barandilla: 2,
    incluir_puertas_rf: false,
    num_puertas: 0,
    incluir_montaje: true,
    acceso_dificil: false,
  });

  const [clienteId, setClienteId] = useState(clientePreseleccionado || null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesResultados, setClientesResultados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const buscar = async () => {
      if (busquedaCliente.length >= 2) {
        const { success, data } = await searchClientes(busquedaCliente);
        if (success) { setClientesResultados(data); setMostrarBusqueda(true); }
      } else { setClientesResultados([]); setMostrarBusqueda(false); }
    };
    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  const calcular = () => {
    const { plantas, peldanos_planta, ancho, certificacion, estructura, tipo_peldano, barandilla, lados_barandilla, incluir_puertas_rf, num_puertas, incluir_montaje, acceso_dificil } = formData;
    
    const numPlantas = parseInt(plantas);
    const numPeldanos = parseInt(peldanos_planta);
    
    if (numPlantas <= 0 || numPeldanos <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce los datos' });
      return;
    }

    const totalPeldanos = numPlantas * numPeldanos;
    const desarrolloM = (totalPeldanos * 0.28) + (numPlantas * 1.2);

    const certData = CERTIFICACIONES.find(c => c.id === certificacion);
    const estructuraData = ESTRUCTURAS_RF.find(e => e.id === estructura);
    const peldanoData = PELDANOS_RF.find(p => p.id === tipo_peldano);
    const barandillaData = BARANDILLAS_RF.find(b => b.id === barandilla);

    let precio_estructura = desarrolloM * estructuraData.precio_base * certData.factor;
    if (parseInt(ancho) > 1000) {
      precio_estructura *= 1 + ((parseInt(ancho) - 1000) / 100) * 0.12;
    }

    let precio_peldanos = totalPeldanos * peldanoData.precio_ud * certData.factor;
    const precio_descansillos = numPlantas * 380;

    const ml_barandilla = desarrolloM * parseInt(lados_barandilla);
    const precio_barandilla = ml_barandilla * barandillaData.precio_ml;

    let precio_puertas = 0;
    if (incluir_puertas_rf && parseInt(num_puertas) > 0) {
      precio_puertas = parseInt(num_puertas) * 850 * certData.factor;
    }

    let recargo_acceso = 0;
    if (acceso_dificil) {
      recargo_acceso = (precio_estructura + precio_peldanos) * 0.20;
    }

    let precio_montaje = 0;
    if (incluir_montaje) {
      precio_montaje = desarrolloM * 220 * certData.factor;
    }

    const subtotal = precio_estructura + precio_peldanos + precio_descansillos + precio_barandilla + precio_puertas + recargo_acceso + precio_montaje;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      total_peldanos: totalPeldanos,
      desarrollo: desarrolloM,
      ml_barandilla,
      desglose: {
        plantas: numPlantas,
        peldanos: numPeldanos,
        ancho: ancho + ' mm',
        certificacion: certData.nombre,
        estructura: estructuraData.nombre,
        peldano: peldanoData.nombre,
        barandilla: barandillaData.nombre,
      },
      precios: { estructura: precio_estructura, peldanos: precio_peldanos, descansillos: precio_descansillos, barandilla: precio_barandilla, puertas: precio_puertas, recargo_acceso, montaje: precio_montaje },
      subtotal, iva, total
    });
    setMensaje(null);
  };

  const guardarPresupuesto = async () => {
    if (!resultado) { setMensaje({ tipo: 'error', texto: 'Primero calcula' }); return; }
    if (!clienteId && !clienteSeleccionado) { setMensaje({ tipo: 'error', texto: 'Selecciona cliente' }); return; }
    setGuardando(true);
    try {
      const { success, data, error } = await createPresupuesto({
        categoria: CATEGORIAS.ESCALERAS_RF,
        cliente_id: clienteId || clienteSeleccionado?.id,
        datos: { formData, resultado },
        subtotal: resultado.subtotal,
        iva: 21,
        total: resultado.total,
        created_by: user?.id
      });
      if (success) {
        setMensaje({ tipo: 'success', texto: `Presupuesto ${data.numero} guardado` });
        if (onGuardar) onGuardar(data);
      } else {
        setMensaje({ tipo: 'error', texto: error || 'Error' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar' });
    } finally {
      setGuardando(false);
    }
  };

  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setClienteId(cliente.id);
    setBusquedaCliente(cliente.nombre);
    setMostrarBusqueda(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          Calculador Escaleras RF
        </h2>
        <p className="text-red-100 text-sm mt-1">Escaleras resistentes al fuego certificadas</p>
      </div>

      <div className="p-6">
        {mensaje && (
          <div className={`mb-4 p-4 rounded-lg ${mensaje.tipo === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Cliente */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input type="text" value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar cliente..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(c => (
                    <button key={c.id} onClick={() => seleccionarCliente(c)} className="w-full px-4 py-2 text-left hover:bg-red-50">
                      {c.nombre} {c.empresa && `(${c.empresa})`}
                    </button>
                  ))}
                </div>
              )}
              {clienteSeleccionado && <p className="mt-1 text-sm text-green-600">✓ {clienteSeleccionado.nombre}</p>}
            </div>

            {/* Certificación RF */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="font-semibold text-red-800 mb-3">🔥 Certificación RF</h3>
              <div className="grid grid-cols-2 gap-2">
                {CERTIFICACIONES.map(c => (
                  <label key={c.id} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border-2 transition-colors ${formData.certificacion === c.id ? 'border-red-500 bg-white' : 'border-transparent bg-white/50'}`}>
                    <input type="radio" name="cert" checked={formData.certificacion === c.id}
                      onChange={() => setFormData({...formData, certificacion: c.id})} className="text-red-600" />
                    <div>
                      <div className="font-bold text-red-700">{c.nombre}</div>
                      <div className="text-xs text-gray-500">{c.descripcion}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Configuración */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Configuración</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Plantas</label>
                  <input type="number" min="1" value={formData.plantas}
                    onChange={(e) => setFormData({...formData, plantas: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Peldaños/planta</label>
                  <input type="number" min="10" value={formData.peldanos_planta}
                    onChange={(e) => setFormData({...formData, peldanos_planta: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                  <select value={formData.ancho} onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="1000">1000 mm</option>
                    <option value="1100">1100 mm</option>
                    <option value="1200">1200 mm</option>
                    <option value="1400">1400 mm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Estructura y peldaños */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🏗️ Estructura y Peldaños</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Estructura</label>
                  <select value={formData.estructura} onChange={(e) => setFormData({...formData, estructura: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    {ESTRUCTURAS_RF.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Peldaños</label>
                  <select value={formData.tipo_peldano} onChange={(e) => setFormData({...formData, tipo_peldano: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    {PELDANOS_RF.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Barandilla */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🛡️ Barandilla</h3>
              <div className="grid grid-cols-2 gap-3">
                <select value={formData.barandilla} onChange={(e) => setFormData({...formData, barandilla: e.target.value})}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                  {BARANDILLAS_RF.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
                <select value={formData.lados_barandilla} onChange={(e) => setFormData({...formData, lados_barandilla: e.target.value})}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                  <option value="1">1 lado</option>
                  <option value="2">2 lados</option>
                </select>
              </div>
            </div>

            {/* Puertas RF */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center gap-2 mb-3">
                <input type="checkbox" checked={formData.incluir_puertas_rf}
                  onChange={(e) => setFormData({...formData, incluir_puertas_rf: e.target.checked})}
                  className="w-4 h-4 text-red-600 rounded" />
                <span className="text-sm font-medium">Incluir puertas RF</span>
              </label>
              {formData.incluir_puertas_rf && (
                <input type="number" min="1" value={formData.num_puertas}
                  onChange={(e) => setFormData({...formData, num_puertas: e.target.value})}
                  placeholder="Número de puertas"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500" />
              )}
            </div>

            {/* Opciones */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.incluir_montaje}
                  onChange={(e) => setFormData({...formData, incluir_montaje: e.target.checked})}
                  className="w-4 h-4 text-red-600 rounded" />
                <span className="text-sm">Incluir montaje especializado</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.acceso_dificil}
                  onChange={(e) => setFormData({...formData, acceso_dificil: e.target.checked})}
                  className="w-4 h-4 text-red-600 rounded" />
                <span className="text-sm">Acceso difícil (+20%)</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={calcular} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg">
                📊 Calcular
              </button>
              <button onClick={() => { setFormData({ plantas: 1, peldanos_planta: 18, ancho: 1000, certificacion: 'ei60', estructura: 'acero_protegido', tipo_peldano: 'hormigon', barandilla: 'metalica', lados_barandilla: 2, incluir_puertas_rf: false, num_puertas: 0, incluir_montaje: true, acceso_dificil: false }); setResultado(null); }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                🗑️
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Resumen</h3>
                
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-red-700">{resultado.desglose.certificacion}</span>
                    <p className="text-sm text-red-600">Certificación resistencia al fuego</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-600">Plantas:</div>
                    <div className="font-medium">{resultado.desglose.plantas}</div>
                    <div className="text-gray-600">Total peldaños:</div>
                    <div className="font-medium">{resultado.total_peldanos}</div>
                    <div className="text-gray-600">Desarrollo:</div>
                    <div className="font-medium">{resultado.desarrollo.toFixed(2)} m</div>
                    <div className="text-gray-600">Estructura:</div>
                    <div className="font-medium">{resultado.desglose.estructura}</div>
                    <div className="text-gray-600">Peldaños:</div>
                    <div className="font-medium">{resultado.desglose.peldano}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span>Estructura:</span><span>{resultado.precios.estructura.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Peldaños:</span><span>{resultado.precios.peldanos.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Descansillos:</span><span>{resultado.precios.descansillos.toFixed(2)} €</span></div>
                  {resultado.precios.barandilla > 0 && <div className="flex justify-between"><span>Barandilla:</span><span>{resultado.precios.barandilla.toFixed(2)} €</span></div>}
                  {resultado.precios.puertas > 0 && <div className="flex justify-between"><span>Puertas RF:</span><span>{resultado.precios.puertas.toFixed(2)} €</span></div>}
                  {resultado.precios.recargo_acceso > 0 && <div className="flex justify-between text-amber-600"><span>Recargo acceso:</span><span>{resultado.precios.recargo_acceso.toFixed(2)} €</span></div>}
                  {resultado.precios.montaje > 0 && <div className="flex justify-between"><span>Montaje:</span><span>{resultado.precios.montaje.toFixed(2)} €</span></div>}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                    <div className="flex justify-between text-gray-600"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                  </div>
                </div>

                <div className="bg-red-600 text-white rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>

                <button onClick={guardarPresupuesto} disabled={guardando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg">
                  {guardando ? '⏳ Guardando...' : '💾 Guardar Presupuesto'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 h-64 flex items-center justify-center">
                <div>
                  <div className="text-4xl mb-3">🔥</div>
                  <p>Introduce los datos y pulsa <strong>Calcular</strong></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadorEscalerasRF;
