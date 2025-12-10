// ============================================================
// VIDRES.JS - CONECTADO A LAS NUEVAS TABLAS DE SUPABASE
// ============================================================
import { supabase } from './supabase';

/**
 * Obtenir tots els proveïdors actius
 */
export const getProveidors = async (tipus = null) => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    
    if (error) throw error;
    
    // Mapear a formato esperado por el componente
    return data.map(p => ({
      id: p.id,
      nom: p.nombre,
      nombre: p.nombre,
      hace_laminado: p.hace_laminado,
      hace_templado: p.hace_templado,
      hace_laminado_templado: p.hace_laminado_templado,
      es_habitual_laminado: p.es_habitual_laminado,
      es_habitual_laminado_templado: p.es_habitual_laminado_templado
    }));
  } catch (error) {
    console.error('Error obtenint proveïdors:', error);
    throw error;
  }
};

/**
 * Obtenir vidres laminats
 */
export const getVidriosLaminados = async (proveedorNombre = null) => {
  try {
    let query = supabase
      .from('vidrios_laminados')
      .select(`
        *,
        proveedor:proveedores(nombre)
      `)
      .eq('activo', true);
    
    const { data, error } = await query;
    if (error) throw error;
    
    // Filtrar por proveedor si se especifica
    if (proveedorNombre) {
      return data.filter(v => v.proveedor?.nombre === proveedorNombre);
    }
    
    return data;
  } catch (error) {
    console.error('Error obtenint vidres laminats:', error);
    throw error;
  }
};

/**
 * Obtenir vidres laminat templat
 */
export const getVidriosLaminadoTemplado = async (proveedorNombre = null) => {
  try {
    let query = supabase
      .from('vidrios_laminado_templado')
      .select(`
        *,
        proveedor:proveedores(nombre)
      `)
      .eq('activo', true);
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (proveedorNombre) {
      return data.filter(v => v.proveedor?.nombre === proveedorNombre);
    }
    
    return data;
  } catch (error) {
    console.error('Error obtenint vidres laminat templat:', error);
    throw error;
  }
};

/**
 * Obtenir vidres templats
 */
export const getVidriosTemplados = async (proveedorNombre = null) => {
  try {
    let query = supabase
      .from('vidrios_templados')
      .select(`
        *,
        proveedor:proveedores(nombre)
      `)
      .eq('activo', true);
    
    const { data, error } = await query;
    if (error) throw error;
    
    if (proveedorNombre) {
      return data.filter(v => v.proveedor?.nombre === proveedorNombre);
    }
    
    return data;
  } catch (error) {
    console.error('Error obtenint vidres templats:', error);
    throw error;
  }
};

/**
 * Obtenir vidres per marquesines (SentryGlas / OpaciGlas)
 */
export const getVidriosMarquesinas = async () => {
  try {
    const { data, error } = await supabase
      .from('vidrios_marquesinas')
      .select(`
        *,
        proveedor:proveedores(nombre)
      `)
      .eq('activo', true);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obtenint vidres marquesines:', error);
    throw error;
  }
};

/**
 * Obtenir operacions (cantos, taladros, etc.)
 */
export const getOperaciones = async (proveedorNombre = null, aplicaA = null) => {
  try {
    const { data, error } = await supabase
      .from('operaciones')
      .select(`
        *,
        proveedor:proveedores(nombre)
      `)
      .eq('activo', true);
    
    if (error) throw error;
    
    let resultado = data;
    
    if (proveedorNombre) {
      resultado = resultado.filter(o => o.proveedor?.nombre === proveedorNombre);
    }
    
    if (aplicaA) {
      resultado = resultado.filter(o => 
        o.aplica_a === 'TODOS' || o.aplica_a === aplicaA
      );
    }
    
    return resultado;
  } catch (error) {
    console.error('Error obtenint operacions:', error);
    throw error;
  }
};

/**
 * Buscar vidre específic segons tipus i característiques
 */
export const buscarVidre = async (filtres) => {
  const { proveidor, tipus, gruix, acabado } = filtres;
  
  try {
    let vidre = null;
    
    // Determinar qué tabla consultar según el tipo
    if (tipus === 'Laminado' || tipus.includes('Laminado') && !tipus.includes('Templado')) {
      // Buscar en vidrios_laminados
      const { data, error } = await supabase
        .from('vidrios_laminados')
        .select(`*, proveedor:proveedores(nombre)`)
        .eq('activo', true)
        .eq('espesor_mm', gruix)
        .ilike('acabado', `%${acabado}%`);
      
      if (!error && data?.length > 0) {
        // Filtrar por proveedor
        vidre = data.find(v => v.proveedor?.nombre === proveidor) || data[0];
        if (vidre) {
          vidre.precio_m2 = vidre.precio_m2;
          vidre.tipo_vidrio = 'Laminado';
        }
      }
    } 
    else if (tipus === 'Templado' || tipus === 'Temperat') {
      // Buscar en vidrios_templados
      const { data, error } = await supabase
        .from('vidrios_templados')
        .select(`*, proveedor:proveedores(nombre)`)
        .eq('activo', true)
        .eq('espesor_mm', gruix);
      
      if (!error && data?.length > 0) {
        vidre = data.find(v => v.proveedor?.nombre === proveidor) || data[0];
        if (vidre) {
          vidre.tipo_vidrio = 'Templado';
        }
      }
    }
    else if (tipus.includes('Laminado') && tipus.includes('Templado') || tipus.includes('Laminat') && tipus.includes('Temperat')) {
      // Buscar en vidrios_laminado_templado
      const { data, error } = await supabase
        .from('vidrios_laminado_templado')
        .select(`*, proveedor:proveedores(nombre)`)
        .eq('activo', true)
        .eq('espesor_mm', gruix);
      
      if (!error && data?.length > 0) {
        // Filtrar por proveedor y acabado
        vidre = data.find(v => 
          v.proveedor?.nombre === proveidor && 
          v.acabado.toLowerCase().includes(acabado.toLowerCase())
        ) || data.find(v => v.proveedor?.nombre === proveidor) || data[0];
        
        if (vidre) {
          vidre.precio_m2 = vidre.precio_total_m2;
          vidre.tipo_vidrio = 'Laminado Templado';
        }
      }
    }
    else if (tipus.includes('SentryGlas') || tipus.includes('Sentry')) {
      // Buscar en vidrios_marquesinas
      const { data, error } = await supabase
        .from('vidrios_marquesinas')
        .select(`*, proveedor:proveedores(nombre)`)
        .eq('activo', true)
        .eq('intercapa', 'SentryGlas')
        .eq('espesor_mm', gruix);
      
      if (!error && data?.length > 0) {
        vidre = data[0];
        vidre.tipo_vidrio = 'Laminado Templado SG';
      }
    }
    
    return vidre;
    
  } catch (error) {
    console.error('Error buscant vidre:', error);
    throw error;
  }
};

/**
 * Obtenir preu de procés (cant, punta, forat)
 */
export const getPreuProces = async (proveidor, tipusProces, tipoVidrio = 'TODOS') => {
  try {
    const { data, error } = await supabase
      .from('operaciones')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('activo', true);
    
    if (error) throw error;
    
    // Mapear tipo de proceso a descripción
    const mapeoTipos = {
      'cant': 'canto pulido',
      'canto': 'canto pulido',
      'punta': 'punta roma',
      'taladre': 'taladro',
      'taladro': 'taladro',
      'forat': 'taladro'
    };
    
    const busqueda = mapeoTipos[tipusProces.toLowerCase()] || tipusProces.toLowerCase();
    
    // Filtrar operaciones
    const operacion = data.find(o => 
      o.proveedor?.nombre === proveidor &&
      o.descripcion.toLowerCase().includes(busqueda) &&
      (o.aplica_a === 'TODOS' || o.aplica_a === tipoVidrio)
    );
    
    if (operacion) {
      return {
        preu: parseFloat(operacion.precio),
        unitat: operacion.unidad,
        descripcion: operacion.descripcion,
        tipo_calculo: operacion.tipo_calculo
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error obtenint preu procés:', error);
    return null;
  }
};

/**
 * Calcular preu total d'un vidre
 */
export const calcularPreuVidre = async (configuracio) => {
  try {
    const {
      amplada,
      alcada,
      quantitat,
      forma,
      tipus,
      gruix,
      color,
      proveidor,
      cantos,
      puntes,
      quantitatPuntes,
      forats,
      quantitatForats,
      diametreForats
    } = configuracio;
    
    // 1. Buscar el vidre a la base de dades
    const vidre = await buscarVidre({
      proveidor,
      tipus,
      gruix,
      acabado: color
    });
    
    if (!vidre) {
      throw new Error(`No s'ha trobat vidre: ${tipus} ${gruix} ${color} de ${proveidor}`);
    }
    
    // 2. Calcular m²
    const m2Unitat = (amplada * alcada) / 1000000;
    const m2Total = m2Unitat * quantitat;
    
    // 3. Preu base (ja no hi ha descomptes, el preu és net)
    const preuM2 = parseFloat(vidre.precio_m2);
    let preuBase = preuM2 * m2Total;
    
    // 4. Recàrrec per vidre inclinat (si aplica)
    let recarrecInclinat = 0;
    if (forma === 'inclinat') {
      // Buscar recargo en operaciones
      const recargo = await getPreuProces(proveidor, 'recargo forma', vidre.tipo_vidrio);
      if (recargo && recargo.tipo_calculo === 'PORCENTAJE') {
        recarrecInclinat = preuBase * (recargo.preu / 100);
      }
    }
    
    // 5. Calcular processos
    let preuProcessos = 0;
    const detallProcessos = [];
    
    // Determinar si permite taladros
    const permiteTaladros = vidre.tipo_vidrio !== 'Laminado';
    
    // Cantos
    if (cantos) {
      const perimetreUnitat = (2 * (amplada + alcada)) / 1000; // en metres
      const perimetreTotal = perimetreUnitat * quantitat;
      const preuCant = await getPreuProces(proveidor, 'canto', vidre.tipo_vidrio);
      
      if (preuCant && preuCant.preu > 0) {
        const costCantos = preuCant.preu * perimetreTotal;
        preuProcessos += costCantos;
        detallProcessos.push({
          tipus: 'Cantos pulidos',
          quantitat: perimetreTotal.toFixed(2),
          unitat: 'ml',
          preuUnitat: preuCant.preu,
          total: costCantos
        });
      } else if (preuCant && preuCant.preu === 0) {
        detallProcessos.push({
          tipus: 'Cantos pulidos',
          quantitat: perimetreTotal.toFixed(2),
          unitat: 'ml',
          preuUnitat: 0,
          total: 0
        });
      }
    }
    
    // Puntes
    if (puntes && quantitatPuntes > 0) {
      const preuPunta = await getPreuProces(proveidor, 'punta', vidre.tipo_vidrio);
      
      if (preuPunta && preuPunta.preu > 0) {
        const totalPuntes = quantitatPuntes * quantitat;
        const costPuntes = preuPunta.preu * totalPuntes;
        preuProcessos += costPuntes;
        detallProcessos.push({
          tipus: 'Puntas roma pulidas',
          quantitat: totalPuntes,
          unitat: 'unidades',
          preuUnitat: preuPunta.preu,
          total: costPuntes
        });
      }
    }
    
    // Forats (solo si el vidrio lo permite)
    if (forats && quantitatForats > 0 && permiteTaladros) {
      const preuForat = await getPreuProces(proveidor, 'taladro', vidre.tipo_vidrio);
      
      if (preuForat && preuForat.preu > 0) {
        const totalForats = quantitatForats * quantitat;
        const costForats = preuForat.preu * totalForats;
        preuProcessos += costForats;
        detallProcessos.push({
          tipus: `Taladros Ø${diametreForats}mm`,
          quantitat: totalForats,
          unitat: 'unidades',
          preuUnitat: preuForat.preu,
          total: costForats
        });
      }
    } else if (forats && quantitatForats > 0 && !permiteTaladros) {
      throw new Error('Los taladros solo se pueden hacer en vidrio templado o laminado templado. El vidrio laminado simple no se puede perforar.');
    }
    
    // 6. Total
    const preuTotal = preuBase + recarrecInclinat + preuProcessos;
    
    return {
      vidre: {
        nom: `${vidre.tipo} ${gruix}mm ${vidre.acabado}`,
        referencia: `${proveidor} - ${vidre.tipo_vidrio}`,
        preuLlista: preuM2,
        descompte: 0,
        preuNetM2: preuM2
      },
      mides: {
        amplada,
        alcada,
        m2Unitat: m2Unitat.toFixed(4),
        m2Total: m2Total.toFixed(4),
        quantitat
      },
      preus: {
        base: preuBase.toFixed(2),
        recarrecInclinat: recarrecInclinat.toFixed(2),
        processos: preuProcessos.toFixed(2),
        total: preuTotal.toFixed(2)
      },
      detallProcessos
    };
    
  } catch (error) {
    console.error('Error calculant preu:', error);
    throw error;
  }
};

/**
 * Obtenir regles de negoci
 */
export const getReglasNegocio = async (categoria = null) => {
  try {
    let query = supabase
      .from('reglas_negocio')
      .select('*')
      .eq('activo', true);
    
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obtenint regles:', error);
    throw error;
  }
};

/**
 * Llistar tots els vidres disponibles (per debug/admin)
 */
export const llistarTotsVidres = async () => {
  try {
    const [laminados, templados, laminadoTemplado, marquesinas] = await Promise.all([
      getVidriosLaminados(),
      getVidriosTemplados(),
      getVidriosLaminadoTemplado(),
      getVidriosMarquesinas()
    ]);
    
    return {
      laminados,
      templados,
      laminadoTemplado,
      marquesinas,
      total: laminados.length + templados.length + laminadoTemplado.length + marquesinas.length
    };
  } catch (error) {
    console.error('Error llistant vidres:', error);
    throw error;
  }
};
