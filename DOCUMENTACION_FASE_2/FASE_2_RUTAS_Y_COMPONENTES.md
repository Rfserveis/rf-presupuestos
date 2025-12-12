# 🗺️ FASE 2: RUTAS, COMPONENTS Y FLUJOS

---

## 📍 MAPA DE RUTAS

```
/login                    ← Página inicial
  ├─ Componente: LoginForm
  ├─ Acciones: 
  │   ├─ Login (existente)
  │   ├─ Signup (nuevo)
  │   └─ Reset Password (nuevo)
  └─ Redirect: /dashboard (si OK)

/dashboard               ← Home usuario
  ├─ Componente: DashboardPage
  ├─ Muestra:
  │   ├─ Lista de proyectos
  │   ├─ Botón "Crear Proyecto"
  │   └─ Últimos presupuestos
  └─ Click en proyecto → /proyecto/:id

/proyecto/:id            ← Proyecto abierto
  ├─ Componente: ProyectoPage
  ├─ Muestra:
  │   ├─ Header: [Nombre Cliente] [Nombre Proyecto]
  │   ├─ Sidebar: Iconos categorías
  │   ├─ Area central: Calculador actual
  │   └─ Preview: Presupuesto en vivo
  ├─ Clicks:
  │   ├─ Icono 🪟 → CalculadorVidrios
  │   ├─ Icono ☂️ → CalculadorMarquesinas
  │   ├─ Icono 🛡️ → CalculadorBaraniaAllGlass
  │   ├─ Icono 🔒 → CalculadorBaraniaTopGlass
  │   ├─ Icono 📐 → CalculadorEscaleras
  │   └─ Botón Home → /dashboard
  └─ Click Logout → /login

/admin                   ← Panel administrador
  ├─ Componente: AdminPage
  ├─ Muestra:
  │   ├─ Tabla: Todos los presupuestos
  │   ├─ Filtros:
  │   │   ├─ Por usuario
  │   │   ├─ Por fecha
  │   │   └─ Por estado
  │   ├─ Estadísticas
  │   └─ Acciones:
  │       ├─ Ver detalle
  │       ├─ Descargar PDF
  │       └─ Editar estado
  └─ Click Home → /dashboard

/perfil                  ← Ajustes usuario
  ├─ Componente: PerfilPage
  ├─ Muestra:
  │   ├─ Email
  │   ├─ Nombre
  │   ├─ Teléfono
  │   └─ Botón: Cambiar contraseña
  └─ Click Home → /dashboard

/reset-password/:token   ← Reset de contraseña
  ├─ Componente: ResetPasswordForm
  ├─ Muestra:
  │   ├─ Input: Nueva contraseña
  │   └─ Botón: Guardar
  └─ Redirect: /login (si OK)
```

---

## 🧩 ÁRBOL DE COMPONENTES

### LAYOUT PRINCIPAL

```
<App>
  └─ <ProtectedRoute>
      ├─ <Navbar> (Siempre visible)
      │   ├─ Home Button
      │   └─ Logout Button
      │
      ├─ <Sidebar> (Solo en /proyecto/:id)
      │   └─ Iconos de categorías
      │
      └─ <MainContent>
          ├─ DashboardPage
          ├─ ProyectoPage
          │   └─ [Calculador actual]
          ├─ AdminPage
          └─ PerfilPage
```

### COMPONENTES DETALLADOS

#### Authentication Components
```
<LoginForm>
  ├─ Input email
  ├─ Input password
  ├─ Tabs: [Login] [Signup] [Reset]
  ├─ Botón Login
  ├─ Link "¿Olvidaste contraseña?"
  └─ Link "Crear cuenta"

<SignupForm>
  ├─ Input email
  ├─ Input password
  ├─ Input password confirm
  ├─ Input nombre
  ├─ Validaciones
  └─ Botón "Crear Cuenta"

<ResetPasswordForm>
  ├─ Input email
  ├─ Botón "Enviar Link"
  └─ Mensaje "Revisa tu email"

<NewPasswordForm>
  ├─ Input password
  ├─ Input password confirm
  ├─ Validaciones
  └─ Botón "Actualizar"
```

#### Dashboard Components
```
<DashboardPage>
  ├─ Header: "Mis Proyectos"
  ├─ Botón: "+ Crear Proyecto"
  ├─ <CrearProyectoModal>
  │   ├─ Input nombre cliente
  │   ├─ Input nombre proyecto
  │   └─ Input descripción
  └─ <ListaProyectos>
      └─ Card x N
          ├─ Nombre cliente
          ├─ Total presupuesto
          ├─ Estado
          ├─ Fecha creación
          ├─ Botón Abrir
          └─ Botón Eliminar
```

#### Proyecto Components
```
<ProyectoPage>
  ├─ <ProyectoHeader>
  │   ├─ Nombre Cliente
  │   ├─ Nombre Proyecto
  │   ├─ Estado (dropdown)
  │   └─ Botones: Guardar, Descargar PDF
  │
  ├─ <Sidebar>
  │   ├─ Icono 🪟 Vidrios
  │   ├─ Icono ☂️ Marquesinas
  │   ├─ Icono 🛡️ Barandillas All Glass
  │   ├─ Icono 🔒 Barandillas Top Glass
  │   ├─ Icono 📐 Escaleras D'opera
  │   ├─ Icono 📏 Escaleras RF
  │   └─ Icono 📋 Escaleras Retráctiles
  │
  ├─ <CalculadorArea>
  │   └─ [Componente activo según categoría]
  │
  └─ <PreviewPresupuesto>
      ├─ Tabla de categorías
      ├─ Subtotales por categoría
      ├─ Total final
      └─ Botón "Descargar PDF"
```

#### Calculador Components
```
<CalculadorVidrios>
  ├─ Inputs:
  │   ├─ Cantidad de vidrios
  │   └─ Para cada vidrio:
  │       ├─ Ancho
  │       ├─ Alto
  │       ├─ Espesor
  │       ├─ Tipo (templado/laminado)
  │       └─ Auto-calcula precio
  ├─ Botones:
  │   ├─ "+ Agregar vidrio"
  │   └─ "Guardar"
  └─ Preview:
      ├─ Tabla con items
      └─ Total

<CalculadorMarquesinas>
  ├─ Inputs:
  │   └─ Para cada tram:
  │       ├─ Número de tram
  │       ├─ Ancho
  │       ├─ Profundidad
  │       ├─ Checkbox Tapa derecha
  │       ├─ Checkbox Tapa izquierda
  │       └─ Auto-calcula precio
  ├─ Botones:
  │   ├─ "+ Agregar tram"
  │   └─ "Guardar"
  └─ Preview:
      ├─ Tabla con trams
      └─ Total

<CalculadorBaraniaAllGlass>
  ├─ Inputs:
  │   └─ Para cada tram:
  │       ├─ Número de tram
  │       ├─ Metros lineales
  │       ├─ Altura
  │       ├─ Radio: [Tapes] [Desaigues]
  │       │   ├─ Si Tapes:
  │       │   │   ├─ Checkbox Tapa derecha
  │       │   │   └─ Checkbox Tapa izquierda
  │       │   └─ Si Desaigues:
  │       │       ├─ Input: Número desaigues
  │       │       └─ Auto: Tapes = desaigues * 2
  │       └─ Auto-calcula precio
  ├─ Botones:
  │   ├─ "+ Agregar tram"
  │   └─ "Guardar"
  └─ Preview:
      ├─ Tabla con trams
      └─ Total

<CalculadorEscaleras>
  ├─ Select: Tipo escalera
  │   ├─ D'opera
  │   ├─ RF
  │   └─ Retráctiles
  ├─ Inputs:
  │   ├─ Cantidad
  │   ├─ Ancho
  │   ├─ Largo
  │   ├─ Alto
  │   └─ Material (dropdown)
  ├─ Auto-calcula precio
  ├─ Botón: "Guardar"
  └─ Preview:
      ├─ Detalles escalera
      └─ Total
```

#### Admin Components
```
<AdminPage>
  ├─ Header: "Panel de Administración"
  ├─ Filtros:
  │   ├─ Dropdown: Seleccionar usuario
  │   ├─ DatePicker: Desde fecha
  │   ├─ DatePicker: Hasta fecha
  │   └─ Botón: "Aplicar filtros"
  ├─ <TablaPresupuestos>
  │   ├─ Columnas:
  │   │   ├─ Usuario
  │   │   ├─ Cliente
  │   │   ├─ Proyecto
  │   │   ├─ Estado
  │   │   ├─ Total
  │   │   ├─ Fecha
  │   │   └─ Acciones
  │   ├─ Acciones:
  │   │   ├─ Ver
  │   │   ├─ Descargar PDF
  │   │   ├─ Cambiar estado
  │   │   └─ Eliminar
  │   └─ Paginación
  └─ <EstadísticasAdmin>
      ├─ Total proyectos
      ├─ Total presupuestos
      ├─ Monto total
      └─ Gráfico presupuestos por usuario
```

---

## 🔄 FLUJOS PRINCIPALES

### FLUJO 1: Nuevo Usuario

```
1. User accede a /login
2. Click en tab "Signup"
3. Rellenar:
   - Email
   - Contraseña
   - Contraseña confirm
   - Nombre
4. Click "Crear Cuenta"
5. Validaciones:
   - Email válido
   - Contraseña >= 8 chars
   - Contraseña = Contraseña confirm
   - Email no existe
6. Si OK:
   - Hash contraseña (bcrypt)
   - Guardar en BD
   - Generar JWT token
   - Guardar en localStorage
   - Redirect /dashboard
7. Si ERROR:
   - Mostrar mensaje error
   - Permitir reintentar
```

### FLUJO 2: Usuario Olvida Contraseña

```
1. User click "¿Olvidaste contraseña?"
2. Rellenar email
3. Click "Enviar Link"
4. Sistema:
   - Busca usuario por email
   - Genera token único
   - Guarda en BD (password_reset_tokens)
   - Envía email con link
5. Usuario click en email
6. Link: /reset-password/:token
7. Rellenar nueva contraseña
8. Click "Actualizar"
9. Sistema:
   - Valida token
   - Hash contraseña
   - Actualiza en BD
   - Marca token como usado
   - Redirect /login
```

### FLUJO 3: Crear Proyecto

```
1. User en /dashboard
2. Click "+ Crear Proyecto"
3. Modal se abre
4. Rellenar:
   - Nombre Cliente (obligatorio)
   - Nombre Proyecto (opcional)
   - Descripción (opcional)
5. Click "Crear"
6. Sistema:
   - Valida nombre cliente
   - Crea proyecto en BD
   - Estado = "draft"
   - Redirect /proyecto/:id
7. Usuario ve proyecto vacío
8. Click en categoría (ej: 🪟)
9. Se abre calculador
```

### FLUJO 4: Crear Presupuesto (Vidrios)

```
1. Proyecto abierto (/proyecto/:id)
2. Click icono 🪟 Vidrios
3. Se abre <CalculadorVidrios>
4. Default: 1 vidrio
5. Rellenar:
   - Ancho: 1200 mm
   - Alto: 800 mm
   - Espesor: 6 mm
   - Tipo: Templado
6. Auto-calcula precio basado en:
   - Metros cuadrados
   - Precio por metro
   - Tipo de vidrio
7. Click "+ Agregar vidrio"
8. Nuevo vidrio en blanco
9. Rellenar datos
10. Click "Guardar"
11. Sistema:
    - Valida datos
    - Calcula total
    - Guarda en BD (tabla presupuestos)
    - Actualiza total proyecto
    - Muestra en preview
12. Preview muestra:
    - Tabla de vidrios
    - Total vidrios
```

### FLUJO 5: Crear Presupuesto (Marquesinas)

```
1. Click icono ☂️ Marquesinas
2. Se abre <CalculadorMarquesinas>
3. Default: 1 tram
4. Rellenar:
   - Número tram: 1
   - Ancho: 1500 mm
   - Profundidad: 800 mm
   - Tapa derecha: ☑
   - Tapa izquierda: ☑
5. Auto-calcula:
   - Precio base por m²
   - Precio cada tapa
   - Total = base + tapas
6. Click "+ Agregar tram"
7. Nuevo tram
8. Rellenar igual
9. Click "Guardar"
10. Sistema:
    - Valida cada tram
    - Calcula subtotales
    - Suma total marquesinas
    - Guarda en BD
    - Actualiza total proyecto
11. Preview:
    - Tabla con trams
    - Total marquesinas
```

### FLUJO 6: Presupuesto con Desaigues (Barandillas)

```
1. Click 🛡️ Barandillas All Glass
2. <CalculadorBaraniaAllGlass> abierto
3. Crear tram:
   - Número: 1
   - Metros lineales: 3
   - Altura: 1100 mm
   - Radio: [Tapes] [Desaigues]
4. Si selecciona "Desaigues":
   - Input: Número desaigues: 2
   - Sistema calcula:
     - Tapes necesarias = 2 * 2 = 4
     - Total = precio_base + (precio_tapa * 4)
5. Si selecciona "Tapes":
   - Checkbox Tapa derecha
   - Checkbox Tapa izquierda
   - Total = precio_base + (precio_tapa * 2)
6. Guardar
```

### FLUJO 7: Descargar Presupuesto PDF

```
1. Proyecto con presupuestos guardados
2. Click "Descargar PDF"
3. Sistema:
   - Recopila todos los presupuestos
   - Calcula totales
   - Genera PDF con:
     - Datos cliente
     - Detalles cada categoría
     - Tabla con cálculos
     - Total final
   - Descarga archivo
4. Usuario tiene PDF local
```

### FLUJO 8: Admin Ve Histórico

```
1. User (admin) → /admin
2. Ve tabla con todos los presupuestos
3. Columnas:
   - Usuario
   - Cliente
   - Proyecto
   - Estado
   - Total
   - Fecha
4. Filtros:
   - Seleccionar usuario
   - Rango fechas
5. Click "Aplicar filtros"
6. Tabla se actualiza
7. Acciones:
   - Click "Ver" → abre proyecto
   - Click "PDF" → descarga
   - Click "Estado" → dropdown cambiar
   - Click "Eliminar" → confirmar + elimina
```

---

## 🛠️ SERVICIOS BACKEND

### Estructura Services

```
services/
├── auth.js
│   ├─ signup(email, password, name)
│   ├─ login(email, password)
│   ├─ logout()
│   ├─ resetPassword(email)
│   ├─ newPassword(token, password)
│   ├─ getCurrentUser()
│   └─ isAdmin(user)
│
├── supabase.js
│   └─ Configuración cliente Supabase
│
├── usuarios.js
│   ├─ getUser(id)
│   ├─ updateUser(id, datos)
│   ├─ getAllUsers() [admin]
│   └─ deleteUser(id) [admin]
│
├── proyectos.js
│   ├─ createProyecto(datos)
│   ├─ getProyectos(userId)
│   ├─ getProyecto(id)
│   ├─ updateProyecto(id, datos)
│   ├─ deleteProyecto(id)
│   └─ getAllProyectos() [admin]
│
├── presupuestos.js
│   ├─ createPresupuesto(proyectoId, categoria, datos)
│   ├─ updatePresupuesto(id, datos)
│   ├─ deletePresupuesto(id)
│   ├─ getPresupuestos(proyectoId)
│   └─ getPresupuestosUsuario(userId)
│
├── calculadores.js
│   ├─ calcularVidrios(items)
│   ├─ calcularMarquesinas(trams)
│   ├─ calcularBaraniaAllGlass(trams)
│   ├─ calcularBaraniaTopGlass(trams)
│   ├─ calcularEscaleras(datos)
│   └─ calcularTotal(presupuestos)
│
├── pdf.js
│   ├─ generarPDF(proyecto, presupuestos)
│   └─ descargarPDF(filename)
│
└── historico.js
    ├─ registrarAccion(proyectoId, accion, detalles)
    ├─ obtenerHistorico(proyectoId)
    └─ obtenerHistoricoUsuario(userId)
```

---

## 🧠 CONTEXTS

```
contexts/
├── AuthContext.jsx
│   ├─ user (objeto usuario)
│   ├─ loading
│   ├─ login()
│   ├─ logout()
│   ├─ signup()
│   └─ resetPassword()
│
├── ProyectoContext.jsx
│   ├─ proyectoActual
│   ├─ presupuestos (array)
│   ├─ setProyectoActual()
│   ├─ agregarPresupuesto()
│   ├─ actualizarPresupuesto()
│   ├─ eliminarPresupuesto()
│   └─ calcularTotal()
│
└── UIContext.jsx
    ├─ sidebarAbierto
    ├─ modalAbierto
    ├─ categoriaActual
    ├─ setSidebarAbierto()
    ├─ setModalAbierto()
    └─ setCategoriaActual()
```

---

## ✅ VALIDACIONES

### Validaciones Usuario
- Email: formato válido, único en BD
- Contraseña: >= 8 caracteres, mayúscula, número
- Nombre: requerido, >= 3 caracteres

### Validaciones Proyecto
- Nombre cliente: requerido, <= 255 caracteres
- Nombre proyecto: opcional, <= 255 caracteres

### Validaciones Vidrios
- Ancho: 300-3000 mm
- Alto: 300-3000 mm
- Espesor: 4, 6, 8, 10 mm
- Tipo: templado | laminado

### Validaciones Marquesinas
- Ancho: 500-3000 mm
- Profundidad: 300-2000 mm
- Mínimo 1 tram

### Validaciones Barandillas
- Metros lineales: 0.5-20 m
- Altura: 800-1200 mm
- Desaigues: 1-5 (si aplica)

### Validaciones Escaleras
- Cantidad: 1-10
- Dimensiones: valores reales

---

## 📊 DIAGRAMA ENTIDADES

```
users (1) ───────→ (N) proyectos
                        │
                        ├─→ (N) presupuestos
                        │       ├─ vidrios
                        │       ├─ marquesinas
                        │       ├─ barandillas
                        │       └─ escaleras
                        │
                        └─→ (N) historico_presupuestos

precios_categorias  ←──── presupuestos (consulta)
```

---

Este es el blueprint completo para FASE 2.

**Próximo paso:** Conversación 2 implementará esto.

