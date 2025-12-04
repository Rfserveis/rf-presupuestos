import { supabase } from './supabase';

/**
 * Obtenir tots els proveïdors actius
 */
export const getProveidors = async (tipus = null) => {
  try {
    let query = supabase
      .from('proveidors')
      .select('*')
      .eq('actiu', true)
      .order('nom');
    
    if (tipus) {
      query = query.eq('tipus', tipus);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obtenint proveïdors:', error);
    throw error;
  }
};

/**
 * Obtenir categories de vidre
 */
export const getCategoriesVidre = async () => {
  try {
    const { data, error } = await supabase
      .from('categories_vidre')
      .select('*')
      .order('nom');
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obtenint categories:', error);
    throw error;
  }
};

/**
 * Buscar vidre específic amb filtres
 */
export const buscarVidre = async (filtres) => {
  try {
    const { proveidor, tipus, gruix, color, familia } = filtres;
    
    // Primer obtenir l'ID del proveïdor
    const { data: proveidorData, error: proveidorError } = await supabase
      .from('proveidors')
      .select('id')
      .eq('nom', proveidor)
      .single();
    
    if (proveidorError) throw proveidorError;
    
    // Construir query per buscar el vidre
    let query = supabase
      .from('vidres')
      .select(`
        *,
        proveidor:proveidors(nom),
        categoria:categories_vidre(nom, descripcio)
      `)
      .eq('proveidor_id', proveidorData.id)
      .eq('actiu', true);
    
    // Aplicar filtres
    if (familia) {
      query = query.eq('familia', familia);
    }
    
    if (gruix) {
      // Per gruixos laminats (ex: "3+3")
      if (gruix.includes('+')) {
        query = query.eq('espesor_mm', gruix);
      } else {
        // Per gruixos monolítics
        query = query.eq('gruix_vidre', parseFloat(gruix));
      }
    }
    
    if (color) {
      query = query.ilike('color', color);
    }
    
    if (tipus) {
      query = query.ilike('nom', `%${tipus}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Si trobem múltiples resultats, retornar el primer
    if (data && data.length > 0) {
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error buscant vidre:', error);
    throw error;
  }
};

/**
 * Obtenir descompte per família de vidre
 */
export const getDescompte = async (proveidor, familia) => {
  try {
    const { data: proveidorData } = await supabase
      .from('proveidors')
      .select('id')
      .eq('nom', proveidor)
      .single();
    
    if (!proveidorData) return 0;
    
    const { data, error } = await supabase
      .from('descomptes')
      .select('percentatge')
      .eq('proveidor_id', proveidorData.id)
      .ilike('familia', `%${familia}%`)
      .eq('actiu', true)
      .single();
    
    if (error || !data) return 0;
    
    return parseFloat(data.percentatge);
  } catch (error) {
    console.error('Error obtenint descompte:', error);
    return 0;
  }
};

/**
 * Obtenir preu de procés (cant, punta, forat)
 */
export const getPreuProces = async (proveidor, tipusProces, mesura = null) => {
  try {
    const { data: proveidorData } = await supabase
      .from('proveidors')
      .select('id')
      .eq('nom', proveidor)
      .single();
    
    if (!proveidorData) return 0;
    
    let query = supabase
      .from('processos')
      .select('*')
      .eq('proveidor_id', proveidorData.id)
      .eq('tipus', tipusProces)
      .eq('actiu', true);
    
    // Si hi ha mesura, filtrar per rang
    if (mesura) {
      query = query
        .or(`mesura_min.is.null,mesura_min.lte.${mesura}`)
        .or(`mesura_max.is.null,mesura_max.gte.${mesura}`);
    }
    
    const { data, error } = await query.limit(1).single();
    
    if (error || !data) return 0;
    
    return {
      preu: parseFloat(data.preu),
      unitat: data.unitat,
      observacions: data.observacions
    };
  } catch (error) {
    console.error('Error obtenint preu de procés:', error);
    return 0;
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
      familia: tipus.includes('Laminat') ? 'Laminado' : 'Float',
      gruix,
      color,
      tipus
    });
    
    if (!vidre) {
      throw new Error('No s\'ha trobat el vidre amb aquestes característiques');
    }
    
    // 2. Calcular m²
    const m2Unitat = (amplada * alcada) / 1000000;
    const m2Total = m2Unitat * quantitat;
    
    // 3. Obtenir descompte
    const descompte = await getDescompte(proveidor, vidre.familia);
    
    // 4. Calcular preu base
    const preuLlista = parseFloat(vidre.preu_m2);
    const preuNetM2 = preuLlista * (1 - descompte / 100);
    let preuBase = preuNetM2 * m2Total;
    
    // 5. Recàrrec per vidre inclinat (si aplica)
    let recarrecInclinat = 0;
    if (forma === 'inclinat') {
      // TODO: Definir % de recàrrec
      // recarrecInclinat = preuBase * 0.10; // Exemple: 10%
    }
    
    // 6. Calcular processos
    let preuProcessos = 0;
    const detallProcessos = [];
    
    // Cantos
    if (cantos) {
      const perimetreUnitat = (2 * (amplada + alcada)) / 1000; // en metres
      const perimetreTotal = perimetreUnitat * quantitat;
      const preuCant = await getPreuProces(proveidor, 'cant');
      
      if (preuCant && preuCant.preu) {
        const costCantos = preuCant.preu * perimetreTotal;
        preuProcessos += costCantos;
        detallProcessos.push({
          tipus: 'Cantos',
          quantitat: perimetreTotal.toFixed(2),
          unitat: 'ml',
          preuUnitat: preuCant.preu,
          total: costCantos
        });
      }
    }
    
    // Puntes
    if (puntes && quantitatPuntes > 0) {
      const preuPunta = await getPreuProces(proveidor, 'punta');
      
      if (preuPunta && preuPunta.preu) {
        const totalPuntes = quantitatPuntes * quantitat;
        const costPuntes = preuPunta.preu * totalPuntes;
        preuProcessos += costPuntes;
        detallProcessos.push({
          tipus: 'Puntes roma polida',
          quantitat: totalPuntes,
          unitat: 'unitat',
          preuUnitat: preuPunta.preu,
          total: costPuntes
        });
      }
    }
    
    // Forats
    if (forats && quantitatForats > 0) {
      const preuForat = await getPreuProces(proveidor, 'taladre', parseFloat(diametreForats));
      
      if (preuForat && preuForat.preu) {
        const totalForats = quantitatForats * quantitat;
        const costForats = preuForat.preu * totalForats;
        preuProcessos += costForats;
        detallProcessos.push({
          tipus: `Forats Ø${diametreForats}mm`,
          quantitat: totalForats,
          unitat: 'unitat',
          preuUnitat: preuForat.preu,
          total: costForats
        });
      }
    }
    
    // 7. Total
    const preuTotal = preuBase + recarrecInclinat + preuProcessos;
    
    return {
      vidre: {
        nom: vidre.nom,
        referencia: `${vidre.familia} ${gruix}mm ${color}`,
        preuLlista,
        descompte,
        preuNetM2
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
 * Obtenir llista de vidres per proveïdor i tipus
 */
export const llistarVidres = async (proveidor, familia = null) => {
  try {
    const { data: proveidorData } = await supabase
      .from('proveidors')
      .select('id')
      .eq('nom', proveidor)
      .single();
    
    if (!proveidorData) return [];
    
    let query = supabase
      .from('vidres')
      .select('*')
      .eq('proveidor_id', proveidorData.id)
      .eq('actiu', true)
      .order('familia')
      .order('gruix_vidre');
    
    if (familia) {
      query = query.eq('familia', familia);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error llistant vidres:', error);
    throw error;
  }
};
