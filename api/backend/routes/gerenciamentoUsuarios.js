import express from "express";
import db from "../database/connection.js";
import bcrypt from "bcrypt";
import auth from "../middleware/auth.js";
import { gerenteOuAcima } from "../middleware/permissions.js";

const router = express.Router();

// Middleware para verificar se o usuário é Proprietário
function verificarProprietario(req, res, next) {
  if (req.user.role !== 'Proprietário') {
    return res.status(403).json({ 
      mensagem: "Acesso negado. Apenas proprietários podem acessar este recurso." 
    });
  }
  next();
}

// GET /api/usuarios - Listar usuários
// - Proprietário: lista todos
// - Gerente: lista apenas Funcionários
// - Funcionário: acesso negado
router.get("/usuarios", auth, async (req, res) => {
  try {
    if (req.user.role === 'Funcionário') {
      return res.status(403).json({ mensagem: 'Acesso negado' });
    }

    let query = 'SELECT ID_Usuario, Nome_Usuario, Email, Telefone, tipo_usuario, Data FROM usuario';
    let params = [];
    if (req.user.role === 'Gerente') {
      query += ' WHERE tipo_usuario = ?';
      params.push('Funcionário');
    }

    const [usuarios] = await db.query(query, params);

    return res.status(200).json({
      mensagem: "Usuários listados com sucesso!",
      total: usuarios.length,
      usuarios: usuarios
    });

  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ mensagem: "Erro ao listar usuários." });
  }
});
// GET /api/usuarios/me - Buscar dados do próprio usuário
router.get("/usuarios/me", auth, async (req, res) => {
  try {
    const id = req.user.ID_Usuario;
    const [rows] = await db.query(
      'SELECT ID_Usuario, Nome_Usuario, Email, Telefone, tipo_usuario, Data FROM usuario WHERE ID_Usuario = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    return res.status(200).json({ usuario: rows[0] });
  } catch (error) {
    console.error('Erro no GET /usuarios/me:', error);
    return res.status(500).json({ mensagem: 'Erro ao buscar usuário.' });
  }
});

// PUT /api/usuarios/me - Atualizar dados do próprio usuário (qualquer autenticado, sem alterar papel)
router.put("/usuarios/me", auth, async (req, res) => {
  const id = req.user.ID_Usuario;
  const { nome, email, telefone, senha } = req.body;

  try {
    const [usuarioExistente] = await db.query(
      'SELECT * FROM usuario WHERE ID_Usuario = ?',
      [id]
    );
    if (usuarioExistente.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    // Verificar email duplicado
    if (email && email !== usuarioExistente[0].Email) {
      const [emailDuplicado] = await db.query(
        'SELECT ID_Usuario FROM usuario WHERE Email = ? AND ID_Usuario != ?',
        [email, id]
      );
      if (emailDuplicado.length > 0) {
        return res.status(409).json({ mensagem: "Email já está em uso por outro usuário." });
      }
    }

    let campos = [];
    let valores = [];
    if (nome) { campos.push('Nome_Usuario = ?'); valores.push(nome); }
    if (email) { campos.push('Email = ?'); valores.push(email); }
    if (telefone) { campos.push('Telefone = ?'); valores.push(telefone); }
    if (senha) { const hash = await bcrypt.hash(senha, 10); campos.push('Senha = ?'); valores.push(hash); }

    if (campos.length === 0) return res.status(400).json({ mensagem: "Nenhum campo para atualizar foi fornecido." });
    valores.push(id);
    const query = `UPDATE usuario SET ${campos.join(', ')} WHERE ID_Usuario = ?`;
    const [result] = await db.query(query, valores);
    if (result.affectedRows === 0) return res.status(500).json({ mensagem: "Erro ao atualizar usuário." });

    const [usuarioAtualizado] = await db.query(
      'SELECT ID_Usuario, Nome_Usuario, Email, Telefone, tipo_usuario, Data FROM usuario WHERE ID_Usuario = ?',
      [id]
    );
    return res.status(200).json({ mensagem: "Usuário atualizado com sucesso!", usuario: usuarioAtualizado[0] });
  } catch (error) {
    console.error("Erro ao atualizar próprio usuário:", error);
    return res.status(500).json({ mensagem: "Erro ao atualizar usuário." });
  }
});

// PUT /api/usuarios/:id - Atualizar dados de um usuário (Proprietário; Gerente pode editar Funcionário, sem alterar papel)
router.put("/usuarios/:id", auth, async (req, res) => {
  const { id } = req.params;
  const { nome, email, telefone, papel, senha } = req.body;

  try {
    // Verificar se o usuário existe
    const [usuarioExistente] = await db.query(
      'SELECT * FROM usuario WHERE ID_Usuario = ?',
      [id]
    );

    if (usuarioExistente.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    // Quem está editando
    const editorRole = req.user.role;
    const editorId = req.user.ID_Usuario;

    // Proprietário pode editar qualquer um; Gerente pode editar apenas Funcionário; Funcionário não pode editar terceiros
    const alvoRole = usuarioExistente[0].tipo_usuario;
    if (editorRole === 'Funcionário') {
      return res.status(403).json({ mensagem: 'Apenas gerentes ou proprietários podem editar outros usuários.' });
    }
    if (editorRole === 'Gerente' && alvoRole !== 'Funcionário') {
      return res.status(403).json({ mensagem: 'Gerentes só podem editar usuários Funcionários.' });
    }
    
    // Proprietário: evitar remover seu próprio papel
    if (editorRole === 'Proprietário' && editorId === parseInt(id) && papel && papel !== 'Proprietário') {
      return res.status(400).json({ mensagem: 'Você não pode remover seu próprio papel de Proprietário.' });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== usuarioExistente[0].Email) {
      const [emailDuplicado] = await db.query(
        'SELECT ID_Usuario FROM usuario WHERE Email = ? AND ID_Usuario != ?',
        [email, id]
      );

      if (emailDuplicado.length > 0) {
        return res.status(409).json({ mensagem: "Email já está em uso por outro usuário." });
      }
    }

    // Construir query dinâmica baseada nos campos fornecidos
    let campos = [];
    let valores = [];

    if (nome) {
      campos.push('Nome_Usuario = ?');
      valores.push(nome);
    }
    if (email) {
      campos.push('Email = ?');
      valores.push(email);
    }
    if (telefone) {
      campos.push('Telefone = ?');
      valores.push(telefone);
    }
    if (papel) {
      // Apenas Proprietário pode alterar papel
      if (editorRole !== 'Proprietário') {
        return res.status(403).json({ mensagem: 'Apenas proprietários podem alterar papéis de usuários.' });
      }
      const papeisValidos = ['Proprietário', 'Gerente', 'Funcionário'];
      if (!papeisValidos.includes(papel)) {
        return res.status(400).json({ mensagem: 'Papel inválido. Use: Proprietário, Gerente ou Funcionário.' });
      }
      campos.push('tipo_usuario = ?');
      valores.push(papel);
    }
    if (senha) {
      const senhaCriptografada = await bcrypt.hash(senha, 10);
      campos.push('Senha = ?');
      valores.push(senhaCriptografada);
    }

    if (campos.length === 0) {
      return res.status(400).json({ mensagem: "Nenhum campo para atualizar foi fornecido." });
    }

    valores.push(id);

    const query = `UPDATE usuario SET ${campos.join(', ')} WHERE ID_Usuario = ?`;
    const [result] = await db.query(query, valores);

    if (result.affectedRows === 0) {
      return res.status(500).json({ mensagem: "Erro ao atualizar usuário." });
    }

    // Buscar dados atualizados
    const [usuarioAtualizado] = await db.query(
      'SELECT ID_Usuario, Nome_Usuario, Email, Telefone, tipo_usuario, Data FROM usuario WHERE ID_Usuario = ?',
      [id]
    );

    return res.status(200).json({
      mensagem: "Usuário atualizado com sucesso!",
      usuario: usuarioAtualizado[0]
    });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: "Email já cadastrado!" });
    }
    
    return res.status(500).json({ mensagem: "Erro ao atualizar usuário." });
  }
});

// DELETE /api/usuarios/:id - Excluir um usuário
router.delete("/usuarios/:id", auth, verificarProprietario, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o usuário existe
    const [usuarioExistente] = await db.query(
      'SELECT tipo_usuario FROM usuario WHERE ID_Usuario = ?',
      [id]
    );

    if (usuarioExistente.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    // Impedir que o proprietário delete a si mesmo
    if (req.user.ID_Usuario === parseInt(id)) {
      return res.status(400).json({ 
        mensagem: "Você não pode excluir sua própria conta." 
      });
    }

    // Verificar se é o último proprietário
    if (usuarioExistente[0].tipo_usuario === 'Proprietário') {
      const [proprietarios] = await db.query(
        'SELECT COUNT(*) as total FROM usuario WHERE tipo_usuario = ?',
        ['Proprietário']
      );

      if (proprietarios[0].total <= 1) {
        return res.status(400).json({ 
          mensagem: "Não é possível excluir o último proprietário do sistema." 
        });
      }
    }

    // Excluir usuário
    const [result] = await db.query(
      'DELETE FROM usuario WHERE ID_Usuario = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ mensagem: "Erro ao excluir usuário." });
    }

    return res.status(200).json({
      mensagem: "Usuário excluído com sucesso!"
    });

  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    
    // Verificar se há constraint de foreign key
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ 
        mensagem: "Não é possível excluir este usuário pois possui dados associados no sistema." 
      });
    }
    
    return res.status(500).json({ mensagem: "Erro ao excluir usuário." });
  }
});

export default router;
