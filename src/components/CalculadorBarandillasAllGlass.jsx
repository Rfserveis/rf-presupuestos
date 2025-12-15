// CalculadorBarandillasAllGlass.jsx - Calculador de Barandillas All Glass
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { searchClientes } from '../services/clientes';

// Datos de configuración - En producción vendrían de BD
const TIPOS_ANCLAJE = [
  { id: 'suelo', nombre: 'Anclaje a Suelo', precio_ml: 85, descripcion: 'Fijación directa al pavimento' },
  { id: 'lateral', nombre: 'Anclaje Lateral', precio_ml: 95, descripcion: 'Fijación a pared o forjado lateral' },
  { id: 'frances', nombre: 'Sistema Francés', precio_ml: 120, descripcion: 'Perfilería oculta en pavimento' },
  { id: 'punto', nombre: 'Fijaciones Puntuales', precio_ml: 145, descripcion: 'Botones de acero inoxidable' },
];

const TIPOS_VIDRIO = [
  { id: 'laminado_10', nombre: 'Laminado 5+5', espesor: 10, precio_m2: 95 },
  { id: 'laminado_12', nombre: 'Laminado 6+6', espesor: 12, precio_m2: 115 },
  { id: 'laminado_16', nombre: 'Laminado 8+8', espesor: 16, precio_m2: 145 },
  { id: 'laminado_20', nombre: 'Laminado 10+10', espesor: 20, precio_m2: 185 },
];

const ACABADOS_VIDRIO = [
  { id: 'incoloro', nombre: 'Incoloro', factor: 1.0 },
  { id: 'extraclaro', nombre: 'Extraclaro', factor: 1.15 },
  { id: 'mate', nombre: 'Ácido / Mate', factor: 1.25 },
  { id: 'serigrafiado', nombre: 'Serigrafiado', factor: 1.35 },
];

const PASAMANOS = [
  { id: 'sin', nombre: 'Sin Pasamanos', precio_ml: 0 },
  { id: 'inox_42', nombre: 'Inox Ø42mm', precio_ml: 45 },
  { id: 'inox_50', nombre: 'Inox Ø50mm', precio_ml: 55 },
  { id: 'madera_roble', nombre: 'Madera Roble', precio_ml: 75 },
  { id: 'madera_iroko', nombre: 'Madera Iroko', precio_ml: 85 },
];

const CalculadorBarandillasAllGlass = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    metros_lineales: '',
    altura: 1000,
    tipo_anclaje: 'suelo',
    tipo_vidrio: 'laminado_12',
    acabado_vidrio: 'incoloro',
    pasamanos: 'sin',
    incluir_montaje: true,
    ubicacion: 'interior',
    tramos: 1,
  });

  const [clienteId, setClienteId] = useState(clientePreseleccionado || null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesResultados, setClientesResultados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  const [resultado, setResultado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Buscar clientes
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
    const { metros_lineales, altura, tipo_anclaje, tipo_vidrio, acabado_vidrio, pasamanos, incluir_montaje, ubicacion, tramos } = formData;
    
    if (!metros_lineales || parseFloat(metros_lineales) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce los metros lineales' });
      return;
    }

    const ml = parseFloat(metros_lineales);
    const alturaM = parseInt(altura) / 1000;

    // Datos seleccionados
    const anclaje = TIPOS_ANCLAJE.find(a => a.id === tipo_anclaje);
    const vidrio = TIPOS_VIDRIO.find(v => v.id === tipo_vidrio);
    const acabado = ACABADOS_VIDRIO.find(a => a.id === acabado_vidrio);
    const pasamanosData = PASAMANOS.find(p => p.id === pasamanos);

    // Calcular m² de vidrio
    const m2_vidrio = ml * alturaM;

    // Precio vidrio
    let precio_vidrio = m2_vidrio * vidrio.precio_m2 * acabado.factor;

    // Precio anclaje
    const precio_anclaje = ml * anclaje.precio_ml;

    // Precio pasamanos
    const precio_pasamanos = ml * pasamanosData.precio_ml;

    // Recargo por exterior
    let recargo_exterior = 0;
    if (ubicacion === 'exterior') {
      recargo_exterior = (precio_vidrio + precio_anclaje) * 0.15;
    }

    // Recargo por tramos adicionales
    const recargo_tramos = (parseInt(tramos) - 1) * 50; // 50€ por cada tramo adicional

    // Montaje
    let precio_montaje = 0;
    if (incluir_montaje) {
      precio_montaje = ml * 65; // 65€/ml de montaje
    }

    const subtotal = precio_vidrio + precio_anclaje + precio_pasamanos + recargo_exterior + recargo_tramos + precio_montaje;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      metros_lineales: ml,
      m2_vidrio,
      desglose: {
        anclaje: anclaje.nombre,
        vidrio: vidrio.nombre,
        acabado: acabado.nombre,
        pasamanos: pasamanosData.nombre,
        altura: `${altura} mm`,
        ubicacion: ubicacion === 'exterior' ? 'Exterior' : 'Interior',
        tramos: parseInt(tramos)
      },
      precios: {
        vidrio: precio_vidrio,
        anclaje: precio_anclaje,
        pasamanos: precio_pasamanos,
        recargo_exterior,
        recargo_tramos,
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
        categoria: CATEGORIAS.BARANDILLAS_ALL_GLASS,
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
      metros_lineales: '',
      altura: 1000,
      tipo_anclaje: 'suelo',
      tipo_vidrio: 'laminado_12',
      acabado_vidrio: 'incoloro',
      pasamanos: 'sin',
      incluir_montaje: true,
      ubicacion: 'interior',
      tramos: 1,
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          Calculador Barandillas All Glass
        </h2>
        <p className="text-emerald-100 text-sm mt-1">Barandillas de vidrio sin perfilería superior</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full px-4 py-2 text-left hover:bg-emerald-50"
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

            {/* Medidas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Medidas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Metros Lineales</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.metros_lineales}
                    onChange={(e) => setFormData({...formData, metros_lineales: e.target.value})}
                    placeholder="5.5"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Altura (mm)</label>
                  <select
                    value={formData.altura}
                    onChange={(e) => setFormData({...formData, altura: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="900">900 mm</option>
                    <option value="1000">1000 mm</option>
                    <option value="1100">1100 mm</option>
                    <option value="1200">1200 mm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Nº Tramos</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.tramos}
                    onChange={(e) => setFormData({...formData, tramos: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Sistema de Anclaje */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔩 Sistema de Anclaje</h3>
              <div className="space-y-2">
                {TIPOS_ANCLAJE.map(anclaje => (
                  <label key={anclaje.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="anclaje"
                      checked={formData.tipo_anclaje === anclaje.id}
                      onChange={() => setFormData({...formData, tipo_anclaje: anclaje.id})}
                      className="mt-1 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{anclaje.nombre}</div>
                      <div className="text-xs text-gray-500">{anclaje.descripcion}</div>
                    </div>
                    <div className="text-sm font-medium text-emerald-600">{anclaje.precio_ml}€/ml</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Vidrio */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🪟 Vidrio</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                  <select
                    value={formData.tipo_vidrio}
                    onChange={(e) => setFormData({...formData, tipo_vidrio: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {TIPOS_VIDRIO.map(v => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado</label>
                  <select
                    value={formData.acabado_vidrio}
                    onChange={(e) => setFormData({...formData, acabado_vidrio: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    {ACABADOS_VIDRIO.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
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
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {PASAMANOS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.precio_ml > 0 ? `(${p.precio_ml}€/ml)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Opciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">⚙️ Opciones</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.incluir_montaje}
                    onChange={(e) => setFormData({...formData, incluir_montaje: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm">Incluir montaje (65€/ml)</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ubicacion"
                      checked={formData.ubicacion === 'interior'}
                      onChange={() => setFormData({...formData, ubicacion: 'interior'})}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm">Interior</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="ubicacion"
                      checked={formData.ubicacion === 'exterior'}
                      onChange={() => setFormData({...formData, ubicacion: 'exterior'})}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm">Exterior (+15%)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={calcular}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
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
                    <div className="text-gray-600">Metros lineales:</div>
                    <div className="font-medium">{resultado.metros_lineales} ml</div>
                    <div className="text-gray-600">m² de vidrio:</div>
                    <div className="font-medium">{resultado.m2_vidrio.toFixed(2)} m²</div>
                    <div className="text-gray-600">Sistema:</div>
                    <div className="font-medium">{resultado.desglose.anclaje}</div>
                    <div className="text-gray-600">Vidrio:</div>
                    <div className="font-medium">{resultado.desglose.vidrio}</div>
                    <div className="text-gray-600">Acabado:</div>
                    <div className="font-medium">{resultado.desglose.acabado}</div>
                    <div className="text-gray-600">Pasamanos:</div>
                    <div className="font-medium">{resultado.desglose.pasamanos}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Vidrio:</span>
                    <span>{resultado.precios.vidrio.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sistema anclaje:</span>
                    <span>{resultado.precios.anclaje.toFixed(2)} €</span>
                  </div>
                  {resultado.precios.pasamanos > 0 && (
                    <div className="flex justify-between">
                      <span>Pasamanos:</span>
                      <span>{resultado.precios.pasamanos.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.recargo_exterior > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Recargo exterior:</span>
                      <span>{resultado.precios.recargo_exterior.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.recargo_tramos > 0 && (
                    <div className="flex justify-between">
                      <span>Tramos adicionales:</span>
                      <span>{resultado.precios.recargo_tramos.toFixed(2)} €</span>
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

                <div className="bg-emerald-600 text-white rounded-lg p-4 mb-4">
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
                  <div className="text-4xl mb-3">🛡️</div>
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

export default CalculadorBarandillasAllGlass;
