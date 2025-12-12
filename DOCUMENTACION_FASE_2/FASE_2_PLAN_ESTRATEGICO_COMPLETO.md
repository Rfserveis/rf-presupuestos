# 🎯 FASE 2: PLAN ESTRATÉGICO COMPLETO

**RF Presupuestos - Arquitectura y Roadmap Detallado**

---

## 📊 VISIÓN GENERAL

### Estado Actual (Fin FASE 1)
```
✅ Login básico
✅ 2 roles (usuario/admin)
✅ Calculador Vidrios simple
✅ Interface en español
❌ No hay BD real
❌ No se guardan presupuestos
❌ No hay multi-categoría
```

### Estado Fin FASE 2
```
✅ Autenticación completa (signup/login/reset password)
✅ BD Supabase con usuarios y presupuestos
✅ Sistema de Proyectos/Clientes
✅ Multi-categoría por proyecto (Vidrios + Marquesinas + Barandillas + Escaleras)
✅ Registro histórico de presupuestos
✅ Vista admin con todos los presupuestos
✅ Preview en vivo de cálculos
✅ Descarga PDF de presupuestos
✅ Interface rediseñada con navegación por iconos
```

---

## 🗺️ ROADMAP DETALLADO

### FASE 2A: AUTENTICACIÓN + BD (Conversación 2)
**Tiempo estimado: 4-5 horas**

#### Tareas:
1. Crear schema BD Supabase
2. Implementar Signup
3. Implementar Login mejorado
4. Implementar "Forgot Password"
5. Hashear contraseñas
6. Gestión de sesiones

#### Tecnología:
- Supabase Auth + Custom Users Table
- bcrypt para hashing
- JWT tokens
- Session management

---

### FASE 2B: ESTRUCTURA PROYECTOS (Conversación 3)
**Tiempo estimado: 6-8 horas**

#### Tareas:
1. Crear modelo Proyecto
2. CRUD Proyectos
3. Seleccionar proyecto
4. Multi-categoría dentro de proyecto
5. Almacenar múltiples cálculos por proyecto

#### Tecnología:
- Relaciones BD: usuario → proyecto → categorías

---

### FASE 2C: CATEGORÍAS MULTI-CÁLCULO (Conversación 3-4)
**Tiempo estimado: 6-8 horas**

#### Tareas:
1. Vidrios - múltiples unidades
2. Marquesinas - trams + tapes
3. Barandillas All Glass - trams + tapes/desaigues
4. Barandillas Top Glass - similar
5. Escaleras (3 tipos)
6. Lógica de suma por categoría

---

### FASE 2D: INTERFACE REDISEÑADA (Conversación 4)
**Tiempo estimado: 4-5 horas**

#### Tareas:
1. Home optimizado
2. Sidebar con iconos de categorías
3. Context visual del proyecto
4. Botones home + logout siempre visibles
5. Navegación mejorada

---

### FASE 2E: REGISTRE HISTÓRICO (Conversación 4-5)
**Tiempo estimado: 3-4 horas**

#### Tareas:
1. Guardar presupuestos en BD
2. Histórico usuario
3. Vista admin de todos
4. Editar/eliminar presupuestos
5. Búsqueda y filtros

---

### FASE 2F: PDF + PREVIEW (Conversación 5)
**Tiempo estimado: 3-4 horas**

#### Tareas:
1. Preview en vivo
2. Generación PDF
3. Download presupuesto
4. Estilos para impresión

---

## 🗄️ SCHEMA DE BASE DE DATOS

```sql
-- TABLA: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'user' | 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: proyectos
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  nombre_cliente VARCHAR(255) NOT NULL,
  nombre_proyecto VARCHAR(255),
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'draft', -- 'draft' | 'completed' | 'sent'
  total_presupuesto DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, nombre_cliente)
);

-- TABLA: presupuestos (cálculos por categoría)
CREATE TABLE presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL, -- 'vidrios' | 'marquesinas' | etc
  datos JSONB NOT NULL, -- Estructura depende de categoría
  subtotal DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: histórico (auditoría)
CREATE TABLE historico_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id),
  usuario_id UUID REFERENCES users(id),
  accion VARCHAR(50), -- 'created' | 'updated' | 'deleted'
  detalles JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: configuración de precios
CREATE TABLE precios_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria VARCHAR(50),
  tipo VARCHAR(100), -- ej: 'vidrio_espesor_6mm'
  precio_unitario DECIMAL(10,2),
  unidad VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📂 ESTRUCTURA DE CARPETAS (Nueva)

```
src/
├── App.jsx
├── pages/
│   ├── LoginPage.jsx           (mejorado con signup/reset)
│   ├── DashboardPage.jsx       (home + seleccionar proyecto)
│   ├── ProyectoPage.jsx        (vista principal proyecto)
│   ├── AdminPage.jsx           (histórico admin)
│   └── PerfilPage.jsx          (ajustes usuario)
│
├── components/
│   ├── Auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   └── ResetPasswordForm.jsx
│   │
│   ├── Proyectos/
│   │   ├── CrearProyecto.jsx
│   │   ├── ListaProyectos.jsx
│   │   └── ProyectoHeader.jsx
│   │
│   ├── Calculadores/
│   │   ├── CalculadorVidrios.jsx
│   │   ├── CalculadorMarquesinas.jsx
│   │   ├── CalculadorBaraniaAllGlass.jsx
│   │   ├── CalculadorBaraniaTopGlass.jsx
│   │   └── CalculadorEscaleras.jsx
│   │
│   ├── Common/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── PreviewPresupuesto.jsx
│   │   └── DownloadPDF.jsx
│   │
│   └── Admin/
│       ├── TablaPresupuestos.jsx
│       ├── FiltroUsuarios.jsx
│       └── EstadísticasAdmin.jsx
│
├── services/
│   ├── auth.js          (signup/login/reset)
│   ├── supabase.js      (cliente Supabase)
│   ├── usuarios.js      (CRUD usuarios)
│   ├── proyectos.js     (CRUD proyectos)
│   ├── presupuestos.js  (CRUD presupuestos)
│   ├── calculadores.js  (lógica de cálculos)
│   ├── pdf.js           (generación PDF)
│   └── historico.js     (auditoría)
│
├── context/
│   ├── AuthContext.jsx      (user, login, logout)
│   ├── ProyectoContext.jsx  (proyecto actual)
│   └── PresupuestoContext.jsx (datos presupuesto)
│
├── hooks/
│   ├── useAuth.js
│   ├── useProyecto.js
│   └── usePresupuesto.js
│
├── utils/
│   ├── validations.js   (email, password, etc)
│   ├── formatters.js    (dinero, fechas)
│   ├── constantes.js    (precios, tamaños)
│   └── helpers.js       (funciones comunes)
│
└── locales/
    └── es.js            (traducciones actualizadas)
```

---

## 🔐 FLUJO DE AUTENTICACIÓN

```
Usuario Nuevo
    ↓
Signup Form
  ├─ Email
  ├─ Contraseña (validar)
  ├─ Nombre
  └─ Rol (siempre 'user')
    ↓
Hash Contraseña (bcrypt)
    ↓
Guardar en BD Supabase
    ↓
Login automático
    ↓
Dashboard


Usuario Existente
    ↓
Login Form
  ├─ Email
  └─ Contraseña
    ↓
Buscar usuario en BD
    ↓
Comparar contraseña (bcrypt)
    ↓
Generar JWT Token
    ↓
Guardar en localStorage
    ↓
Redirect Dashboard


Forgot Password
    ↓
Email input
    ↓
Enviar email reset (Supabase)
    ↓
Usuario hace click en link
    ↓
Nueva contraseña
    ↓
Hash + Guardar BD
    ↓
Redirect Login
```

---

## 🎯 FLUJO DE PROYECTOS

```
Dashboard (Home)
    ↓
"Crear Nuevo Proyecto"
    ↓
Form:
  ├─ Nombre Cliente (requerido)
  ├─ Nombre Proyecto (opcional)
  └─ Descripción (opcional)
    ↓
Crear en BD
    ↓
Redirect a Proyecto


Proyecto Abierto
    ↓
Header: [Nombre Cliente] [Proyecto]
    ↓
Sidebar con Categorías:
  ├─ 🪟 Vidrios
  ├─ ☂️ Marquesinas
  ├─ 🛡️ Barandillas All Glass
  ├─ 🔒 Barandillas Top Glass
  ├─ 📐 Escaleras D'opera
  ├─ 📏 Escaleras RF
  └─ 📋 Escaleras Retráctiles
    ↓
Click en categoría
    ↓
Abrir calculador
```

---

## 📐 LÓGICA DE CATEGORÍAS

### VIDRIOS
```json
{
  "categoria": "vidrios",
  "cantidad": 3,
  "items": [
    {
      "id": "vid_1",
      "ancho": 1200,
      "alto": 800,
      "espesor": 6,
      "tipo": "templado",
      "precio_unitario": 50,
      "subtotal": 50
    }
  ],
  "total": 150
}
```

### MARQUESINAS
```json
{
  "categoria": "marquesinas",
  "trams": [
    {
      "id": "mar_1",
      "numero_tram": 1,
      "ancho": 1500,
      "profundidad": 800,
      "tapa_derecha": true,
      "tapa_izquierda": true,
      "precio_unitario": 500,
      "subtotal": 500
    }
  ],
  "total": 500
}
```

### BARANDILLAS ALL GLASS
```json
{
  "categoria": "barandilla_all_glass",
  "trams": [
    {
      "id": "bar_1",
      "numero_tram": 1,
      "metros_lineales": 3,
      "altura": 1100,
      "tipo_cierre": "tapes", // 'tapes' | 'desaigues'
      "tapa_derecha": true,
      "tapa_izquierda": true,
      "desaigues": 0,
      "precio_unitario": 400,
      "subtotal": 400
    }
  ],
  "total": 400
}
```

### BARANDILLAS ALL GLASS (Con Desaigues)
```json
{
  "categoria": "barandilla_all_glass",
  "trams": [
    {
      "numero_tram": 1,
      "metros_lineales": 3,
      "altura": 1100,
      "tipo_cierre": "desaigues",
      "num_desaigues": 2,
      "tapes_por_desaigues": 4, // 2 * 2
      "precio_unitario": 400,
      "subtotal": 400
    }
  ],
  "total": 400
}
```

### ESCALERAS
```json
{
  "categoria": "escaleras_operetta",
  "modelo": "operetta",
  "cantidad": 1,
  "dimensiones": {
    "ancho": 600,
    "largo": 800,
    "alto": 2400
  },
  "materiales": "aluminio",
  "precio_unitario": 1200,
  "subtotal": 1200,
  "total": 1200
}
```

---

## 💾 EN ESTA CONVERSACIÓN

Voy a crear:

1. **`FASE_2_SCHEMA_BD.sql`** - Script SQL completo
2. **`FASE_2_ESTRUCTURA_CARPETAS.md`** - Detalles estructura
3. **`FASE_2_COMPONENTES_TEMPLATE.jsx`** - Templates para cada componente
4. **`FASE_2_SERVICIOS_TEMPLATE.js`** - Templates para cada servicio
5. **`FASE_2_CONTEXTS.jsx`** - Templates para contexts
6. **`FASE_2_RUTAS_Y_COMPONENTES.md`** - Diagrama de rutas
7. **`ROADMAP_CONVERSACIONES_2_A_5.md`** - Plan detallado siguiente

---

## 🎓 PRÓXIMAS CONVERSACIONES

### Conversación 2: Autenticación + BD (4-5 horas)
- Crear BD en Supabase
- Implementar signup completo
- Implementar login mejorado
- Implementar reset password
- Testing

### Conversación 3: Proyectos + Categorías (6-8 horas)
- CRUD de proyectos
- Crear calculadores por categoría
- Guardar en BD
- Lógica de multi-categoría

### Conversación 4: Interface + Registre (4-5 horas)
- Rediseño interface
- Sidebar con iconos
- Histórico presupuestos
- Vista admin

### Conversación 5: PDF + Refinamientos (3-4 horas)
- Preview presupuestos
- Generación PDF
- Descargas
- Polish final

---

## ✅ ESTA CONVERSACIÓN (PLAN + BD)

### Deliverables
1. ✅ Este plan (FASE_2_PLAN_ESTRATEGICO_COMPLETO.md)
2. ✅ Schema SQL (FASE_2_SCHEMA_BD.sql)
3. ✅ Estructura carpetas detallada
4. ✅ Templates componentes
5. ✅ Templates servicios
6. ✅ Diagrama arquitectura
7. ✅ Roadmap siguiente

### Status
```
FASE 1: ✅ COMPLETADA (Documentada)
FASE 2A: ⏳ POR HACER (Conversación 2)
FASE 2B-F: ⏳ POR HACER (Conversaciones 3-5)
FASE 3: ⏳ POR HACER (Posterior)
FASE 4: ⏳ POR HACER (Posterior)
```

---

## 🚀 PRÓXIMO PASO

¿Continuamos con el resto del plan en esta conversación?

Voy a generar:
1. Schema SQL completo
2. Templates componentes
3. Diagrama rutas
4. Estructura detallada

¿Vamos?


