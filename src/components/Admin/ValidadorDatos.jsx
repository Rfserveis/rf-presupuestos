import { useState } from 'react';
import { traductiones as t } from '../../locales/es';

const ValidadorDatos = ({ datos, onValidacionCompleta }) => {
  const [validando, setValidando] = useState(false);
  const [errores, setErrores] = useState([]);
  const [validacionCompleta, setValidacionCompleta] = useState(false);

  const validarDatos = async () => {
    setValidando(true);
    setErrores([]);

    try {
      // Simulación de validación
      // En producción, esto se haría en el backend
      
      const erroresEncontrados = [];

      datos.forEach((fila, indice) => {
        // Validar campos obligatorios
        if (!fila.familia) {
          erroresEncontrados.push({
            fila: indice + 1,
            campo: 'familia',
            mensaje: 'Campo obligatorio'
          });
        }
        if (!fila.tipo) {
          erroresEncontrados.push({
            fila: indice + 1,
            campo: 'tipo',
            mensaje: 'Campo obligatorio'
          });
        }
        if (!fila.gruix || isNaN(parseFloat(fila.gruix))) {
          erroresEncontrados.push({
            fila: indice + 1,
            campo: 'gruix',
            mensaje: 'Debe ser un número válido'
          });
        }
        if (!fila.preu_m2 || isNaN(parseFloat(fila.preu_m2))) {
          erroresEncontrados.push({
            fila: indice + 1,
            campo: 'preu_m2',
            mensaje: 'Debe ser un precio válido'
          });
        }
      });

      await new Promise(r => setTimeout(r, 1500)); // Simular espera

      if (erroresEncontrados.length > 0) {
        setErrores(erroresEncontrados);
      } else {
        setValidacionCompleta(true);
      }
    } finally {
      setValidando(false);
    }
  };

  const handleAceptar = () => {
    if (validacionCompleta && errores.length === 0) {
      onValidacionCompleta({
        datos,
        validado: true,
        timestamp: new Date()
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">✓ {t.admin.previsualizacion}</h2>

      {/* TABLA DE DATOS */}
      <div className="mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">{t.admin.datosCargados}:</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">#</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Familia</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Tipo</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Espesor</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Color</th>
              <th className="border border-gray-300 px-4 py-2 text-right">Precio/m²</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Proveedor</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Activo</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-2">{idx + 1}</td>
                <td className="border border-gray-300 px-4 py-2">{fila.familia}</td>
                <td className="border border-gray-300 px-4 py-2">{fila.tipo}</td>
                <td className="border border-gray-300 px-4 py-2">{fila.gruix}</td>
                <td className="border border-gray-300 px-4 py-2">{fila.color}</td>
                <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                  {parseFloat(fila.preu_m2).toFixed(2)} €
                </td>
                <td className="border border-gray-300 px-4 py-2">{fila.proveidor}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">
                  {fila.actiu ? '✓' : '✗'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTÓN VALIDAR */}
      <button
        onClick={validarDatos}
        disabled={validando || validacionCompleta}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {validando ? `${t.admin.validando}...` : t.admin.verificarDatos}
      </button>

      {validando && (
        <div className="flex items-center gap-3 mb-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">{t.admin.validando}...</p>
        </div>
      )}

      {/* ERRORES */}
      {errores.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <h4 className="font-bold text-red-800 mb-3">⚠️ {t.admin.erroresEncontrados}:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-3 py-2 text-left">{t.admin.fila}</th>
                  <th className="px-3 py-2 text-left">{t.admin.campo}</th>
                  <th className="px-3 py-2 text-left">{t.admin.mensaje}</th>
                </tr>
              </thead>
              <tbody>
                {errores.map((error, idx) => (
                  <tr key={idx} className="border-t border-red-200">
                    <td className="px-3 py-2 text-red-700 font-semibold">{error.fila}</td>
                    <td className="px-3 py-2 text-red-600">{error.campo}</td>
                    <td className="px-3 py-2 text-red-700">{error.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VALIDACIÓN EXITOSA */}
      {validacionCompleta && errores.length === 0 && (
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <h4 className="font-bold text-green-800 mb-2">✓ {t.admin.noHayErrores}</h4>
          <p className="text-green-700">
            Se validaron {datos.length} filas correctamente. Ya puedes proceder a actualizar la base de datos.
          </p>
        </div>
      )}

      {/* BOTONES DE ACCIÓN */}
      <div className="flex gap-3">
        <button
          onClick={handleAceptar}
          disabled={!validacionCompleta || errores.length > 0}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ {t.admin.aceptar}
        </button>
        <button
          onClick={() => window.history.back()}
          className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
        >
          ↶ Volver
        </button>
      </div>

      {/* INFORMACIÓN */}
      <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded text-sm text-blue-700">
        <p className="font-semibold mb-2">ℹ️ Información</p>
        <p>Se validarán {datos.length} filas. Los errores encontrados deben ser corregidos antes de continuar.</p>
      </div>
    </div>
  );
};

export default ValidadorDatos;
