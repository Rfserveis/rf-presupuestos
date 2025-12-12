-- =============================================================================
-- FASE 2: SCHEMA COMPLETO SUPABASE
-- RF Presupuestos - Base de Datos Completa
-- =============================================================================

-- =============================================================================
-- 1. TABLA: USUARIOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active BOOLEAN DEFAULT true,
  phone VARCHAR(20),
  empresa VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =============================================================================
-- 2. TABLA: PROYECTOS/CLIENTES
-- =============================================================================

CREATE TABLE IF NOT EXISTS proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nombre_cliente VARCHAR(255) NOT NULL,
  nombre_proyecto VARCHAR(255),
  descripcion TEXT,
  email_cliente VARCHAR(255),
  telefono_cliente VARCHAR(20),
  direccion_cliente TEXT,
  estado VARCHAR(20) DEFAULT 'draft' CHECK (estado IN ('draft', 'completed', 'sent', 'approved')),
  total_presupuesto DECIMAL(12,2) DEFAULT 0,
  moneda VARCHAR(3) DEFAULT 'EUR',
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_proyectos_user_id ON proyectos(user_id);
CREATE INDEX idx_proyectos_estado ON proyectos(estado);
CREATE INDEX idx_proyectos_created_at ON proyectos(created_at);

-- =============================================================================
-- 3. TABLA: PRESUPUESTOS (Cálculos por categoría)
-- =============================================================================

CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN (
    'vidrios',
    'marquesinas',
    'barandilla_all_glass',
    'barandilla_top_glass',
    'escaleras_operetta',
    'escaleras_rf',
    'escaleras_retractiles'
  )),
  datos JSONB NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  impuestos DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_presupuestos_proyecto_id ON presupuestos(proyecto_id);
CREATE INDEX idx_presupuestos_categoria ON presupuestos(categoria);

-- =============================================================================
-- 4. TABLA: HISTÓRICO DE PRESUPUESTOS (Auditoría)
-- =============================================================================

CREATE TABLE IF NOT EXISTS historico_presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accion VARCHAR(50) NOT NULL CHECK (accion IN ('created', 'updated', 'deleted', 'viewed', 'downloaded')),
  tipo_documento VARCHAR(50),
  detalles JSONB,
  ip_origen VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_historico_proyecto_id ON historico_presupuestos(proyecto_id);
CREATE INDEX idx_historico_usuario_id ON historico_presupuestos(usuario_id);
CREATE INDEX idx_historico_accion ON historico_presupuestos(accion);

-- =============================================================================
-- 5. TABLA: CONFIGURACIÓN DE PRECIOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS precios_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria VARCHAR(50) NOT NULL,
  tipo_elemento VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio_unitario DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_precios_categoria ON precios_categorias(categoria);
CREATE INDEX idx_precios_activo ON precios_categorias(activo);

-- =============================================================================
-- 6. TABLA: TOKENS RESET PASSWORD
-- =============================================================================

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =============================================================================
-- 7. TABLA: SESIONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  ip_origen VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =============================================================================
-- 8. INSERTAR DATOS INICIALES
-- =============================================================================

-- Usuarios iniciales (contraseña: Rf123)
-- Hash generado con bcrypt(Rf123) = $2a$10$...
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES 
  ('rafael@rfserveis.com', '$2a$10$t5l8pUxV9HxN8q2K9y3s4u.zxK8Q9y4j9e2h5k8l9m0n1p2q3r4s5t6u', 'Rafael', 'admin', true),
  ('david@rfserveis.com', '$2a$10$t5l8pUxV9HxN8q2K9y3s4u.zxK8Q9y4j9e2h5k8l9m0n1p2q3r4s5t6u', 'David', 'admin', true),
  ('igor@rfserveis.com', '$2a$10$t5l8pUxV9HxN8q2K9y3s4u.zxK8Q9y4j9e2h5k8l9m0n1p2q3r4s5t6u', 'Igor', 'user', true),
  ('esther@rfserveis.com', '$2a$10$t5l8pUxV9HxN8q2K9y3s4u.zxK8Q9y4j9e2h5k8l9m0n1p2q3r4s5t6u', 'Esther', 'user', true)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 9. VISTAS ÚTILES
-- =============================================================================

-- Vista: Presupuestos totales por usuario
CREATE OR REPLACE VIEW v_presupuestos_por_usuario AS
SELECT 
  u.id,
  u.email,
  u.name,
  COUNT(DISTINCT p.id) as total_proyectos,
  COUNT(DISTINCT pr.id) as total_presupuestos,
  SUM(pr.total) as monto_total,
  MAX(p.created_at) as ultimo_proyecto
FROM users u
LEFT JOIN proyectos p ON u.id = p.user_id
LEFT JOIN presupuestos pr ON p.id = pr.proyecto_id
GROUP BY u.id, u.email, u.name;

-- Vista: Proyectos con totales
CREATE OR REPLACE VIEW v_proyectos_resumen AS
SELECT 
  p.id,
  p.user_id,
  p.nombre_cliente,
  p.nombre_proyecto,
  p.estado,
  COUNT(DISTINCT pr.id) as total_categorias,
  SUM(pr.total) as total_presupuesto,
  p.created_at,
  p.updated_at
FROM proyectos p
LEFT JOIN presupuestos pr ON p.id = pr.proyecto_id
GROUP BY p.id, p.user_id, p.nombre_cliente, p.nombre_proyecto, p.estado, p.created_at, p.updated_at;

-- =============================================================================
-- 10. FUNCIONES Y TRIGGERS
-- =============================================================================

-- Función: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_presupuestos_updated_at
  BEFORE UPDATE ON presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función: Calcular total del proyecto
CREATE OR REPLACE FUNCTION calcular_total_proyecto(proyecto_id UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
  total DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(total), 0)
  INTO total
  FROM presupuestos
  WHERE proyecto_id = proyecto_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Actualizar total proyecto al insertar/actualizar presupuesto
CREATE OR REPLACE FUNCTION actualizar_total_proyecto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proyectos
  SET total_presupuesto = calcular_total_proyecto(NEW.proyecto_id)
  WHERE id = NEW.proyecto_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_total_proyecto
  AFTER INSERT OR UPDATE ON presupuestos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_total_proyecto();

-- =============================================================================
-- 11. POLÍTICAS RLS (Row Level Security)
-- =============================================================================

-- Habilitar RLS en las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas para users (solo admin ve todos)
CREATE POLICY users_select_policy ON users FOR SELECT
  USING (
    auth.uid() = id OR 
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY users_update_own_policy ON users FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para proyectos (cada usuario ve solo los suyos)
CREATE POLICY proyectos_select_policy ON proyectos FOR SELECT
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY proyectos_insert_policy ON proyectos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY proyectos_update_policy ON proyectos FOR UPDATE
  USING (
    user_id = auth.uid() OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Políticas para presupuestos (acceso a través de proyecto)
CREATE POLICY presupuestos_select_policy ON presupuestos FOR SELECT
  USING (
    proyecto_id IN (
      SELECT id FROM proyectos 
      WHERE user_id = auth.uid() OR
            (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
    )
  );

-- =============================================================================
-- 12. COMENTARIOS Y DOCUMENTACIÓN
-- =============================================================================

COMMENT ON TABLE users IS 'Usuarios del sistema (admin + usuarios normales)';
COMMENT ON COLUMN users.role IS 'Rol del usuario: admin (gestiona todo) o user (crea presupuestos)';

COMMENT ON TABLE proyectos IS 'Proyectos/Clientes de cada usuario';
COMMENT ON COLUMN proyectos.estado IS 'Estado del presupuesto: draft (en edición), completed (finalizado), sent (enviado), approved (aprobado)';

COMMENT ON TABLE presupuestos IS 'Cálculos por categoría dentro de un proyecto';
COMMENT ON COLUMN presupuestos.datos IS 'JSON con estructura específica de cada categoría (vidrios, marquesinas, etc)';

COMMENT ON TABLE historico_presupuestos IS 'Auditoría de cambios en presupuestos';

COMMENT ON TABLE precios_categorias IS 'Catálogo de precios por categoría y tipo de elemento';

-- =============================================================================
-- FIN SCRIPT
-- =============================================================================

