import { useState } from 'react';
import { traductiones as t } from '../../locales/es';
import GestorExcel from './GestorExcel';
import ValidadorDatos from './ValidadorDatos';
import ActualizadorBD from './ActualizadorBD';

const AdminPanel = () => {
  const [vistaAdmin, setVistaAdmin] = useState('inicio');
  const [datosExcel, setDatosExcel] = useState(null);
  const [validacionResultado, setValidacionResultado] = useState(null);

  const handleExcelCargado = (datos) => {
    setDatosExcel(datos);
    setVistaAdmin('validador');
  };

  const handleValidacionCompleta = (resultado) => {
    setValidacionResultado(resultado);
    setVistaAdmin('actualizador');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* HEADER DEL PANEL ADMIN */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center">
            <span className="text-3xl">⚙️</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{t.admin.titulo}</h1>
            <p className="text-gray-600 mt-2">{t.admin.descripcion}</p>
          </div>
        </div>

        {/* NAVEGACIÓN DEL PANEL ADMIN */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setVistaAdmin('inicio')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              vistaAdmin === 'inicio'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Inicio
          </button>
          <button
            onClick={() => setVistaAdmin('excel')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              vistaAdmin === 'excel'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📤 {t.admin.subirExcel}
          </button>
          <button
            onClick={() => setVistaAdmin('validador')}
            disabled={!datosExcel}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              vistaAdmin === 'validador'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            ✓ {t.admin.verificarDatos}
          </button>
          <button
            onClick={() => setVistaAdmin('actualizador')}
            disabled={!validacionResultado}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              vistaAdmin === 'actualizador'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            🔄 Actualizar BD
          </button>
        </div>
      </div>

      {/* VISTA: INICIO */}
      {vistaAdmin === 'inicio' && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Flujo de Actualización de Datos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="text-4xl mb-3">📤</div>
              <h3 className="font-bold text-blue-800 mb-2">Paso 1: Cargar Excel</h3>
              <p className="text-sm text-gray-600">Sube el archivo Excel con los datos a importar</p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <div className="text-4xl mb-3">✓</div>
              <h3 className="font-bold text-green-800 mb-2">Paso 2: Validar</h3>
              <p className="text-sm text-gray-600">Revisa y verifica los datos antes de importar</p>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border-2 border-purple-200">
              <div className="text-4xl mb-3">👁️</div>
              <h3 className="font-bold text-purple-800 mb-2">Paso 3: Previsualizar</h3>
              <p className="text-sm text-gray-600">Visualiza cómo quedarán los datos en la BD</p>
            </div>

            <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
              <div className="text-4xl mb-3">🔄</div>
              <h3 className="font-bold text-orange-800 mb-2">Paso 4: Actualizar</h3>
              <p className="text-sm text-gray-600">Aplica los cambios a la base de datos</p>
            </div>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">⚠️ Importante</h4>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>✓ Los archivos Excel deben tener una estructura específica</li>
              <li>✓ Se validarán todos los datos antes de actualizar</li>
              <li>✓ Se creará un respaldo automático antes de cada actualización</li>
              <li>✓ Los cambios se registran en la auditoría</li>
            </ul>
          </div>

          <button
            onClick={() => setVistaAdmin('excel')}
            className="mt-6 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Comenzar →
          </button>
        </div>
      )}

      {/* VISTA: GESTOR EXCEL */}
      {vistaAdmin === 'excel' && (
        <GestorExcel onExcelCargado={handleExcelCargado} />
      )}

      {/* VISTA: VALIDADOR */}
      {vistaAdmin === 'validador' && datosExcel && (
        <ValidadorDatos 
          datos={datosExcel} 
          onValidacionCompleta={handleValidacionCompleta}
        />
      )}

      {/* VISTA: ACTUALIZADOR */}
      {vistaAdmin === 'actualizador' && validacionResultado && (
        <ActualizadorBD validacionResultado={validacionResultado} />
      )}
    </div>
  );
};

export default AdminPanel;
