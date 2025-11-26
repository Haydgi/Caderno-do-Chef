-- Script SQL para adicionar campos de recuperação de senha na tabela usuario
-- Execute este script no banco de dados para adicionar os campos necessários

ALTER TABLE usuario 
ADD COLUMN reset_token VARCHAR(255) NULL,
ADD COLUMN reset_token_expiracao DATETIME NULL;

-- Criar índice para melhorar performance nas buscas por token
CREATE INDEX idx_reset_token ON usuario(reset_token);
