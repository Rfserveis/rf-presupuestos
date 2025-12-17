// CalculadorEscalerasRetractiles.jsx - Calculador Escaleras Escamoteables
// Datos de TARIFA_ESCALERAS_ESCAMOTEABLES (Fantozzi)
import { useState } from 'react';

// MODELOS Fantozzi (del Excel)
const MODELOS = [
  {
    id: 'ACI_SVEZIA',
    nombre: 'ACI SVEZIA',
    descripcion: 'Escalera plegable de madera',
    precio: 395.00,
    transporte: { barcelona: 121, peninsula: 143, baleares: 231, canarias: null }
  },
  {
    id: 'PARED_VERTICAL',
    nombre: 'PARED VERTICAL',
    descripcion: 'Escalera vertical para pared',
    precio: 1033.00,
    transporte: { barcelona: 121, peninsula: 143, baleares: 231, canarias: null }
  },
  {
    id: 'THERMOBOX_PREMIUM',
    nombre: 'ACI ALLUMINIO THERMOBOX Premium',
    descripcion: 'Escalera automatica de aluminio - Modelo Premium',
    precio: 2558.00,
    transporte: { barcelona: 143, peninsula: 176, baleares: 286, canarias: null }
  },
  {
    id: 'THERMOBOX_BASIC',
    nombre: 'ACI ALLUMINIO THERMOBOX Basic',
    descripcion: 'Escalera automatica de aluminio - Modelo Basic',
    precio: 1975.00,
    transporte: { barcelona: 143, peninsula: 176, baleares: 286, canarias: null }
  }
];

const ZONAS_ENVIO = [
  { id: 'barcelona', nombre: 'Barcelona y provincia' },
  { id: 'peninsula', nombre: 'Peninsula (resto)' },
  { id: 'baleares', nombre: 'Baleares' },
  { id: 'canarias', nombre: 'Canarias (consultar)' }
];

const CalculadorEscalerasRetractiles = () => {
  const [formData, setFormData] = useState({
    modelo: 'ACI_SVEZIA',
    cantidad: 1,
    zonaEnvio: 'peninsula',
    instalacion: false
  });

  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const { modelo, cantidad, zonaEnvio, instalacion } = formData;
    const modeloData = MODELOS.find(m => m.id === modelo);
    
    if (!modeloData) return;

    const precioUnitario = modeloData.precio;
    const totalProducto = precioUnitario * parseInt(cantidad);
    
    let precioTransporte = modeloData.transporte[zonaEnvio];
    if (precioTransporte === null) {
      precioTransporte = 0;
    }
    
    const precioInstalacion = instalacion ? 150 * parseInt(cantidad) : 0;

    const subtotal = totalProducto + precioTransporte + precioInstalacion;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    setResultado({
      modelo: modeloData.nombre,
      descripcion: modeloData.descripcion,
      cantidad: parseInt(cantidad),
      precioUnitario,
      totalProducto,
      zonaEnvio: ZONAS_ENVIO.find(z => z.id === zonaEnvio)?.nombre,
      precioTransporte,
      transporteConsultar: modeloData.transporte[zonaEnvio] === null,
      instalacion,
      precioInstalacion,
      subtotal,
      iva,
      total
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">🪜 Calculador Escaleras Escamoteables</h2>
        <p className="text-cyan-100 text-sm">Fantozzi - Escaleras plegables y automaticas</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">📦 Modelo</h3>
              <div className="space-y-2">
                {MODELOS.map(m => (
                  <label key={m.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      formData.modelo === m.id 
                        ? 'bg-cyan-100 border-2 border-cyan-500' 
                        : 'bg-white border-2 border-gray-200 hover:border-cyan-300'
                    }`}>
                    <input type="radio" name="modelo" value={m.id}
                      checked={formData.modelo === m.id}
                      onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                      className="mt-1 w-4 h-4 text-cyan-600" />
                    <div className="flex-1">
                      <div className="font-medium">{m.nombre}</div>
                      <div className="text-xs text-gray-500">{m.descripcion}</div>
                      <div className="text-sm font-bold text-cyan-700 mt-1">{m.precio.toFixed(2)} €</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🔢 Cantidad</h3>
              <input type="number" min="1" value={formData.cantidad}
                onChange={(e) => setFormData({...formData, cantidad: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500" />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-3">🚚 Zona de envio</h3>
              <select value={formData.zonaEnvio} 
                onChange={(e) => setFormData({...formData, zonaEnvio: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500">
                {ZONAS_ENVIO.map(z => <option key={z.id} value={z.id}>{z.nombre}</option>)}
              </select>
              {formData.zonaEnvio === 'canarias' && (
                <p className="text-xs text-orange-600 mt-2">Transporte a Canarias: consultar precio</p>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.instalacion}
                  onChange={(e) => setFormData({...formData, instalacion: e.target.checked})}
                  className="w-4 h-4 text-cyan-600 rounded" />
                <span className="text-sm">Incluir instalacion (+150 €/unidad)</span>
              </label>
            </div>

            <button onClick={calcular} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg">
              📊 Calcular Presupuesto
            </button>
          </div>

          <div>
            {resultado ? (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 sticky top-4">
                <h3 className="font-bold text-lg text-gray-800 mb-4">📋 Presupuesto</h3>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-sm">
                  <p className="font-medium">{resultado.modelo}</p>
                  <p className="text-gray-500 text-xs">{resultado.descripcion}</p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span>Producto ({resultado.cantidad} x {resultado.precioUnitario.toFixed(2)} €)</span>
                    <span className="font-medium">{resultado.totalProducto.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transporte ({resultado.zonaEnvio})</span>
                    <span className="font-medium">
                      {resultado.transporteConsultar ? 'Consultar' : `${resultado.precioTransporte.toFixed(2)} €`}
                    </span>
                  </div>
                  {resultado.instalacion && (
                    <div className="flex justify-between">
                      <span>Instalacion</span>
                      <span className="font-medium">{resultado.precioInstalacion.toFixed(2)} €</span>
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

                <div className="bg-cyan-600 text-white rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">TOTAL:</span>
                    <span className="text-2xl font-bold">{resultado.total.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 min-h-[400px] flex items-center justify-center">
                <div>
                  <div className="text-5xl mb-3">🪜</div>
                  <p>Selecciona un modelo y pulsa <strong>Calcular</strong></p>
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
