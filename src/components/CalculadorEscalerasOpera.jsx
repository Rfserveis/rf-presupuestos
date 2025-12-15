// CalculadorEscalerasOpera.jsx - Calculador de Escaleras D'Opera
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { searchClientes } from '../services/clientes';

// Materiales estructura
const MATERIALES_ESTRUCTURA = [
  { id: 'acero_pintado', nombre: 'Acero Pintado', precio_base: 450, descripcion: 'Acabado lacado al horno' },
  { id: 'acero_inox', nombre: 'Acero Inoxidable', precio_base: 750, descripcion: 'AISI 304 satinado' },
  { id: 'madera_roble', nombre: 'Madera Roble', precio_base: 650, descripcion: 'Madera maciza de roble' },
  { id: 'combinado', nombre: 'Acero + Madera', precio_base: 850, descripcion: 'Zanca acero, peldaños madera' },
];

// Tipos de peldaño
const PELDANOS = [
  { id: 'madera_roble', nombre: 'Madera Roble', precio_ud: 120 },
  { id: 'madera_haya', nombre: 'Madera Haya', precio_ud: 95 },
  { id: 'cristal', nombre: 'Cristal Laminado', precio_ud: 185 },
  { id: 'acero', nombre: 'Acero Antideslizante', precio_ud: 145 },
  { id: 'composite', nombre: 'Composite', precio_ud: 85 },
];

// Barandillas
const BARANDILLAS = [
  { id: 'sin', nombre: 'Sin Barandilla', precio_ml: 0 },
  { id: 'vidrio_all', nombre: 'Vidrio All Glass', precio_ml: 280 },
  { id: 'vidrio_top', nombre: 'Vidrio Top Glass', precio_ml: 220 },
  { id: 'varillas', nombre: 'Varillas Inox', precio_ml: 165 },
  { id: 'cables', nombre: 'Cables Tensados', precio_ml: 145 },
];

// Pasamanos
const PASAMANOS = [
  { id: 'sin', nombre: 'Sin Pasamanos', precio_ml: 0 },
  { id: 'inox_42', nombre: 'Inox Ø42mm', precio_ml: 45 },
  { id: 'madera_roble', nombre: 'Madera Roble', precio_ml: 75 },
  { id: 'madera_haya', nombre: 'Madera Haya', precio_ml: 65 },
];

const CalculadorEscalerasOpera = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    plantas: 1,
    peldanos_planta: 14,
    ancho: 900,
    material_estructura: 'acero_pintado',
    tipo_peldano: 'madera_roble',
    barandilla: 'vidrio_top',
    pasamanos: 'madera_roble',
    lados_barandilla: 2,
    incluir_descansillo: false,
    incluir_montaje: true,
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
        if (success) {
          setClientesResultados(data);
          setMostrarBusqueda(true);
        }
      } else {
        setClientesResultados([]);
        setMostrarBusqueda(false);
      }
    };
    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  const calcular = () => {
    const { plantas, peldanos_planta, ancho, material_estructura, tipo_peldano, barandilla, pasamanos, lados_barandilla, incluir_descansillo, incluir_montaje } = formData;
    
    const numPlantas = parseInt(plantas);
    const numPeldanos = parseInt(peldanos_planta);
    const anchoM = parseInt(ancho) / 1000;
    
    if (numPlantas <= 0 || numPeldanos <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce los datos de la escalera' });
      return;
    }

    const totalPeldanos = numPlantas * numPeldanos;
    
    // Calcular longitud aproximada de la escalera (desarrollo)
    // Huella media de 28cm por peldaño
    const desarrolloM = (totalPeldanos * 0.28) + (numPlantas * 0.9); // +0.9m por descansillo/arranque

    const estructuraData = MATERIALES_ESTRUCTURA.find(m => m.id === material_estructura);
    const peldanoData = PELDANOS.find(p => p.id === tipo_peldano);
    const barandillaData = BARANDILLAS.find(b => b.id === barandilla);
    const pasamanosData = PASAMANOS.find(p => p.id === pasamanos);

    // Precio estructura (por metro de desarrollo)
    let precio_estructura = desarrolloM * estructuraData.precio_base;
    // Ajuste por ancho (base 900mm, +15% por cada 100mm adicionales)
    if (parseInt(ancho) > 900) {
      precio_estructura *= 1 + ((parseInt(ancho) - 900) / 100) * 0.15;
    }

    // Precio peldaños
    const precio_peldanos = totalPeldanos * peldanoData.precio_ud;

    // Precio barandilla (metros lineales = desarrollo * lados)
    const ml_barandilla = desarrolloM * parseInt(lados_barandilla);
    const precio_barandilla = ml_barandilla * barandillaData.precio_ml;

    // Precio pasamanos
    const ml_pasamanos = desarrolloM * parseInt(lados_barandilla);
    const precio_pasamanos = ml_pasamanos * pasamanosData.precio_ml;

    // Descansillos
    let precio_descansillos = 0;
    if (incluir_descansillo && numPlantas > 1) {
      precio_descansillos = (numPlantas - 1) * 450; // 450€ por descansillo
    }

    // Montaje
    let precio_montaje = 0;
    if (incluir_montaje) {
      precio_montaje = desarrolloM * 180; // 180€/ml de montaje
    }

    const subtotal = precio_estructura + precio_peldanos + precio_barandilla + precio_pasamanos + precio_descansillos + precio_montaje;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      total_peldanos: totalPeldanos,
      desarrollo: desarrolloM,
      ml_barandilla,
      desglose: {
        plantas: numPlantas,
        peldanos_planta: numPeldanos,
        ancho: `${ancho} mm`,
        estructura: estructuraData.nombre,
        peldano: peldanoData.nombre,
        barandilla: barandillaData.nombre,
        pasamanos: pasamanosData.nombre,
        lados: parseInt(lados_barandilla)
      },
      precios: {
        estructura: precio_estructura,
        peldanos: precio_peldanos,
        barandilla: precio_barandilla,
        pasamanos: precio_pasamanos,
        descansillos: precio_descansillos,
        montaje: precio_montaje
      },
      subtotal,
      iva,
      total
    });

    setMensaje(null);
  };

  const guardarPresupuesto = async () => {
    if (!resultado) {
      setMensaje({ tipo: 'error', texto: 'Primero calcula el presupuesto' });
      return;
    }

    if (!clienteId && !clienteSeleccionado) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un cliente' });
      return;
    }

    setGuardando(true);

    try {
      const presupuesto = {
        categoria: CATEGORIAS.ESCALERAS_DOPERA,
        cliente_id: clienteId || clienteSeleccionado?.id,
        datos: { formData, resultado },
        subtotal: resultado.subtotal,
        iva: 21,
        total: resultado.total,
        created_by: user?.id
      };

      const { success, data, error } = await createPresupuesto(presupuesto);

      if (success) {
        setMensaje({ tipo: 'success', texto: `Presupuesto ${data.numero} guardado` });
        if (onGuardar) onGuardar(data);
      } else {
        setMensaje({ tipo: 'error', texto: error || 'Error al guardar' });
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: 'Error al guardar el presupuesto' });
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

  const limpiar = () => {
    setFormData({
      plantas: 1,
      peldanos_planta: 14,
      ancho: 900,
      material_estructura: 'acero_pintado',
      tipo_peldano: 'madera_roble',
      barandilla: 'vidrio_top',
      pasamanos: 'madera_roble',
      lados_barandilla: 2,
      incluir_descansillo: false,
      incluir_montaje: true,
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🪜</span>
          Calculador Escaleras D'Opera
        </h2>
        <p className="text-rose-100 text-sm mt-1">Escaleras de diseño con zanca central</p>
      </div>

      <div className="p-6">
        {mensaje && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500"
              />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full px-4 py-2 text-left hover:bg-rose-50"
                    >
                      {cliente.nombre} {cliente.empresa && `(${cliente.empresa})`}
                    </button>
                  ))}
                </div>
              )}
              {clienteSeleccionado && (
                <p className="mt-1 text-sm text-green-600">✓ {clienteSeleccionado.nombre}</p>
              )}
            </div>

            {/* Configuración */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Configuración</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Plantas</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.plantas}
                    onChange={(e) => setFormData({...formData, plantas: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Peldaños/planta</label>
                  <input
                    type="number"
                    min="8"
                    max="20"
                    value={formData.peldanos_planta}
                    onChange={(e) => setFormData({...formData, peldanos_planta: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                  <select
                    value={formData.ancho}
                    onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="800">800 mm</option>
                    <option value="900">900 mm</option>
                    <option value="1000">1000 mm</option>
                    <option value="1100">1100 mm</option>
                    <option value="1200">1200 mm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Estructura */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🏗️ Estructura</h3>
              <select
                value={formData.material_estructura}
                onChange={(e) => setFormData({...formData, material_estructura: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                {MATERIALES_ESTRUCTURA.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} - {m.descripcion}</option>
                ))}
              </select>
            </div>

            {/* Peldaños */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🪜 Peldaños</h3>
              <select
                value={formData.tipo_peldano}
                onChange={(e) => setFormData({...formData, tipo_peldano: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                {PELDANOS.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.precio_ud}€/ud)</option>
                ))}
              </select>
            </div>

            {/* Barandilla */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🛡️ Barandilla</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                  <select
                    value={formData.barandilla}
                    onChange={(e) => setFormData({...formData, barandilla: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    {BARANDILLAS.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.nombre} {b.precio_ml > 0 ? `(${b.precio_ml}€/ml)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Lados</label>
                  <select
                    value={formData.lados_barandilla}
                    onChange={(e) => setFormData({...formData, lados_barandilla: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="1">1 lado</option>
                    <option value="2">2 lados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Pasamanos */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔶 Pasamanos</h3>
              <select
                value={formData.pasamanos}
                onChange={(e) => setFormData({...formData, pasamanos: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500"
              >
                {PASAMANOS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.precio_ml > 0 ? `(${p.precio_ml}€/ml)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Opciones */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.incluir_descansillo}
                  onChange={(e) => setFormData({...formData, incluir_descansillo: e.target.checked})}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <span className="text-sm">Descansillos intermedios (450€/ud)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.incluir_montaje}
                  onChange={(e) => setFormData({...formData, incluir_montaje: e.target.checked})}
                  className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                />
                <span className="text-sm">Incluir montaje (180€/ml)</span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={calcular}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                📊 Calcular
              </button>
              <button
                onClick={limpiar}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          {/* Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Resumen</h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-600">Plantas:</div>
                    <div className="font-medium">{resultado.desglose.plantas}</div>
                    <div className="text-gray-600">Total peldaños:</div>
                    <div className="font-medium">{resultado.total_peldanos} uds</div>
                    <div className="text-gray-600">Desarrollo:</div>
                    <div className="font-medium">{resultado.desarrollo.toFixed(2)} m</div>
                    <div className="text-gray-600">Ancho:</div>
                    <div className="font-medium">{resultado.desglose.ancho}</div>
                    <div className="text-gray-600">Estructura:</div>
                    <div className="font-medium">{resultado.desglose.estructura}</div>
                    <div className="text-gray-600">Peldaños:</div>
                    <div className="font-medium">{resultado.desglose.peldano}</div>
                    <div className="text-gray-600">Barandilla:</div>
                    <div className="font-medium">{resultado.desglose.barandilla}</div>
                    <div className="text-gray-600">ml barandilla:</div>
                    <div className="font-medium">{resultado.ml_barandilla.toFixed(2)} ml</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Estructura:</span>
                    <span>{resultado.precios.estructura.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peldaños ({resultado.total_peldanos} uds):</span>
                    <span>{resultado.precios.peldanos.toFixed(2)} €</span>
                  </div>
                  {resultado.precios.barandilla > 0 && (
                    <div className="flex justify-between">
                      <span>Barandilla:</span>
                      <span>{resultado.precios.barandilla.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.pasamanos > 0 && (
                    <div className="flex justify-between">
                      <span>Pasamanos:</span>
                      <span>{resultado.precios.pasamanos.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.descansillos > 0 && (
                    <div className="flex justify-between">
                      <span>Descansillos:</span>
                      <span>{resultado.precios.descansillos.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.montaje > 0 && (
                    <div className="flex justify-between">
                      <span>Montaje:</span>
                      <span>{resultado.precios.montaje.toFixed(2)} €</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>{resultado.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IVA (21%):</span>
                      <span>{resultado.iva.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                <div className="bg-rose-600 text-white rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>

                <button
                  onClick={guardarPresupuesto}
                  disabled={guardando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {guardando ? '⏳ Guardando...' : '💾 Guardar Presupuesto'}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 h-64 flex items-center justify-center">
                <div>
                  <div className="text-4xl mb-3">🪜</div>
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

export default CalculadorEscalerasOpera;
