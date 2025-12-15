// services/importador.js - Servicio de importación Excel a Supabase
import { supabase } from './supabase';
import * as XLSX from 'xlsx';

// =====================================================
// CONFIGURACIÓN DE MAPEO EXCEL -> BD
// =====================================================

const MAPEOS = {
  // TARIFA_VIDRIOS_MASTER.xlsx
  VIDRIOS_TODOS: {
    tabla: 'vidrios',
    hoja: 'VIDRIOS_TODOS',
    columnas: {
      'ID_RF': 'id_rf',
      'ID_PROVEEDOR': 'id_proveedor',
      'PROVEEDOR': 'proveedor',
      'CATEGORIA': 'categoria',
      'TIPO': 'tipo',
      'ESPESOR_MM': 'espesor_mm',
      'PVB': 'pvb',
      'ACABADO': 'acabado',
      'PRECIO_M2': 'precio_m2',
      'ACTIVO': 'activo',
      'OBSERVACIONES': 'observaciones'
    },
    campoUnico: 'id_rf',
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true,
      precio_m2: parseFloat(row.precio_m2) || 0
    })
  },
  
  OPERACIONES_VIDRIOS: {
    tabla: 'operaciones_vidrios',
    hoja: 'OPERACIONES_VIDRIOS',
    columnas: {
      'ID_RF': 'id_rf',
      'PROVEEDOR': 'proveedor',
      'DESCRIPCION': 'descripcion',
      'UNIDAD': 'unidad',
      'PRECIO': 'precio',
      'TIPO_CALCULO': 'tipo_calculo',
      'APLICA_A': 'aplica_a',
      'ACTIVO': 'activo'
    },
    campoUnico: 'id_rf',
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true,
      precio: parseFloat(row.precio) || 0
    })
  },

  // TARIFA_MARQUESINAS_v2.xlsx
  COMPONENTES_MARQUESINAS: {
    tabla: 'marquesinas',
    hoja: 'COMPONENTES_MARQUESINAS',
    columnas: {
      'ID_RF': 'id_rf',
      'ID_PROVEEDOR': 'id_proveedor',
      'PROVEEDOR': 'proveedor',
      'MODELO': 'modelo',
      'TIPO': 'tipo',
      'LONGITUD': 'longitud',
      'ESPESOR_MM': 'espesor_mm',
      'COLOR_VIDRIO': 'color_vidrio',
      'INTERCAPA': 'intercapa',
      'ACABADO': 'acabado',
      'PRECIO': 'precio',
      'UNIDAD': 'unidad',
      'ACTIVO': 'activo'
    },
    campoUnico: 'id_rf',
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true,
      precio: parseFloat(row.precio) || 0
    })
  },

  OPERACIONES_MARQUESINAS: {
    tabla: 'operaciones_marquesinas',
    hoja: 'OPERACIONES_MARQUESINAS',
    columnas: {
      'ID_RF': 'id_rf',
      'PROVEEDOR': 'proveedor',
      'DESCRIPCION': 'descripcion',
      'UNIDAD': 'unidad',
      'PRECIO': 'precio',
      'TIPO_CALCULO': 'tipo_calculo',
      'APLICA_A': 'aplica_a',
      'ACTIVO': 'activo'
    },
    campoUnico: 'id_rf',
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true,
      precio: parseFloat(row.precio) || 0
    })
  },

  // TARIFA_TOP_GLASS.xlsx
  VIDRIOS_LAMINADOS: {
    tabla: 'herrajes_topglass',
    hoja: 'VIDRIOS_LAMINADOS',
    columnas: {
      'ID_PROVEEDOR': 'id_proveedor',
      'PROVEEDOR': 'proveedor',
      'TIPO': 'tipo',
      'LONGITUD': 'longitud',
      'DIÀMETRO': 'diametro',
      'ACABADO': 'acabado',
      'INTERVALO': 'intervalo_espesor',
      'PRECIO': 'precio',
      'ACTIVO': 'activo'
    },
    campoUnico: null, // No tiene campo único, usar insert
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true,
      precio: parseFloat(row.precio) || 0
    })
  },

  VIDRIOS_LAMINADO_TEMPLADO: {
    tabla: 'vidrios_laminado_templado',
    hoja: 'VIDRIOS_LAMINADO_TEMPLADO',
    columnas: {
      'PROVEEDOR': 'proveedor',
      'TIPO': 'tipo',
      'ESPESOR_MM': 'espesor_mm',
      'PVB': 'pvb',
      'ACABADO': 'acabado',
      'PRECIO_TEMPLADO_M2': 'precio_templado_m2',
      'PRECIO_EVA_M2': 'precio_eva_m2',
      'PRECIO_TOTAL_M2': 'precio_total_m2',
      'ACTIVO': 'activo'
    },
    campoUnico: null,
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true,
      precio_templado_m2: parseFloat(row.precio_templado_m2) || 0,
      precio_eva_m2: parseFloat(row.precio_eva_m2) || 0,
      precio_total_m2: parseFloat(row.precio_total_m2) || 0
    })
  },

  // TARIFA_ESCALERAS_ESCAMOTEABLES.xlsx
  ESCALERAS_ESCAMOTEABLES: {
    tabla: 'escaleras_escamoteables',
    hoja: 'ESCALERAS_ESCAMOTEABLES',
    columnas: {
      'PROVEEDOR': 'proveedor',
      'MODELO': 'modelo',
      'TIPO': 'tipo',
      'PRECIO_KIT': 'precio_kit',
      'TRANSPORTE BARCELONA': 'transporte_barcelona',
      'TRANSPORTE ESPAÑA\n(PENINSULA)': 'transporte_peninsula',
      'TRANSPORTE BALEARES': 'transporte_baleares',
      'TRANSPORTE  CANARIAS': 'transporte_canarias'
    },
    campoUnico: null,
    transformar: (row) => ({
      ...row,
      precio_kit: parseFloat(row.precio_kit) || null,
      transporte_barcelona: parseFloat(row.transporte_barcelona) || null,
      transporte_peninsula: parseFloat(row.transporte_peninsula) || null,
      transporte_baleares: parseFloat(row.transporte_baleares) || null,
      transporte_canarias: parseFloat(row.transporte_canarias) || null
    })
  },

  // Proveedores (desde cualquier archivo)
  PROVEEDORES: {
    tabla: 'proveedores',
    hoja: 'PROVEEDORES',
    columnas: {
      'NOMBRE': 'nombre',
      'CONTACTO': 'contacto',
      'EMAIL': 'email',
      'TELEFONO': 'telefono',
      'ESPECIALIDAD': 'especialidad',
      'OBSERVACIONES': 'observaciones',
      'ACTIVO': 'activo'
    },
    campoUnico: 'nombre',
    transformar: (row) => ({
      ...row,
      activo: row.activo === 'SI' || row.activo === true
    })
  }
};

// =====================================================
// FUNCIONES DE LECTURA EXCEL
// =====================================================

export const leerExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const hojas = {};
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          hojas[sheetName] = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        });
        
        resolve({
          success: true,
          nombreArchivo: file.name,
          hojas: workbook.SheetNames,
          datos: hojas,
          totalRegistros: Object.values(hojas).reduce((sum, h) => sum + h.length, 0)
        });
      } catch (error) {
        reject({ success: false, error: error.message });
      }
    };
    
    reader.onerror = () => reject({ success: false, error: 'Error leyendo archivo' });
    reader.readAsArrayBuffer(file);
  });
};

// =====================================================
// DETECTAR TIPO DE ARCHIVO
// =====================================================

export const detectarTipoArchivo = (nombreArchivo, hojas) => {
  const nombre = nombreArchivo.toUpperCase();
  
  if (nombre.includes('VIDRIOS_MASTER') || nombre.includes('TARIFA_VIDRIOS')) {
    return {
      tipo: 'VIDRIOS_MASTER',
      descripcion: 'Tarifa de Vidrios',
      hojasEsperadas: ['VIDRIOS_TODOS', 'OPERACIONES_VIDRIOS', 'PROVEEDORES'],
      mapeos: ['VIDRIOS_TODOS', 'OPERACIONES_VIDRIOS', 'PROVEEDORES']
    };
  }
  
  if (nombre.includes('MARQUESINAS')) {
    return {
      tipo: 'MARQUESINAS',
      descripcion: 'Tarifa de Marquesinas',
      hojasEsperadas: ['COMPONENTES_MARQUESINAS', 'OPERACIONES_MARQUESINAS'],
      mapeos: ['COMPONENTES_MARQUESINAS', 'OPERACIONES_MARQUESINAS']
    };
  }
  
  if (nombre.includes('TOP_GLASS')) {
    return {
      tipo: 'TOP_GLASS',
      descripcion: 'Tarifa Top Glass (Barandillas)',
      hojasEsperadas: ['VIDRIOS_LAMINADOS', 'VIDRIOS_LAMINADO_TEMPLADO', 'OPERACIONES', 'PROVEEDORES'],
      mapeos: ['VIDRIOS_LAMINADOS', 'VIDRIOS_LAMINADO_TEMPLADO', 'PROVEEDORES']
    };
  }
  
  if (nombre.includes('ESCALERAS') || nombre.includes('ESCAMOTEABLES')) {
    return {
      tipo: 'ESCALERAS',
      descripcion: 'Tarifa de Escaleras Escamoteables',
      hojasEsperadas: ['ESCALERAS_ESCAMOTEABLES', 'PROVEEDORES'],
      mapeos: ['ESCALERAS_ESCAMOTEABLES', 'PROVEEDORES']
    };
  }
  
  return {
    tipo: 'DESCONOCIDO',
    descripcion: 'Tipo de archivo no reconocido',
    hojasEsperadas: [],
    mapeos: []
  };
};

// =====================================================
// VALIDAR DATOS
// =====================================================

export const validarDatos = (datos, mapeoKey) => {
  const mapeo = MAPEOS[mapeoKey];
  if (!mapeo) {
    return { valido: false, errores: [`Mapeo "${mapeoKey}" no encontrado`] };
  }
  
  const errores = [];
  const advertencias = [];
  const datosValidos = [];
  
  const columnasExcel = Object.keys(mapeo.columnas);
  
  datos.forEach((row, index) => {
    const fila = index + 2; // +2 porque Excel empieza en 1 y tiene header
    const registro = {};
    let filaValida = true;
    
    // Mapear columnas
    columnasExcel.forEach(colExcel => {
      const colBD = mapeo.columnas[colExcel];
      registro[colBD] = row[colExcel];
    });
    
    // Validar campos requeridos según la tabla
    if (mapeo.tabla === 'vidrios') {
      if (!registro.proveedor) {
        errores.push(`Fila ${fila}: Proveedor es requerido`);
        filaValida = false;
      }
      if (!registro.tipo) {
        errores.push(`Fila ${fila}: Tipo es requerido`);
        filaValida = false;
      }
      if (!registro.precio_m2 && registro.precio_m2 !== 0) {
        advertencias.push(`Fila ${fila}: Precio M2 vacío, se usará 0`);
        registro.precio_m2 = 0;
      }
    }
    
    if (mapeo.tabla === 'marquesinas') {
      if (!registro.proveedor) {
        errores.push(`Fila ${fila}: Proveedor es requerido`);
        filaValida = false;
      }
      if (!registro.modelo) {
        errores.push(`Fila ${fila}: Modelo es requerido`);
        filaValida = false;
      }
    }
    
    // Aplicar transformaciones
    if (filaValida && mapeo.transformar) {
      const transformado = mapeo.transformar(registro);
      datosValidos.push(transformado);
    }
  });
  
  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    datosValidos,
    totalProcesados: datos.length,
    totalValidos: datosValidos.length
  };
};

// =====================================================
// IMPORTAR A SUPABASE
// =====================================================

export const importarASupabase = async (datosValidos, mapeoKey, modo = 'upsert') => {
  const mapeo = MAPEOS[mapeoKey];
  if (!mapeo) {
    return { success: false, error: `Mapeo "${mapeoKey}" no encontrado` };
  }
  
  const tabla = mapeo.tabla;
  const campoUnico = mapeo.campoUnico;
  
  let insertados = 0;
  let actualizados = 0;
  let errores = [];
  
  try {
    if (modo === 'reemplazar') {
      // Borrar todos los registros existentes
      const { error: deleteError } = await supabase
        .from(tabla)
        .delete()
        .neq('id', 0); // Truco para borrar todo
      
      if (deleteError) {
        console.warn('Error borrando datos existentes:', deleteError);
      }
    }
    
    // Insertar en lotes de 100
    const BATCH_SIZE = 100;
    for (let i = 0; i < datosValidos.length; i += BATCH_SIZE) {
      const batch = datosValidos.slice(i, i + BATCH_SIZE);
      
      if (campoUnico && modo === 'upsert') {
        // Upsert: insertar o actualizar si existe
        const { data, error } = await supabase
          .from(tabla)
          .upsert(batch, { 
            onConflict: campoUnico,
            ignoreDuplicates: false 
          })
          .select();
        
        if (error) {
          errores.push(`Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          insertados += data?.length || batch.length;
        }
      } else {
        // Insert normal
        const { data, error } = await supabase
          .from(tabla)
          .insert(batch)
          .select();
        
        if (error) {
          errores.push(`Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${error.message}`);
        } else {
          insertados += data?.length || batch.length;
        }
      }
    }
    
    return {
      success: errores.length === 0,
      tabla,
      insertados,
      actualizados,
      errores,
      totalProcesados: datosValidos.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tabla
    };
  }
};

// =====================================================
// FUNCIÓN PRINCIPAL DE IMPORTACIÓN
// =====================================================

export const procesarArchivoCompleto = async (file, opciones = {}) => {
  const { modo = 'upsert' } = opciones;
  
  // 1. Leer Excel
  const lectura = await leerExcel(file);
  if (!lectura.success) {
    return { success: false, error: lectura.error, fase: 'lectura' };
  }
  
  // 2. Detectar tipo
  const tipoArchivo = detectarTipoArchivo(lectura.nombreArchivo, lectura.hojas);
  if (tipoArchivo.tipo === 'DESCONOCIDO') {
    return { 
      success: false, 
      error: 'Tipo de archivo no reconocido. Use: TARIFA_VIDRIOS_MASTER, TARIFA_MARQUESINAS, TARIFA_TOP_GLASS o TARIFA_ESCALERAS', 
      fase: 'deteccion' 
    };
  }
  
  // 3. Procesar cada hoja mapeada
  const resultados = [];
  
  for (const mapeoKey of tipoArchivo.mapeos) {
    const mapeo = MAPEOS[mapeoKey];
    if (!mapeo) continue;
    
    const hoja = mapeo.hoja;
    const datosHoja = lectura.datos[hoja];
    
    if (!datosHoja || datosHoja.length === 0) {
      resultados.push({
        hoja,
        tabla: mapeo.tabla,
        status: 'omitido',
        mensaje: `Hoja "${hoja}" no encontrada o vacía`
      });
      continue;
    }
    
    // Validar
    const validacion = validarDatos(datosHoja, mapeoKey);
    if (!validacion.valido) {
      resultados.push({
        hoja,
        tabla: mapeo.tabla,
        status: 'error',
        errores: validacion.errores,
        advertencias: validacion.advertencias
      });
      continue;
    }
    
    // Importar
    const importacion = await importarASupabase(validacion.datosValidos, mapeoKey, modo);
    resultados.push({
      hoja,
      tabla: mapeo.tabla,
      status: importacion.success ? 'completado' : 'error',
      insertados: importacion.insertados,
      errores: importacion.errores,
      totalRegistros: validacion.totalValidos
    });
  }
  
  // 4. Guardar en historial
  const totalInsertados = resultados.reduce((sum, r) => sum + (r.insertados || 0), 0);
  const totalErrores = resultados.filter(r => r.status === 'error').length;
  
  await supabase.from('importaciones').insert({
    archivo: file.name,
    categoria: tipoArchivo.tipo,
    registros_total: lectura.totalRegistros,
    registros_insertados: totalInsertados,
    registros_error: totalErrores,
    estado: totalErrores === 0 ? 'completado' : 'con_errores'
  });
  
  return {
    success: true,
    tipoArchivo,
    resultados,
    resumen: {
      archivo: file.name,
      totalHojas: tipoArchivo.mapeos.length,
      totalRegistros: lectura.totalRegistros,
      totalInsertados,
      totalErrores
    }
  };
};

// =====================================================
// OBTENER HISTORIAL DE IMPORTACIONES
// =====================================================

export const getHistorialImportaciones = async (limite = 20) => {
  const { data, error } = await supabase
    .from('importaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limite);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
};

export default {
  leerExcel,
  detectarTipoArchivo,
  validarDatos,
  importarASupabase,
  procesarArchivoCompleto,
  getHistorialImportaciones,
  MAPEOS
};
