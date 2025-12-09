// Traducciones al español para RF Presupuestos
export const traductiones = {
  // === AUTENTICACIÓN ===
  auth: {
    titulo: 'RF Serveis',
    subtitulo: 'Presupuestos',
    email: 'Email',
    emailPlaceholder: 'david@rfserveis.com',
    contrasena: 'Contraseña',
    contrasenaPlaceholder: '••••••••',
    entrar: 'Entrar',
    entrando: 'Entrando...',
    salir: 'Salir',
    errorEmail: 'El email es obligatorio',
    errorContrasena: 'La contraseña es obligatoria',
    errorAutenticacion: 'Error al iniciar sesión',
    errorDatosIncorrectos: 'Email o contraseña incorrectos',
    cargando: 'Cargando...',
  },

  // === NAVEGACIÓN ===
  nav: {
    inicio: 'Inicio',
    calculadorVidres: 'Calculador de Vidrios',
    presupuestos: 'Presupuestos',
    proximamente: 'Próximamente',
    admin: 'Administración',
    panelAdmin: 'Panel de Administración',
  },

  // === HEADER ===
  header: {
    bienvenida: 'Bienvenido/a',
    rol: 'Rol',
    usuario: 'Usuario',
    administrador: 'Administrador',
  },

  // === HOME ===
  home: {
    titulo: 'Crear Nuevo Presupuesto',
    descripcion: 'Selecciona la categoría del presupuesto:',
    vidrios: 'Vidrios',
    catalogoCompleto: 'Catálogo completo',
    barandillaAllGlass: 'Barandilla All Glass',
    barandillaTopGlass: 'Barandilla Top Glass',
    marquesinas: 'Marquesinas',
    escalerasOpera: 'Escaleras D\'opera',
    escalerasRF: 'Escaleras RF',
    escalerasRetractiles: 'Escaleras Retráctiles',
    estadoSistema: 'Estado del Sistema',
    loginFuncional: 'Login funcional',
    baseDatosCofigurada: 'Base de datos configurada',
    tarifasImportadas: 'Tarifas Vallesglass importadas',
    calculadorOperativo: 'Calculador de vidrios operativo',
    categoriasDisponibles: '7 categorías disponibles',
  },

  // === CALCULADOR DE VIDRIOS ===
  calculador: {
    titulo: 'Calculador de Vidrios',
    error: 'Error',
    seccion1: '1. Medidas',
    seccion2: '2. Especificaciones del Vidrio',
    seccion3: '3. Procesos Adicionales',
    seccionResum: 'Resumen del Presupuesto',
    
    // Medidas
    amplada: 'Ancho (mm)',
    amplada_placeholder: 'Ej: 1000',
    alcada: 'Alto (mm)',
    alcada_placeholder: 'Ej: 1500',
    quantitat: 'Cantidad',
    forma: 'Forma',
    recte: 'Recto',
    inclinat: 'Inclinado',
    m2Unidad: 'm² por unidad',
    m2Total: 'm² total',
    perimetro: 'Perímetro',
    obligatorio: 'obligatorio',

    // Especificaciones
    selectTip: 'Selecciona tipo...',
    selectGruix: 'Selecciona espesor...',
    selectColor: 'Selecciona color...',
    selectProveidor: 'Selecciona proveedor...',
    tipus: 'Tipo',
    gruix: 'Espesor',
    color: 'Color',
    proveidor: 'Proveedor',
    mm: 'mm',

    // Tipos de vidrio
    floatMonolitico: 'Float / Monolítico',
    laminado: 'Laminado',
    temperat: 'Templado',
    laminadoTemperat: 'Laminado/Templado',
    laminadoSentryGlass: 'Laminado Sentry Glass',
    infoSentryGlass: 'Laminado Sentry Glass siempre es templado y se utiliza para marquesinas',

    // Colores
    incoloro: 'INCOLORO',
    verde: 'VERDE',
    grisBronce: 'GRIS/BRONCE',
    mate: 'MATE',
    optico: 'ÓPTICO',
    grisMate: 'GRIS/MATE',

    // Procesos
    cantosLabel: 'Cantos (perímetro automático)',
    cantosDesc: 'Perímetro: {perimetre} ml × {quantitat} = {total} ml',
    puntasLabel: 'Puntas (siempre roma pulida radio 2mm)',
    puntasQuantitat: 'Cantidad de puntas:',
    foratsLabel: 'Agujeros/Taladros',
    foratsDesc: '(solo para vidrios templados)',
    foratsQuantitat: 'Cantidad:',
    foratsDiametre: 'Diámetro (mm):',
    foratsPlaceholder: '11-40',

    // Resumen
    precioLista: 'Precio de lista',
    descuento: 'Descuento',
    precioNeto: 'Precio neto',
    vidreBase: 'Vidrio base',
    procesos: 'Procesos',
    total: 'TOTAL',
    vidrio: 'Vidrio',
    referencia: 'Referencia',
    medidas: 'Medidas',
    detalleProcessos: 'Procesos',

    // Botones
    calcularPrecio: 'Calcular Precio',
    calculando: 'Calculando...',
    limpiar: 'Limpiar',
    guardarPresupuesto: 'Guardar Presupuesto',

    // Errores
    errorMedidas: 'Faltan las medidas del vidrio',
    errorEspecificaciones: 'Falta seleccionar el tipo, espesor o color del vidrio',
    errorForats: 'Si deseas agujeros, especifica cantidad y diámetro',
    errorPuntas: 'Si deseas puntas, especifica la cantidad',
    errorCalculador: 'Error calculando el presupuesto. Comprueba que el vidrio existe en la base de datos.',
    errorCargarProveedores: 'Error cargando proveedores',
  },

  // === ADMINISTRACIÓN ===
  admin: {
    titulo: 'Panel de Administración',
    descripcion: 'Gestiona los datos de presupuestos',
    
    // Gestor Excel
    subirExcel: 'Subir Archivo Excel',
    arrastrar: 'Arrastra el archivo aquí',
    oSelecciona: 'o selecciona uno',
    procesando: 'Procesando...',
    validando: 'Validando...',
    
    // Validador
    previsualizacion: 'Previsualización de Datos',
    datosCargados: 'Datos cargados desde Excel',
    verificarDatos: 'Verificar Datos',
    aceptar: 'Aceptar',
    rechazar: 'Rechazar',
    erroresEncontrados: 'Errores encontrados',
    noHayErrores: 'No hay errores detectados',
    
    // Actualizador
    actualizando: 'Actualizando base de datos...',
    actualizacionExitosa: 'Base de datos actualizada correctamente',
    filasActualizadas: 'filas actualizadas',
    error: 'Error durante la actualización',
    
    // Tabla
    fila: 'Fila',
    error: 'Error',
    campo: 'Campo',
    valor: 'Valor',
    mensaje: 'Mensaje',
  },

  // === MENSAJES GENERALES ===
  mensajes: {
    exito: 'Éxito',
    advertencia: 'Advertencia',
    error: 'Error',
    confirmacion: '¿Estás seguro?',
    operacionExitosa: 'Operación realizada correctamente',
    operacionFallida: 'Error al realizar la operación',
    intenta_nuevamente: 'Intenta nuevamente',
    cancelar: 'Cancelar',
    confirmar: 'Confirmar',
    si: 'Sí',
    no: 'No',
    cargando: 'Cargando...',
    esperando: 'Esperando...',
  },
}

// Función auxiliar para obtener traducciones anidadas
export const obtenerTraduccion = (ruta, variables = {}) => {
  const partes = ruta.split('.')
  let valor = traductiones
  
  for (const parte of partes) {
    valor = valor[parte]
    if (!valor) return ruta // Retorna la ruta si no encuentra la traducción
  }
  
  // Reemplazar variables en el texto
  let texto = typeof valor === 'string' ? valor : ''
  for (const [clave, valorVariable] of Object.entries(variables)) {
    texto = texto.replace(`{${clave}}`, valorVariable)
  }
  
  return texto
}

export default traductiones
