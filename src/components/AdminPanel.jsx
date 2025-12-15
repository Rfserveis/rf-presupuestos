// components/AdminPanel.jsx - Panel de Administración con importación Excel
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  procesarArchivoCompleto, 
  leerExcel, 
  detectarTipoArchivo,
  getHistorialImportaciones 
} from '../services/importador';

const AdminPanel = () => {
  const { userProfile } = useAuth();
  const fileInputRef = useRef(null);
  
  // Estados
  const [archivo, setArchivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [vista, setVista] = useState('importar'); // 'importar' | 'historial' | 'datos'
  const [modoImportacion, setModoImportacion] = useState('upsert'); // 'upsert' | 'reemplazar'
  
  // Cargar historial al montar
  useEffect(() => {
    cargarHistorial();
  }, []);
  
  const cargarHistorial = async () => {
    const { success, data } = await getHistorialImportaciones();
    if (success) {
      setHistorial(data);
    }
  };
  
  // Manejar selección de archivo
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }
    
    setArchivo(file);
    setResultado(null);
    setProcesando(true);
    
    try {
      // Leer y mostrar preview
      const lectura = await leerExcel(file);
      if (lectura.success) {
        const tipoArchivo = detectarTipoArchivo(lectura.nombreArchivo, lectura.hojas);
        setPreview({
          ...lectura,
          tipoArchivo
        });
      }
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      alert('Error leyendo el archivo');
    }
    
    setProcesando(false);
  };
  
  // Procesar importación
  const handleImportar = async () => {
    if (!archivo) return;
    
    setProcesando(true);
    setResultado(null);
    
    try {
      const result = await procesarArchivoCompleto(archivo, { modo: modoImportacion });
      setResultado(result);
      
      if (result.success) {
        cargarHistorial(); // Actualizar historial
      }
    } catch (error) {
      setResultado({
        success: false,
        error: error.message
      });
    }
    
    setProcesando(false);
  };
  
  // Limpiar selección
  const handleLimpiar = () => {
    setArchivo(null);
    setPreview(null);
    setResultado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Renderizar preview de datos
  const renderPreviewTabla = (nombreHoja, datos) => {
    if (!datos || datos.length === 0) return null;
    
    const columnas = Object.keys(datos[0]);
    const muestra = datos.slice(0, 5);
    
    return (
      <div key={nombreHoja} className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">
          📄 {nombreHoja} ({datos.length} registros)
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border">
            <thead className="bg-gray-100">
              <tr>
                {columnas.slice(0, 8).map(col => (
                  <th key={col} className="px-2 py-1 border text-left truncate max-w-32">
                    {col}
                  </th>
                ))}
                {columnas.length > 8 && (
                  <th className="px-2 py-1 border">...</th>
                )}
              </tr>
            </thead>
            <tbody>
              {muestra.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {columnas.slice(0, 8).map(col => (
                    <td key={col} className="px-2 py-1 border truncate max-w-32">
                      {row[col]?.toString() || '-'}
                    </td>
                  ))}
                  {columnas.length > 8 && (
                    <td className="px-2 py-1 border">...</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {datos.length > 5 && (
          <p className="text-xs text-gray-500 mt-1">
            Mostrando 5 de {datos.length} registros
          </p>
        )}
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          ⚙️ Panel de Administración
        </h1>
        <p className="text-purple-100 mt-1">
          Gestiona las tarifas y datos del sistema
        </p>
      </div>
      
      {/* Tabs de navegación */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setVista('importar')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            vista === 'importar' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📤 Importar Excel
        </button>
        <button
          onClick={() => setVista('historial')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            vista === 'historial' 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📋 Historial
        </button>
      </div>
      
      {/* Vista: Importar */}
      {vista === 'importar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo - Upload */}
          <div className="space-y-4">
            {/* Zona de upload */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="font-semibold text-gray-800 mb-4">1️⃣ Seleccionar Archivo</h2>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  archivo 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {archivo ? (
                  <div>
                    <div className="text-4xl mb-2">✅</div>
                    <p className="font-medium text-green-700">{archivo.name}</p>
                    <p className="text-sm text-green-600">
                      {(archivo.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">📁</div>
                    <p className="font-medium text-gray-600">
                      Arrastra o haz clic para seleccionar
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Archivos Excel (.xlsx, .xls)
                    </p>
                  </div>
                )}
              </div>
              
              {/* Archivos soportados */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">Archivos soportados:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>📊 TARIFA_VIDRIOS_MASTER.xlsx</li>
                  <li>📊 TARIFA_MARQUESINAS_v2.xlsx</li>
                  <li>📊 TARIFA_TOP_GLASS.xlsx</li>
                  <li>📊 TARIFA_ESCALERAS_ESCAMOTEABLES.xlsx</li>
                </ul>
              </div>
            </div>
            
            {/* Opciones de importación */}
            {preview && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-800 mb-4">2️⃣ Opciones</h2>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="modo"
                      value="upsert"
                      checked={modoImportacion === 'upsert'}
                      onChange={() => setModoImportacion('upsert')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <p className="font-medium text-gray-700">Actualizar existentes</p>
                      <p className="text-xs text-gray-500">
                        Actualiza registros existentes y añade nuevos
                      </p>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="modo"
                      value="reemplazar"
                      checked={modoImportacion === 'reemplazar'}
                      onChange={() => setModoImportacion('reemplazar')}
                      className="w-4 h-4 text-purple-600"
                    />
                    <div>
                      <p className="font-medium text-gray-700">Reemplazar todo</p>
                      <p className="text-xs text-red-500">
                        ⚠️ Borra todos los datos existentes y los reemplaza
                      </p>
                    </div>
                  </label>
                </div>
                
                {/* Botones de acción */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleImportar}
                    disabled={procesando || !archivo}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {procesando ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Procesando...
                      </>
                    ) : (
                      <>
                        🚀 Importar Datos
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={handleLimpiar}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Panel derecho - Preview y Resultados */}
          <div className="space-y-4">
            {/* Preview del archivo */}
            {preview && !resultado && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-800 mb-4">
                  👁️ Vista Previa
                </h2>
                
                {/* Info del archivo */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {preview.tipoArchivo.tipo === 'VIDRIOS_MASTER' && '🪟'}
                      {preview.tipoArchivo.tipo === 'MARQUESINAS' && '☂️'}
                      {preview.tipoArchivo.tipo === 'TOP_GLASS' && '🛡️'}
                      {preview.tipoArchivo.tipo === 'ESCALERAS' && '🪜'}
                      {preview.tipoArchivo.tipo === 'DESCONOCIDO' && '❓'}
                    </span>
                    <div>
                      <p className="font-medium text-blue-800">
                        {preview.tipoArchivo.descripcion}
                      </p>
                      <p className="text-sm text-blue-600">
                        {preview.totalRegistros} registros en {preview.hojas.length} hojas
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Hojas detectadas */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Hojas encontradas:</p>
                  <div className="flex flex-wrap gap-2">
                    {preview.hojas.map(hoja => (
                      <span 
                        key={hoja}
                        className={`px-2 py-1 rounded text-xs ${
                          preview.tipoArchivo.hojasEsperadas?.includes(hoja)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hoja}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Preview de datos */}
                <div className="max-h-96 overflow-y-auto">
                  {preview.hojas
                    .filter(h => !h.startsWith('_'))
                    .slice(0, 3)
                    .map(hoja => renderPreviewTabla(hoja, preview.datos[hoja]))
                  }
                </div>
              </div>
            )}
            
            {/* Resultados de importación */}
            {resultado && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="font-semibold text-gray-800 mb-4">
                  {resultado.success ? '✅ Importación Completada' : '❌ Error en Importación'}
                </h2>
                
                {resultado.success ? (
                  <div>
                    {/* Resumen */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-green-600">Archivo</p>
                          <p className="font-medium text-green-800">{resultado.resumen.archivo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-green-600">Registros importados</p>
                          <p className="font-bold text-2xl text-green-800">
                            {resultado.resumen.totalInsertados}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detalle por tabla */}
                    <div className="space-y-2">
                      {resultado.resultados.map((r, idx) => (
                        <div 
                          key={idx}
                          className={`p-3 rounded-lg ${
                            r.status === 'completado' 
                              ? 'bg-green-50 border border-green-200' 
                              : r.status === 'omitido'
                              ? 'bg-gray-50 border border-gray-200'
                              : 'bg-red-50 border border-red-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {r.status === 'completado' && '✅'}
                                {r.status === 'omitido' && '⏭️'}
                                {r.status === 'error' && '❌'}
                                {' '}{r.tabla}
                              </p>
                              <p className="text-xs text-gray-500">
                                Hoja: {r.hoja}
                              </p>
                            </div>
                            <div className="text-right">
                              {r.insertados !== undefined && (
                                <p className="font-bold text-green-700">
                                  +{r.insertados}
                                </p>
                              )}
                              {r.mensaje && (
                                <p className="text-xs text-gray-500">{r.mensaje}</p>
                              )}
                            </div>
                          </div>
                          {r.errores && r.errores.length > 0 && (
                            <div className="mt-2 text-xs text-red-600">
                              {r.errores.slice(0, 3).map((e, i) => (
                                <p key={i}>• {e}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">{resultado.error}</p>
                    <p className="text-sm text-red-600 mt-1">
                      Fase: {resultado.fase || 'procesamiento'}
                    </p>
                  </div>
                )}
                
                {/* Botón para nueva importación */}
                <button
                  onClick={handleLimpiar}
                  className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  📤 Nueva Importación
                </button>
              </div>
            )}
            
            {/* Estado vacío */}
            {!preview && !resultado && (
              <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
                <div className="text-5xl mb-4">📊</div>
                <p>Selecciona un archivo Excel para ver la vista previa</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Vista: Historial */}
      {vista === 'historial' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold text-gray-800 mb-4">📋 Historial de Importaciones</h2>
          
          {historial.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">📭</div>
              <p>No hay importaciones registradas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Archivo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Categoría</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Registros</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historial.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.created_at).toLocaleString('es-ES')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {item.archivo}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.categoria}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="text-green-600 font-medium">
                          +{item.registros_insertados}
                        </span>
                        {item.registros_error > 0 && (
                          <span className="text-red-500 ml-2">
                            ({item.registros_error} errores)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.estado === 'completado' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <button
            onClick={cargarHistorial}
            className="mt-4 text-purple-600 hover:text-purple-800 text-sm font-medium"
          >
            🔄 Actualizar historial
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
