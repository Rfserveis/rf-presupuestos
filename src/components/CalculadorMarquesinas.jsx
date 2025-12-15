// CalculadorMarquesinas.jsx - Calculador de Marquesinas
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { searchClientes } from '../services/clientes';

// Tipos de estructura
const ESTRUCTURAS = [
  { id: 'acero_pintado', nombre: 'Acero Pintado', precio_m2: 180, descripcion: 'Económico y versátil' },
  { id: 'acero_galvanizado', nombre: 'Acero Galvanizado', precio_m2: 220, descripcion: 'Mayor durabilidad' },
  { id: 'acero_inox', nombre: 'Acero Inoxidable', precio_m2: 350, descripcion: 'Premium sin mantenimiento' },
  { id: 'aluminio', nombre: 'Aluminio', precio_m2: 280, descripcion: 'Ligero y resistente' },
];

// Tipos de cubierta
const CUBIERTAS = [
  { id: 'vidrio_laminado', nombre: 'Vidrio Laminado', precio_m2: 145, descripcion: 'Transparente y seguro' },
  { id: 'vidrio_camara', nombre: 'Vidrio Cámara', precio_m2: 195, descripcion: 'Mejor aislamiento' },
  { id: 'policarbonato_10', nombre: 'Policarbonato 10mm', precio_m2: 65, descripcion: 'Económico y ligero' },
  { id: 'policarbonato_16', nombre: 'Policarbonato 16mm', precio_m2: 85, descripcion: 'Mayor resistencia' },
  { id: 'composite', nombre: 'Panel Composite', precio_m2: 120, descripcion: 'Opaco y resistente' },
];

// Acabados de vidrio
const ACABADOS_VIDRIO = [
  { id: 'incoloro', nombre: 'Incoloro', factor: 1.0 },
  { id: 'reflectante', nombre: 'Reflectante Solar', factor: 1.25 },
  { id: 'mate', nombre: 'Ácido / Mate', factor: 1.15 },
  { id: 'serigrafiado', nombre: 'Serigrafiado', factor: 1.30 },
];

// Canalones
const CANALONES = [
  { id: 'sin', nombre: 'Sin Canalón', precio_ml: 0 },
  { id: 'oculto', nombre: 'Canalón Oculto', precio_ml: 85 },
  { id: 'visto', nombre: 'Canalón Visto', precio_ml: 55 },
];

const CalculadorMarquesinas = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    ancho: '',
    largo: '',
    estructura: 'acero_pintado',
    cubierta: 'vidrio_laminado',
    acabado_vidrio: 'incoloro',
    canalon: 'oculto',
    pilares: 2,
    incluir_montaje: true,
    altura_libre: 2500,
    pendiente: 5,
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
    const { ancho, largo, estructura, cubierta, acabado_vidrio, canalon, pilares, incluir_montaje, altura_libre, pendiente } = formData;
    
    if (!ancho || !largo || parseFloat(ancho) <= 0 || parseFloat(largo) <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce las dimensiones de la marquesina' });
      return;
    }

    const anchoM = parseFloat(ancho) / 1000;
    const largoM = parseFloat(largo) / 1000;
    const m2 = anchoM * largoM;
    const perimetro = 2 * (anchoM + largoM);

    const estructuraData = ESTRUCTURAS.find(e => e.id === estructura);
    const cubiertaData = CUBIERTAS.find(c => c.id === cubierta);
    const acabadoData = ACABADOS_VIDRIO.find(a => a.id === acabado_vidrio);
    const canalonData = CANALONES.find(c => c.id === canalon);

    // Precio estructura
    const precio_estructura = m2 * estructuraData.precio_m2;

    // Precio cubierta
    let precio_cubierta = m2 * cubiertaData.precio_m2;
    if (cubierta.includes('vidrio')) {
      precio_cubierta *= acabadoData.factor;
    }

    // Precio pilares (150€ cada pilar adicional después del segundo)
    const precio_pilares = Math.max(0, (parseInt(pilares) - 2)) * 150;

    // Precio canalón
    const precio_canalon = largoM * canalonData.precio_ml;

    // Recargo por altura especial (más de 3m)
    let recargo_altura = 0;
    if (parseInt(altura_libre) > 3000) {
      recargo_altura = precio_estructura * 0.15;
    }

    // Recargo por pendiente especial (más del 10%)
    let recargo_pendiente = 0;
    if (parseInt(pendiente) > 10) {
      recargo_pendiente = precio_cubierta * 0.10;
    }

    // Montaje
    let precio_montaje = 0;
    if (incluir_montaje) {
      precio_montaje = m2 * 95;
    }

    const subtotal = precio_estructura + precio_cubierta + precio_pilares + precio_canalon + recargo_altura + recargo_pendiente + precio_montaje;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      dimensiones: { ancho: anchoM, largo: largoM },
      m2,
      perimetro,
      desglose: {
        estructura: estructuraData.nombre,
        cubierta: cubiertaData.nombre,
        acabado: acabadoData.nombre,
        canalon: canalonData.nombre,
        pilares: parseInt(pilares),
        altura: `${altura_libre} mm`,
        pendiente: `${pendiente}%`
      },
      precios: {
        estructura: precio_estructura,
        cubierta: precio_cubierta,
        pilares: precio_pilares,
        canalon: precio_canalon,
        recargo_altura,
        recargo_pendiente,
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
        categoria: CATEGORIAS.MARQUESINAS,
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
      ancho: '',
      largo: '',
      estructura: 'acero_pintado',
      cubierta: 'vidrio_laminado',
      acabado_vidrio: 'incoloro',
      canalon: 'oculto',
      pilares: 2,
      incluir_montaje: true,
      altura_libre: 2500,
      pendiente: 5,
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">☂️</span>
          Calculador de Marquesinas
        </h2>
        <p className="text-amber-100 text-sm mt-1">Cubiertas y techos de cristal</p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full px-4 py-2 text-left hover:bg-amber-50"
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

            {/* Dimensiones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Dimensiones</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                  <input
                    type="number"
                    value={formData.ancho}
                    onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    placeholder="2000"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Largo (mm)</label>
                  <input
                    type="number"
                    value={formData.largo}
                    onChange={(e) => setFormData({...formData, largo: e.target.value})}
                    placeholder="3000"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Altura libre (mm)</label>
                  <input
                    type="number"
                    value={formData.altura_libre}
                    onChange={(e) => setFormData({...formData, altura_libre: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Pendiente (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.pendiente}
                    onChange={(e) => setFormData({...formData, pendiente: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Estructura */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🏗️ Estructura</h3>
              <div className="space-y-2">
                {ESTRUCTURAS.map(est => (
                  <label key={est.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
                    <input
                      type="radio"
                      name="estructura"
                      checked={formData.estructura === est.id}
                      onChange={() => setFormData({...formData, estructura: est.id})}
                      className="mt-1 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{est.nombre}</div>
                      <div className="text-xs text-gray-500">{est.descripcion}</div>
                    </div>
                    <div className="text-sm font-medium text-amber-600">{est.precio_m2}€/m²</div>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Número de pilares</label>
                <input
                  type="number"
                  min="2"
                  value={formData.pilares}
                  onChange={(e) => setFormData({...formData, pilares: e.target.value})}
                  className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-xs text-gray-500 ml-2">(2 incluidos, +150€ cada adicional)</span>
              </div>
            </div>

            {/* Cubierta */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🪟 Cubierta</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo de Cubierta</label>
                  <select
                    value={formData.cubierta}
                    onChange={(e) => setFormData({...formData, cubierta: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {CUBIERTAS.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.precio_m2}€/m²)</option>
                    ))}
                  </select>
                </div>
                {formData.cubierta.includes('vidrio') && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Acabado Vidrio</label>
                    <select
                      value={formData.acabado_vidrio}
                      onChange={(e) => setFormData({...formData, acabado_vidrio: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      {ACABADOS_VIDRIO.map(a => (
                        <option key={a.id} value={a.id}>{a.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Sistema de Drenaje</label>
                <select
                  value={formData.canalon}
                  onChange={(e) => setFormData({...formData, canalon: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  {CANALONES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.precio_ml > 0 ? `(${c.precio_ml}€/ml)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Montaje */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.incluir_montaje}
                  onChange={(e) => setFormData({...formData, incluir_montaje: e.target.checked})}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium">Incluir montaje (95€/m²)</span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={calcular}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
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
                    <div className="text-gray-600">Dimensiones:</div>
                    <div className="font-medium">{resultado.dimensiones.ancho.toFixed(2)} x {resultado.dimensiones.largo.toFixed(2)} m</div>
                    <div className="text-gray-600">Superficie:</div>
                    <div className="font-medium">{resultado.m2.toFixed(2)} m²</div>
                    <div className="text-gray-600">Estructura:</div>
                    <div className="font-medium">{resultado.desglose.estructura}</div>
                    <div className="text-gray-600">Cubierta:</div>
                    <div className="font-medium">{resultado.desglose.cubierta}</div>
                    <div className="text-gray-600">Acabado:</div>
                    <div className="font-medium">{resultado.desglose.acabado}</div>
                    <div className="text-gray-600">Drenaje:</div>
                    <div className="font-medium">{resultado.desglose.canalon}</div>
                    <div className="text-gray-600">Pilares:</div>
                    <div className="font-medium">{resultado.desglose.pilares} uds</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span>Estructura:</span>
                    <span>{resultado.precios.estructura.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cubierta:</span>
                    <span>{resultado.precios.cubierta.toFixed(2)} €</span>
                  </div>
                  {resultado.precios.pilares > 0 && (
                    <div className="flex justify-between">
                      <span>Pilares adicionales:</span>
                      <span>{resultado.precios.pilares.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.canalon > 0 && (
                    <div className="flex justify-between">
                      <span>Sistema drenaje:</span>
                      <span>{resultado.precios.canalon.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.recargo_altura > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Recargo altura:</span>
                      <span>{resultado.precios.recargo_altura.toFixed(2)} €</span>
                    </div>
                  )}
                  {resultado.precios.recargo_pendiente > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Recargo pendiente:</span>
                      <span>{resultado.precios.recargo_pendiente.toFixed(2)} €</span>
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

                <div className="bg-amber-500 text-white rounded-lg p-4 mb-4">
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
                  <div className="text-4xl mb-3">☂️</div>
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

export default CalculadorMarquesinas;
