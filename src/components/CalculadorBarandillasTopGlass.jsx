// CalculadorBarandillasTopGlass.jsx - Calculador de Barandillas Top Glass
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { searchClientes } from '../services/clientes';

// Perfiles Top Glass
const PERFILES = [
  { id: 'u_aluminio', nombre: 'Perfil U Aluminio', precio_ml: 55, descripcion: 'Económico y ligero' },
  { id: 'u_inox', nombre: 'Perfil U Inox', precio_ml: 85, descripcion: 'Máxima durabilidad' },
  { id: 'f_aluminio', nombre: 'Perfil F Aluminio', precio_ml: 65, descripcion: 'Montaje lateral' },
  { id: 'f_inox', nombre: 'Perfil F Inox', precio_ml: 95, descripcion: 'Lateral en inox' },
  { id: 'mini', nombre: 'Perfil Mini', precio_ml: 45, descripcion: 'Minimalista y discreto' },
];

const TIPOS_VIDRIO = [
  { id: 'laminado_88', nombre: 'Laminado 4+4', espesor: 8, precio_m2: 75 },
  { id: 'laminado_10', nombre: 'Laminado 5+5', espesor: 10, precio_m2: 95 },
  { id: 'laminado_12', nombre: 'Laminado 6+6', espesor: 12, precio_m2: 115 },
];

const ACABADOS_PERFIL = [
  { id: 'natural', nombre: 'Natural / Anodizado', factor: 1.0 },
  { id: 'lacado_blanco', nombre: 'Lacado Blanco', factor: 1.15 },
  { id: 'lacado_negro', nombre: 'Lacado Negro', factor: 1.15 },
  { id: 'lacado_ral', nombre: 'Lacado RAL a elegir', factor: 1.25 },
];

const ACABADOS_VIDRIO = [
  { id: 'incoloro', nombre: 'Incoloro', factor: 1.0 },
  { id: 'extraclaro', nombre: 'Extraclaro', factor: 1.12 },
  { id: 'mate', nombre: 'Ácido / Mate', factor: 1.20 },
  { id: 'serigrafiado', nombre: 'Serigrafiado', factor: 1.30 },
];

const PASAMANOS = [
  { id: 'sin', nombre: 'Sin Pasamanos', precio_ml: 0 },
  { id: 'redondo_42', nombre: 'Redondo Ø42mm', precio_ml: 38 },
  { id: 'redondo_50', nombre: 'Redondo Ø50mm', precio_ml: 45 },
  { id: 'rectangular', nombre: 'Rectangular 40x20', precio_ml: 42 },
  { id: 'madera', nombre: 'Madera Maciza', precio_ml: 65 },
];

const CalculadorBarandillasTopGlass = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    metros_lineales: '',
    altura: 1000,
    perfil: 'u_aluminio',
    acabado_perfil: 'natural',
    tipo_vidrio: 'laminado_10',
    acabado_vidrio: 'incoloro',
    pasamanos: 'sin',
    incluir_montaje: true,
    esquinas: 0,
    postes_intermedios: 0,
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
    const { metros_lineales, altura, perfil, acabado_perfil, tipo_vidrio, acabado_vidrio, pasamanos, incluir_montaje, esquinas, postes_intermedios } = formData;
    
    if (!metros_lineales || parseFloat(metros_lineales) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce los metros lineales' });
      return;
    }

    const ml = parseFloat(metros_lineales);
    const alturaM = parseInt(altura) / 1000;

    const perfilData = PERFILES.find(p => p.id === perfil);
    const acabadoPerfilData = ACABADOS_PERFIL.find(a => a.id === acabado_perfil);
    const vidrioData = TIPOS_VIDRIO.find(v => v.id === tipo_vidrio);
    const acabadoVidrioData = ACABADOS_VIDRIO.find(a => a.id === acabado_vidrio);
    const pasamanosData = PASAMANOS.find(p => p.id === pasamanos);

    // Calcular m² de vidrio
    const m2_vidrio = ml * alturaM;

    // Precio perfil
    const precio_perfil = ml * perfilData.precio_ml * acabadoPerfilData.factor;

    // Precio vidrio
    const precio_vidrio = m2_vidrio * vidrioData.precio_m2 * acabadoVidrioData.factor;

    // Precio pasamanos
    const precio_pasamanos = ml * pasamanosData.precio_ml;

    // Esquinas (90€ cada una)
    const precio_esquinas = parseInt(esquinas) * 90;

    // Postes intermedios (75€ cada uno)
    const precio_postes = parseInt(postes_intermedios) * 75;

    // Montaje
    let precio_montaje = 0;
    if (incluir_montaje) {
      precio_montaje = ml * 55;
    }

    const subtotal = precio_perfil + precio_vidrio + precio_pasamanos + precio_esquinas + precio_postes + precio_montaje;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      metros_lineales: ml,
      m2_vidrio,
      desglose: {
        perfil: perfilData.nombre,
        acabado_perfil: acabadoPerfilData.nombre,
        vidrio: vidrioData.nombre,
        acabado_vidrio: acabadoVidrioData.nombre,
        pasamanos: pasamanosData.nombre,
        altura: `${altura} mm`,
        esquinas: parseInt(esquinas),
        postes: parseInt(postes_intermedios)
      },
      precios: {
        perfil: precio_perfil,
        vidrio: precio_vidrio,
        pasamanos: precio_pasamanos,
        esquinas: precio_esquinas,
        postes: precio_postes,
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
        categoria: CATEGORIAS.BARANDILLAS_TOP_GLASS,
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
      perfil: 'u_aluminio',
      acabado_perfil: 'natural',
      tipo_vidrio: 'laminado_10',
      acabado_vidrio: 'incoloro',
      pasamanos: 'sin',
      incluir_montaje: true,
      esquinas: 0,
      postes_intermedios: 0,
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          Calculador Barandillas Top Glass
        </h2>
        <p className="text-purple-100 text-sm mt-1">Barandillas con perfil superior de sujeción</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full px-4 py-2 text-left hover:bg-purple-50"
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Metros Lineales</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.metros_lineales}
                    onChange={(e) => setFormData({...formData, metros_lineales: e.target.value})}
                    placeholder="5.5"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Altura (mm)</label>
                  <select
                    value={formData.altura}
                    onChange={(e) => setFormData({...formData, altura: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="900">900 mm</option>
                    <option value="1000">1000 mm</option>
                    <option value="1100">1100 mm</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Perfil */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📏 Perfil Superior</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo de Perfil</label>
                  <select
                    value={formData.perfil}
                    onChange={(e) => setFormData({...formData, perfil: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {PERFILES.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} ({p.precio_ml}€/ml)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado Perfil</label>
                  <select
                    value={formData.acabado_perfil}
                    onChange={(e) => setFormData({...formData, acabado_perfil: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {ACABADOS_PERFIL.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Vidrio */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🪟 Vidrio</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo de Vidrio</label>
                  <select
                    value={formData.tipo_vidrio}
                    onChange={(e) => setFormData({...formData, tipo_vidrio: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {TIPOS_VIDRIO.map(v => (
                      <option key={v.id} value={v.id}>{v.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Acabado Vidrio</label>
                  <select
                    value={formData.acabado_vidrio}
                    onChange={(e) => setFormData({...formData, acabado_vidrio: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {ACABADOS_VIDRIO.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Pasamanos y extras */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔶 Pasamanos y Extras</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Pasamanos</label>
                  <select
                    value={formData.pasamanos}
                    onChange={(e) => setFormData({...formData, pasamanos: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {PASAMANOS.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.precio_ml > 0 ? `(${p.precio_ml}€/ml)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Esquinas (90€/ud)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.esquinas}
                      onChange={(e) => setFormData({...formData, esquinas: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Postes (75€/ud)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.postes_intermedios}
                      onChange={(e) => setFormData({...formData, postes_intermedios: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Montaje */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.incluir_montaje}
                  onChange={(e) => setFormData({...formData, incluir_montaje: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium">Incluir montaje (55€/ml)</span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={calcular}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
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
                    <div className="text-gray-600">Perfil:</div>
                    <div className="font-medium">{resultado.desglose.perfil}</div>
                    <div className="text-gray-600">Acabado perfil:</div>
                    <div className="font-medium">{resultado.desglose.acabado_perfil}</div>
                    <div className="text-gray-600">Vidrio:</div>
                    <div className="font-medium">{resultado.desglose.vidrio}</div>
                    <div className="text-gray-600">Acabado vidrio:</div>
                    <div className="font-medium">{resultado.desglose.acabado_vidrio}</div>
                    {resultado.desglose.esquinas > 0 && (
                      <>
                        <div className="text-gray-600">Esquinas:</div>
                        <div className="font-medium">{resultado.desglose.esquinas} uds</div>
                      </>
                    )}
                    {resultado.desglose.postes > 0 && (
                      <>
                        <div className="text-gray-600">Postes:</div>
                        <div className="font-medium">{resultado.desglose.postes} uds</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Perfil:</span>
                    <span>{resultado.precios.perfil.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vidrio:</span>
                    <span>{resultado.precios.vidrio.toFixed(2)} €</span>
                  </div>
                  {resultado.precios.pasamanos > 0 && (
                    <div className="flex justify-between">
                      <span>Pasamanos:</span>
                      <span>{resultado.precios.pasamanos.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.esquinas > 0 && (
                    <div className="flex justify-between">
                      <span>Esquinas:</span>
                      <span>{resultado.precios.esquinas.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.postes > 0 && (
                    <div className="flex justify-between">
                      <span>Postes intermedios:</span>
                      <span>{resultado.precios.postes.toFixed(2)} €</span>
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

                <div className="bg-purple-600 text-white rounded-lg p-4 mb-4">
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
                  <div className="text-4xl mb-3">🔒</div>
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

export default CalculadorBarandillasTopGlass;
