// CalculadorVidrios.jsx - Calculador de Vidrios RF Presupuestos
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { getClientes, searchClientes } from '../services/clientes';

// Datos de ejemplo - En producción vendrían de la BD via Excel upload
const TIPOS_VIDRIO = [
  { id: 'float', nombre: 'Float / Monolítico', factor: 1.0 },
  { id: 'templado', nombre: 'Templado', factor: 1.8 },
  { id: 'laminado', nombre: 'Laminado', factor: 2.2 },
  { id: 'camara', nombre: 'Cámara / Doble', factor: 2.5 },
];

const ESPESORES = [
  { id: '4', mm: 4, precio_m2: 25 },
  { id: '6', mm: 6, precio_m2: 32 },
  { id: '8', mm: 8, precio_m2: 45 },
  { id: '10', mm: 10, precio_m2: 58 },
  { id: '12', mm: 12, precio_m2: 72 },
  { id: '15', mm: 15, precio_m2: 95 },
  { id: '19', mm: 19, precio_m2: 120 },
];

const COLORES = [
  { id: 'incoloro', nombre: 'Incoloro', factor: 1.0 },
  { id: 'bronce', nombre: 'Bronce', factor: 1.15 },
  { id: 'gris', nombre: 'Gris', factor: 1.15 },
  { id: 'verde', nombre: 'Verde', factor: 1.20 },
  { id: 'azul', nombre: 'Azul', factor: 1.25 },
  { id: 'extraclaro', nombre: 'Extraclaro', factor: 1.30 },
];

const FORMAS = [
  { id: 'recto', nombre: 'Rectangular', factor: 1.0 },
  { id: 'curvo', nombre: 'Curvo', factor: 1.8 },
  { id: 'triangular', nombre: 'Triangular', factor: 1.3 },
  { id: 'irregular', nombre: 'Forma Irregular', factor: 1.5 },
];

const CalculadorVidrios = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    ancho: '',
    alto: '',
    cantidad: 1,
    tipo: 'float',
    espesor: '6',
    color: 'incoloro',
    forma: 'recto',
    cantos: false,
    tipoCantos: 'pulido',
    puntas: false,
    agujeros: 0,
    diametroAgujeros: 10,
  });

  // Estado del cliente
  const [clienteId, setClienteId] = useState(clientePreseleccionado || null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesResultados, setClientesResultados] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  // Estado del cálculo
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

  // Calcular presupuesto
  const calcular = () => {
    const { ancho, alto, cantidad, tipo, espesor, color, forma, cantos, tipoCantos, puntas, agujeros, diametroAgujeros } = formData;
    
    if (!ancho || !alto) {
      setMensaje({ tipo: 'error', texto: 'Introduce las medidas del vidrio' });
      return;
    }

    // Convertir a metros cuadrados
    const m2 = (parseFloat(ancho) / 1000) * (parseFloat(alto) / 1000);
    const m2Total = m2 * parseInt(cantidad);

    // Obtener factores
    const tipoVidrio = TIPOS_VIDRIO.find(t => t.id === tipo);
    const espesorData = ESPESORES.find(e => e.id === espesor);
    const colorData = COLORES.find(c => c.id === color);
    const formaData = FORMAS.find(f => f.id === forma);

    // Calcular precio base
    let precioBase = espesorData.precio_m2 * m2Total;
    precioBase *= tipoVidrio.factor;
    precioBase *= colorData.factor;
    precioBase *= formaData.factor;

    // Calcular extras
    let extras = 0;
    const detalleExtras = [];

    // Cantos
    if (cantos) {
      const perimetro = 2 * (parseFloat(ancho) + parseFloat(alto)) / 1000;
      const precioCantos = tipoCantos === 'pulido' ? 8 : 12; // €/ml
      const costoCantos = perimetro * precioCantos * parseInt(cantidad);
      extras += costoCantos;
      detalleExtras.push({ nombre: `Cantos ${tipoCantos}`, cantidad: `${(perimetro * cantidad).toFixed(2)} ml`, precio: costoCantos });
    }

    // Puntas
    if (puntas) {
      const costoPuntas = 4 * 3 * parseInt(cantidad); // 4 puntas x 3€
      extras += costoPuntas;
      detalleExtras.push({ nombre: 'Puntas matadas', cantidad: `${4 * cantidad} uds`, precio: costoPuntas });
    }

    // Agujeros (solo en templado)
    if (agujeros > 0 && tipo === 'templado') {
      const costoAgujeros = parseInt(agujeros) * 15 * parseInt(cantidad);
      extras += costoAgujeros;
      detalleExtras.push({ nombre: `Agujeros Ø${diametroAgujeros}mm`, cantidad: `${agujeros * cantidad} uds`, precio: costoAgujeros });
    }

    const subtotal = precioBase + extras;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      m2_unidad: m2,
      m2_total: m2Total,
      precio_base: precioBase,
      extras: detalleExtras,
      total_extras: extras,
      subtotal,
      iva,
      total,
      desglose: {
        tipo: tipoVidrio.nombre,
        espesor: `${espesorData.mm}mm`,
        color: colorData.nombre,
        forma: formaData.nombre,
        cantidad: parseInt(cantidad),
        medidas: `${ancho} x ${alto} mm`
      }
    });

    setMensaje(null);
  };

  // Guardar presupuesto
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
        categoria: CATEGORIAS.VIDRIOS,
        cliente_id: clienteId || clienteSeleccionado?.id,
        datos: {
          formData,
          resultado
        },
        subtotal: resultado.subtotal,
        iva: 21,
        total: resultado.total,
        created_by: user?.id
      };

      const { success, data, error } = await createPresupuesto(presupuesto);

      if (success) {
        setMensaje({ tipo: 'success', texto: `Presupuesto ${data.numero} guardado correctamente` });
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

  // Seleccionar cliente
  const seleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setClienteId(cliente.id);
    setBusquedaCliente(cliente.nombre);
    setMostrarBusqueda(false);
  };

  // Limpiar formulario
  const limpiar = () => {
    setFormData({
      ancho: '',
      alto: '',
      cantidad: 1,
      tipo: 'float',
      espesor: '6',
      color: 'incoloro',
      forma: 'recto',
      cantos: false,
      tipoCantos: 'pulido',
      puntas: false,
      agujeros: 0,
      diametroAgujeros: 10,
    });
    setResultado(null);
    setMensaje(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🪟</span>
          Calculador de Vidrios
        </h2>
        <p className="text-blue-100 text-sm mt-1">Calcula presupuestos de vidrio rápidamente</p>
      </div>

      <div className="p-6">
        {/* Mensaje */}
        {mensaje && (
          <div className={`mb-4 p-4 rounded-lg ${
            mensaje.tipo === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            mensaje.tipo === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {mensaje.texto}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda - Formulario */}
          <div className="space-y-6">
            {/* Selector de Cliente */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input
                type="text"
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                placeholder="Buscar cliente por nombre o empresa..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(cliente => (
                    <button
                      key={cliente.id}
                      onClick={() => seleccionarCliente(cliente)}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 flex justify-between items-center"
                    >
                      <span className="font-medium">{cliente.nombre}</span>
                      {cliente.empresa && <span className="text-gray-500 text-sm">{cliente.empresa}</span>}
                    </button>
                  ))}
                </div>
              )}
              {clienteSeleccionado && (
                <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                  ✓ Cliente: {clienteSeleccionado.nombre}
                  {clienteSeleccionado.empresa && ` (${clienteSeleccionado.empresa})`}
                </div>
              )}
            </div>

            {/* Medidas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Medidas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ancho (mm)</label>
                  <input
                    type="number"
                    value={formData.ancho}
                    onChange={(e) => setFormData({...formData, ancho: e.target.value})}
                    placeholder="1000"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Alto (mm)</label>
                  <input
                    type="number"
                    value={formData.alto}
                    onChange={(e) => setFormData({...formData, alto: e.target.value})}
                    placeholder="1500"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Especificaciones */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">⚙️ Especificaciones</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Tipo de Vidrio</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {TIPOS_VIDRIO.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Espesor</label>
                  <select
                    value={formData.espesor}
                    onChange={(e) => setFormData({...formData, espesor: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {ESPESORES.map(e => (
                      <option key={e.id} value={e.id}>{e.mm} mm</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {COLORES.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Forma</label>
                  <select
                    value={formData.forma}
                    onChange={(e) => setFormData({...formData, forma: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {FORMAS.map(f => (
                      <option key={f.id} value={f.id}>{f.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Procesos adicionales */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Procesos Adicionales</h3>
              <div className="space-y-3">
                {/* Cantos */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.cantos}
                      onChange={(e) => setFormData({...formData, cantos: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Cantos</span>
                  </label>
                  {formData.cantos && (
                    <select
                      value={formData.tipoCantos}
                      onChange={(e) => setFormData({...formData, tipoCantos: e.target.value})}
                      className="px-3 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pulido">Pulido (8€/ml)</option>
                      <option value="biselado">Biselado (12€/ml)</option>
                    </select>
                  )}
                </div>

                {/* Puntas */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.puntas}
                    onChange={(e) => setFormData({...formData, puntas: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">Puntas matadas (3€/ud)</span>
                </label>

                {/* Agujeros */}
                {formData.tipo === 'templado' && (
                  <div className="flex items-center gap-4">
                    <label className="text-sm">Agujeros:</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.agujeros}
                      onChange={(e) => setFormData({...formData, agujeros: e.target.value})}
                      className="w-20 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {formData.agujeros > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Ø</span>
                        <input
                          type="number"
                          value={formData.diametroAgujeros}
                          onChange={(e) => setFormData({...formData, diametroAgujeros: e.target.value})}
                          className="w-16 px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">mm</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={calcular}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                📊 Calcular
              </button>
              <button
                onClick={limpiar}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          {/* Columna derecha - Resultado */}
          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Resumen del Presupuesto</h3>
                
                {/* Desglose */}
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-600">Tipo:</div>
                    <div className="font-medium">{resultado.desglose.tipo}</div>
                    <div className="text-gray-600">Espesor:</div>
                    <div className="font-medium">{resultado.desglose.espesor}</div>
                    <div className="text-gray-600">Color:</div>
                    <div className="font-medium">{resultado.desglose.color}</div>
                    <div className="text-gray-600">Forma:</div>
                    <div className="font-medium">{resultado.desglose.forma}</div>
                    <div className="text-gray-600">Medidas:</div>
                    <div className="font-medium">{resultado.desglose.medidas}</div>
                    <div className="text-gray-600">Cantidad:</div>
                    <div className="font-medium">{resultado.desglose.cantidad} uds</div>
                    <div className="text-gray-600">m² por unidad:</div>
                    <div className="font-medium">{resultado.m2_unidad.toFixed(3)} m²</div>
                    <div className="text-gray-600">m² total:</div>
                    <div className="font-medium">{resultado.m2_total.toFixed(3)} m²</div>
                  </div>
                </div>

                {/* Precios */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Vidrio base:</span>
                    <span className="font-medium">{resultado.precio_base.toFixed(2)} €</span>
                  </div>
                  
                  {resultado.extras.length > 0 && (
                    <div className="border-t pt-2 mt-2">
                      <div className="text-sm text-gray-600 mb-1">Extras:</div>
                      {resultado.extras.map((extra, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-2">
                          <span className="text-gray-600">{extra.nombre} ({extra.cantidad}):</span>
                          <span>{extra.precio.toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-semibold">{resultado.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>IVA (21%):</span>
                      <span>{resultado.iva.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-blue-600 text-white rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Botón guardar */}
                <button
                  onClick={guardarPresupuesto}
                  disabled={guardando}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {guardando ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      💾 Guardar Presupuesto
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 h-full flex items-center justify-center">
                <div>
                  <div className="text-4xl mb-3">📊</div>
                  <p>Introduce los datos y pulsa <strong>Calcular</strong></p>
                  <p className="text-sm mt-2">El resultado aparecerá aquí</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculadorVidrios;
