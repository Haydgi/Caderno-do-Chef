-- ═══════════════════════════════════════════════════════════
-- Migração: Adicionar constraint UNIQUE no campo Email
-- ═══════════════════════════════════════════════════════════
-- Data: 10/12/2025
-- Descrição: Impede cadastro de usuários com emails duplicados
-- ═══════════════════════════════════════════════════════════

USE crud;

-- Verificar se existem emails duplicados antes de aplicar a constraint
SELECT Email, COUNT(*) as total
FROM usuario
GROUP BY Email
HAVING COUNT(*) > 1;

-- Se houver duplicatas, você precisa resolvê-las manualmente antes de prosseguir
-- Exemplo: UPDATE usuario SET Email = 'email_novo@exemplo.com' WHERE ID_Usuario = X;

-- Adicionar constraint UNIQUE no campo Email
ALTER TABLE usuario
ADD CONSTRAINT unique_email UNIQUE (Email);

-- Verificação final
SHOW INDEX FROM usuario WHERE Key_name = 'unique_email';
