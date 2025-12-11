// ============================================================
// VIDRES.JS - v3.0 - Conectat a vidrios_master
// ============================================================
import { supabase } from './supabase';

/**
 * Mapeo de colores del formulario a la BD
 */
const MAPEO_COLORES = {
  'INCOLORO': 'Transparente',
  'TRANSPARENTE': 'Transparente',
  'VERDE': 'Verde',
  'GRIS/BRONCE': 'Gris',
  'GRIS': 'Gris',
  'MATE': 'Mate',
  'ÓPTICO': 'Óptico',
  'OPTICO': 'Óptico',
  'GRIS/MATE': 'Gris Mate',
  'Transparente': 'Transparente',
  'Mate': 'Mate',
  'Gris': 'Gris',
  'Verde': 'Verde'
};

const normalizarColor = (color) => {
  if (!color) return '';
  const colorUpper = color.toUpperCase().trim();
  return MAPEO_COLORES[colorUpper] || MAPEO_COLORES[color] || color;
};

/**
 * Obtenir tots els proveïdors actius
 */
export const getProveidors = async () => {
  try {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre');
    
    if (error) throw error;
    
    return data.map(p => ({
      id: p.id,
      nom: p.nombre,
      nombre: p.nombre,
      hace_vidrios: p.hace_vidrios,
      hace_marquesinas: p.hace_marquesinas,
      es_habitual: p.es_habitual
    }));
  } catch (error) {
    console.error('Error obtenint proveïdors:', error);
    throw error;
  }
};

/**
 * Obtenir vidres per categoria
 */
export const getVidrios = async (categoria = 'VIDRIOS', proveedorNombre = null) => {
  try {
    const { data, error } = await supabase
      .from('vidrios_master')
      .select(`
        *,
        proveedor:proveedores(nombre)
      `)
      .eq('categoria', categoria)
      .eq('activo', true);
    
    if (error) throw error;
    
    if (proveedorNombre) {
      return data.filter(v => v.proveedor?.nombre === proveedorNombre);
    }
    
    return data;
  } catch (error) {
    console.error('Error obtenint vidres:', error);
    throw error;
  }
};

/**
 * Obtenir vidres laminats (retrocompatibilitat)
 */
export const getVidriosLaminados = async (proveedorNombre = null) => {
  try {
    const { data, error } = await supabase
      .from('vidrios_master')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('tipo', 'Laminado')
      .eq('activo', true);
    
    if (error) throw error;
    
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
 * Obtenir vidres laminat templat (retrocompatibilitat)
 */
export const getVidriosLaminadoTemplado = async (proveedorNombre = null) => {
  try {
    const { data, error } = await supabase
      .from('vidrios_master')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('tipo', 'Laminado Templado')
      .eq('activo', true);
    
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
 * Obtenir vidres templats (retrocompatibilitat)
 */
export const getVidriosTemplados = async (proveedorNombre = null) => {
  try {
    const { data, error } = await supabase
      .from('vidrios_master')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('tipo', 'Templado')
      .eq('activo', true);
    
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
 * Obtenir vidres marquesines
 */
export const getVidriosMarquesinas = async (pvb = null) => {
  try {
    let query = supabase
      .from('vidrios_master')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('categoria', 'MARQUESINAS')
      .eq('activo', true);
    
    if (pvb) {
      query = query.eq('pvb', pvb);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obtenint vidres marquesines:', error);
    throw error;
  }
};

/**
 * Obtenir operacions
 */
export const getOperaciones = async (proveedorNombre = null, aplicaA = null) => {
  try {
    const { data, error } = await supabase
      .from('operaciones')
      .select(`*, proveedor:proveedores(nombre)`)
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
 * Buscar vidre específic
 */
export const buscarVidre = async (filtres) => {
  const { proveidor, tipus, gruix, acabado, categoria = 'VIDRIOS' } = filtres;
  const acabadoNormalizado = normalizarColor(acabado);
  
  try {
    // Determinar tipo de vidrio
    let tipoVidrio = 'Laminado';
    if (tipus === 'Templado' || tipus === 'Temperat') {
      tipoVidrio = 'Templado';
    } else if (tipus.includes('Laminado') && tipus.includes('Templado')) {
      tipoVidrio = 'Laminado Templado';
    } else if (tipus.includes('Laminat') && tipus.includes('Temperat')) {
      tipoVidrio = 'Laminado Templado';
    }
    
    const { data, error } = await supabase
      .from('vidrios_master')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('categoria', categoria)
      .eq('tipo', tipoVidrio)
      .eq('espesor_mm', gruix)
      .eq('activo', true);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Filtrar per proveïdor i acabat
      let vidre = data.find(v => 
        v.proveedor?.nombre === proveidor && 
        v.acabado.toLowerCase().includes(acabadoNormalizado.toLowerCase())
      ) || data.find(v => 
        v.proveedor?.nombre === proveidor
      ) || data[0];
      
      if (vidre) {
        vidre.tipo_vidrio = tipoVidrio;
        vidre.precio_m2 = parseFloat(vidre.precio_m2);
      }
      
      return vidre;
    }
    
    return null;
  } catch (error) {
    console.error('Error buscant vidre:', error);
    throw error;
  }
};

/**
 * Obtenir preu de procés
 */
export const getPreuProces = async (proveidor, tipusProces, tipoVidrio = 'TODOS') => {
  try {
    const { data, error } = await supabase
      .from('operaciones')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('activo', true);
    
    if (error) throw error;
    
    const mapeoTipos = {
      'cant': 'canto pulido',
      'canto': 'canto pulido',
      'punta': 'punta roma',
      'taladre': 'taladro',
      'taladro': 'taladro',
      'forat': 'taladro'
    };
    
    const busqueda = mapeoTipos[tipusProces.toLowerCase()] || tipusProces.toLowerCase();
    
    const operacion = data.find(o => 
      o.proveedor?.nombre === proveidor &&
      o.descripcion.toLowerCase().includes(busqueda) &&
      (o.aplica_a === 'TODOS' || o.aplica_a === tipoVidrio || o.aplica_a === 'LAMINADO' || o.aplica_a === 'TEMPLADO')
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
      amplada, alcada, quantitat, forma, tipus, gruix, color, proveidor,
      cantos, puntes, quantitatPuntes, forats, quantitatForats, diametreForats
    } = configuracio;
    
    // 1. Buscar el vidre
    const vidre = await buscarVidre({
      proveidor, tipus, gruix, acabado: color
    });
    
    if (!vidre) {
      throw new Error(`No se ha encontrado vidrio: ${tipus} ${gruix} ${color} de ${proveidor}`);
    }
    
    // 2. Calcular m²
    const m2Unitat = (amplada * alcada) / 1000000;
    const m2Total = m2Unitat * quantitat;
    
    // 3. Preu base
    const preuM2 = parseFloat(vidre.precio_m2);
    let preuBase = preuM2 * m2Total;
    
    // 4. Recàrrec per vidre inclinat
    let recarrecInclinat = 0;
    if (forma === 'inclinat') {
      const recargo = await getPreuProces(proveidor, 'recargo forma', vidre.tipo_vidrio);
      if (recargo && recargo.tipo_calculo === 'PORCENTAJE') {
        recarrecInclinat = preuBase * (recargo.preu / 100);
      }
    }
    
    // 5. Processos
    let preuProcessos = 0;
    const detallProcessos = [];
    const permiteTaladros = vidre.tipo_vidrio !== 'Laminado';
    
    // Cantos
    if (cantos) {
      const perimetreUnitat = (2 * (amplada + alcada)) / 1000;
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
    
    // Forats
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
      throw new Error('Los taladros solo se pueden hacer en vidrio templado o laminado templado.');
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
        amplada, alcada,
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
 * Llistar tots els vidres (debug/admin)
 */
export const llistarTotsVidres = async () => {
  try {
    const { data, error } = await supabase
      .from('vidrios_master')
      .select(`*, proveedor:proveedores(nombre)`)
      .eq('activo', true)
      .order('categoria')
      .order('tipo')
      .order('espesor_mm');
    
    if (error) throw error;
    return {
      vidrios: data,
      total: data.length
    };
  } catch (error) {
    console.error('Error llistant vidres:', error);
    throw error;
  }
};
