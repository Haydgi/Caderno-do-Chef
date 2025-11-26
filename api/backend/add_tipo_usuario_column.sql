-- Script para adicionar a coluna tipo_usuario na tabela usuario
-- Execute este script no seu banco de dados MySQL

USE crud;

-- Verificar se a coluna já existe antes de adicionar
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS tipo_usuario VARCHAR(50) DEFAULT 'Funcionário' NOT NULL;

-- Atualizar usuários existentes (opcional - ajuste conforme necessário)
-- Se você quiser definir o primeiro usuário como Proprietário:
-- UPDATE usuario SET tipo_usuario = 'Proprietário' WHERE ID_Usuario = 1;

-- Verificar a estrutura da tabela
DESCRIBE usuario;
