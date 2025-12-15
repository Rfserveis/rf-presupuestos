// CalculadorEscalerasRetractiles.jsx - Calculador de Escaleras Retráctiles
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createPresupuesto, CATEGORIAS } from '../services/presupuestos';
import { searchClientes } from '../services/clientes';

const MODELOS = [
  { id: 'madera_basica', nombre: 'Madera Básica', precio_base: 350, descripcion: 'Económica para uso ocasional' },
  { id: 'madera_premium', nombre: 'Madera Premium', precio_base: 550, descripcion: 'Madera maciza alta calidad' },
  { id: 'metalica', nombre: 'Metálica Plegable', precio_base: 450, descripcion: 'Robusta y duradera' },
  { id: 'tijera', nombre: 'Tijera Metálica', precio_base: 650, descripcion: 'Compacta, alto tránsito' },
  { id: 'electrica', nombre: 'Eléctrica Motorizada', precio_base: 1200, descripcion: 'Máximo confort' },
];

const AISLAMIENTO = [
  { id: 'sin', nombre: 'Sin Aislamiento', factor: 1.0 },
  { id: 'basico', nombre: 'Aislamiento Básico', factor: 1.15 },
  { id: 'termico', nombre: 'Térmico Reforzado', factor: 1.35 },
  { id: 'ignifugo', nombre: 'Ignífugo RF', factor: 1.50 },
];

const TRAMPILLAS = [
  { id: 'madera', nombre: 'Madera', precio: 120 },
  { id: 'madera_aislada', nombre: 'Madera Aislada', precio: 180 },
  { id: 'metalica', nombre: 'Metálica', precio: 220 },
  { id: 'metalica_rf', nombre: 'Metálica RF', precio: 380 },
];

const BARANDILLAS = [
  { id: 'sin', nombre: 'Sin Barandilla', precio: 0 },
  { id: 'madera', nombre: 'Barandilla Madera', precio: 85 },
  { id: 'metalica', nombre: 'Barandilla Metálica', precio: 120 },
];

const CalculadorEscalerasRetractiles = ({ onGuardar, clientePreseleccionado }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    modelo: 'madera_basica',
    altura_suelo_techo: 2700,
    hueco_largo: 1200,
    hueco_ancho: 600,
    aislamiento: 'sin',
    trampilla: 'madera',
    barandilla: 'sin',
    pasamanos_adicional: false,
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
        if (success) { setClientesResultados(data); setMostrarBusqueda(true); }
      } else { setClientesResultados([]); setMostrarBusqueda(false); }
    };
    const timer = setTimeout(buscar, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  const calcular = () => {
    const { modelo, altura_suelo_techo, hueco_largo, hueco_ancho, aislamiento, trampilla, barandilla, pasamanos_adicional, incluir_montaje } = formData;
    
    const altura = parseInt(altura_suelo_techo);
    const largo = parseInt(hueco_largo);
    const ancho = parseInt(hueco_ancho);
    
    if (altura <= 0 || largo <= 0 || ancho <= 0) {
      setMensaje({ tipo: 'error', texto: 'Introduce las medidas' });
      return;
    }

    const modeloData = MODELOS.find(m => m.id === modelo);
    const aislamientoData = AISLAMIENTO.find(a => a.id === aislamiento);
    const trampillaData = TRAMPILLAS.find(t => t.id === trampilla);
    const barandillaData = BARANDILLAS.find(b => b.id === barandilla);

    // Precio base del modelo
    let precio_escalera = modeloData.precio_base;
    
    // Ajuste por altura (base 2700mm, +50€ por cada 200mm adicionales)
    if (altura > 2700) {
      precio_escalera += Math.ceil((altura - 2700) / 200) * 50;
    }

    // Ajuste por tamaño de hueco (base 1200x600)
    const factor_tamaño = (largo * ancho) / (1200 * 600);
    if (factor_tamaño > 1) {
      precio_escalera *= 1 + ((factor_tamaño - 1) * 0.3);
    }

    // Aplicar factor de aislamiento
    precio_escalera *= aislamientoData.factor;

    // Precio trampilla
    let precio_trampilla = trampillaData.precio;
    // Ajustar por tamaño de hueco
    precio_trampilla *= factor_tamaño > 1 ? factor_tamaño : 1;

    // Precio barandilla
    const precio_barandilla = barandillaData.precio;

    // Pasamanos adicional
    const precio_pasamanos = pasamanos_adicional ? 65 : 0;

    // Montaje
    let precio_montaje = 0;
    if (incluir_montaje) {
      precio_montaje = modelo === 'electrica' ? 180 : 120;
    }

    const subtotal = precio_escalera + precio_trampilla + precio_barandilla + precio_pasamanos + precio_montaje;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      desglose: {
        modelo: modeloData.nombre,
        altura: altura + ' mm',
        hueco: `${largo} x ${ancho} mm`,
        aislamiento: aislamientoData.nombre,
        trampilla: trampillaData.nombre,
        barandilla: barandillaData.nombre,
      },
      precios: {
        escalera: precio_escalera,
        trampilla: precio_trampilla,
        barandilla: precio_barandilla,
        pasamanos: precio_pasamanos,
        montaje: precio_montaje
      },
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
        categoria: CATEGORIAS.ESCALERAS_RETRACTILES,
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
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🪜</span>
          Calculador Escaleras Retráctiles
        </h2>
        <p className="text-cyan-100 text-sm mt-1">Escaleras plegables para acceso a buhardillas</p>
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
                placeholder="Buscar cliente..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500" />
              {mostrarBusqueda && clientesResultados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-auto">
                  {clientesResultados.map(c => (
                    <button key={c.id} onClick={() => seleccionarCliente(c)} className="w-full px-4 py-2 text-left hover:bg-cyan-50">
                      {c.nombre} {c.empresa && `(${c.empresa})`}
                    </button>
                  ))}
                </div>
              )}
              {clienteSeleccionado && <p className="mt-1 text-sm text-green-600">✓ {clienteSeleccionado.nombre}</p>}
            </div>

            {/* Modelo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🪜 Modelo de Escalera</h3>
              <div className="space-y-2">
                {MODELOS.map(m => (
                  <label key={m.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-colors ${formData.modelo === m.id ? 'border-cyan-500 bg-white' : 'border-transparent bg-white/50'}`}>
                    <input type="radio" name="modelo" checked={formData.modelo === m.id}
                      onChange={() => setFormData({...formData, modelo: m.id})} className="text-cyan-600" />
                    <div className="flex-1">
                      <div className="font-medium">{m.nombre}</div>
                      <div className="text-xs text-gray-500">{m.descripcion}</div>
                    </div>
                    <div className="text-sm font-bold text-cyan-600">{m.precio_base}€</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Medidas */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📐 Medidas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Altura suelo-techo (mm)</label>
                  <input type="number" value={formData.altura_suelo_techo}
                    onChange={(e) => setFormData({...formData, altura_suelo_techo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hueco largo (mm)</label>
                  <input type="number" value={formData.hueco_largo}
                    onChange={(e) => setFormData({...formData, hueco_largo: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hueco ancho (mm)</label>
                  <input type="number" value={formData.hueco_ancho}
                    onChange={(e) => setFormData({...formData, hueco_ancho: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500" />
                </div>
              </div>
            </div>

            {/* Aislamiento */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🌡️ Aislamiento</h3>
              <select value={formData.aislamiento} onChange={(e) => setFormData({...formData, aislamiento: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                {AISLAMIENTO.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>

            {/* Trampilla y barandilla */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🚪 Trampilla y Barandilla</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Trampilla</label>
                  <select value={formData.trampilla} onChange={(e) => setFormData({...formData, trampilla: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                    {TRAMPILLAS.map(t => <option key={t.id} value={t.id}>{t.nombre} ({t.precio}€)</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Barandilla llegada</label>
                  <select value={formData.barandilla} onChange={(e) => setFormData({...formData, barandilla: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                    {BARANDILLAS.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Opciones */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.pasamanos_adicional}
                  onChange={(e) => setFormData({...formData, pasamanos_adicional: e.target.checked})}
                  className="w-4 h-4 text-cyan-600 rounded" />
                <span className="text-sm">Pasamanos adicional (+65€)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.incluir_montaje}
                  onChange={(e) => setFormData({...formData, incluir_montaje: e.target.checked})}
                  className="w-4 h-4 text-cyan-600 rounded" />
                <span className="text-sm">Incluir montaje</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button onClick={calcular} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg">
                📊 Calcular
              </button>
              <button onClick={() => { setFormData({ modelo: 'madera_basica', altura_suelo_techo: 2700, hueco_largo: 1200, hueco_ancho: 600, aislamiento: 'sin', trampilla: 'madera', barandilla: 'sin', pasamanos_adicional: false, incluir_montaje: true }); setResultado(null); }}
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
                
                <div className="bg-white rounded-lg p-4 mb-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-gray-600">Modelo:</div>
                    <div className="font-medium">{resultado.desglose.modelo}</div>
                    <div className="text-gray-600">Altura:</div>
                    <div className="font-medium">{resultado.desglose.altura}</div>
                    <div className="text-gray-600">Hueco:</div>
                    <div className="font-medium">{resultado.desglose.hueco}</div>
                    <div className="text-gray-600">Aislamiento:</div>
                    <div className="font-medium">{resultado.desglose.aislamiento}</div>
                    <div className="text-gray-600">Trampilla:</div>
                    <div className="font-medium">{resultado.desglose.trampilla}</div>
                    <div className="text-gray-600">Barandilla:</div>
                    <div className="font-medium">{resultado.desglose.barandilla}</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between"><span>Escalera:</span><span>{resultado.precios.escalera.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Trampilla:</span><span>{resultado.precios.trampilla.toFixed(2)} €</span></div>
                  {resultado.precios.barandilla > 0 && <div className="flex justify-between"><span>Barandilla:</span><span>{resultado.precios.barandilla.toFixed(2)} €</span></div>}
                  {resultado.precios.pasamanos > 0 && <div className="flex justify-between"><span>Pasamanos:</span><span>{resultado.precios.pasamanos.toFixed(2)} €</span></div>}
                  {resultado.precios.montaje > 0 && <div className="flex justify-between"><span>Montaje:</span><span>{resultado.precios.montaje.toFixed(2)} €</span></div>}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-medium"><span>Subtotal:</span><span>{resultado.subtotal.toFixed(2)} €</span></div>
                    <div className="flex justify-between text-gray-600"><span>IVA (21%):</span><span>{resultado.iva.toFixed(2)} €</span></div>
                  </div>
                </div>

                <div className="bg-cyan-600 text-white rounded-lg p-4 mb-4">
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

export default CalculadorEscalerasRetractiles;
