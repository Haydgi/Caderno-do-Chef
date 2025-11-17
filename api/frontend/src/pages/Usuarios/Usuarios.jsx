import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { UsersAPI } from "../../api/users";
import Navbar from "../../components/Navbar/Navbar";
import { toast } from "react-toastify";
import styles from "./Usuarios.module.css";
import itensStyles from "../CadastroSistema/Itens.module.css";
import modalStyles from "../../components/Modals/ModalCadastroIngrediente/ModalCadastroIngrediente.module.css";

// Utility: read role to conditionally render (defense-in-depth; server also enforces)
const getRole = () => localStorage.getItem("role");
const ROLES = ["Proprietário", "Gerente", "Funcionário"];

export default function Usuarios() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  // Meu Perfil state
  const [meLoading, setMeLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [meForm, setMeForm] = useState({ nome: "", email: "", telefone: "", senha: "", confirmarSenha: "" });
  const [meSaving, setMeSaving] = useState(false);

  // Edit modal state
  const [editing, setEditing] = useState(null); // user object being edited
  const [form, setForm] = useState({ nome: "", email: "", telefone: "", papel: "", senha: "", confirmarSenha: "" });
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleting, setDeleting] = useState(null); // user object to delete
  const [removing, setRemoving] = useState(false);

  const role = getRole();
  const userId = localStorage.getItem("userId");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await UsersAPI.list();
      setUsers(data.usuarios || []);
    } catch (e) {
      const msg = e?.response?.data?.mensagem || "Erro ao carregar usuários.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // manter o ingredientes-bg por trás do cadernohorizontal
    document.body.classList.add('usuarios-page');
    if (role !== "Funcionário") {
      fetchUsers();
    } else {
      setLoading(false);
    }
    // Carregar Meu Perfil
    (async () => {
      setMeLoading(true);
      try {
        const data = await UsersAPI.getMe();
        const perfil = data?.usuario || data; // suporte a {usuario} ou objeto direto
        setMe(perfil);
        setMeForm({
          nome: perfil?.Nome_Usuario || "",
          email: perfil?.Email || "",
          telefone: perfil?.Telefone || "",
          senha: "",
          confirmarSenha: "",
        });
      } catch (e) {
        const msg = e?.response?.data?.mensagem || "Erro ao carregar seu perfil.";
        toast.error(msg);
      } finally {
        setMeLoading(false);
      }
    })();
    return () => {
      document.body.classList.remove('usuarios-page');
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u =>
      String(u.Nome_Usuario || "").toLowerCase().includes(q) ||
      String(u.Email || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const startEdit = (u) => {
    setEditing(u);
    setForm({
      nome: u.Nome_Usuario || "",
      email: u.Email || "",
      telefone: u.Telefone || "",
      papel: u.tipo_usuario || "Funcionário",
      senha: "",
      confirmarSenha: "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ nome: "", email: "", telefone: "", papel: "", senha: "", confirmarSenha: "" });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.nome?.trim() || !form.email?.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    if (form.senha && form.senha !== form.confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    const payload = {
      nome: form.nome.trim(),
      email: form.email.trim(),
      telefone: form.telefone?.trim() || null,
      papel: form.papel,
    };
    if (form.senha?.length) payload.senha = form.senha;

    setSaving(true);
    try {
      await UsersAPI.update(editing.ID_Usuario, payload);
      toast.success("Usuário atualizado com sucesso.");
      await fetchUsers();
      cancelEdit();
    } catch (e) {
      const msg = e?.response?.data?.mensagem || "Erro ao salvar alterações.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (u) => setDeleting(u);
  const cancelDelete = () => setDeleting(null);
  const doDelete = async () => {
    if (!deleting) return;
    setRemoving(true);
    try {
      await UsersAPI.remove(deleting.ID_Usuario);
      toast.success("Usuário excluído com sucesso.");
      await fetchUsers();
      cancelDelete();
    } catch (e) {
      const msg = e?.response?.data?.mensagem || "Erro ao excluir usuário.";
      toast.error(msg);
    } finally {
      setRemoving(false);
    }
  };

  // UI gating helpers
  const canEditRow = (u) => {
    if (role === "Proprietário") return true;
    if (role === "Gerente") return u.tipo_usuario === "Funcionário" && String(u.ID_Usuario) !== String(userId);
    // Funcionário não edita via tabela (usa Meu Perfil)
    return false;
  };

  const canDeleteRow = (u) => {
    if (role !== "Proprietário") return false;
    return String(u.ID_Usuario) !== String(userId);
  };

  // Meu Perfil save
  const saveMe = async () => {
    if (!meForm.nome?.trim() || !meForm.email?.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    if (meForm.senha && meForm.senha !== meForm.confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    const payload = {
      nome: meForm.nome.trim(),
      email: meForm.email.trim(),
      telefone: meForm.telefone?.trim() || null,
    };
    if (meForm.senha?.length) payload.senha = meForm.senha;
    setMeSaving(true);
    try {
      await UsersAPI.updateMe(payload);
      toast.success("Perfil atualizado com sucesso.");
      // Atualiza estado base
      setMe((prev) => ({ ...prev, Nome_Usuario: payload.nome, Email: payload.email, Telefone: payload.telefone }));
      setMeForm({ ...meForm, senha: "", confirmarSenha: "" });
    } catch (e) {
      const msg = e?.response?.data?.mensagem || "Erro ao salvar perfil.";
      toast.error(msg);
    } finally {
      setMeSaving(false);
    }
  };

  const resetMe = () => {
    if (!me) return;
    setMeForm({
      nome: me?.Nome_Usuario || "",
      email: me?.Email || "",
      telefone: me?.Telefone || "",
      senha: "",
      confirmarSenha: "",
    });
  };

  return (
    <>
    <Navbar />
    <div className={itensStyles.pageContent}>
      <div className="container mt-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className={`${itensStyles.title} m-0`}>Configurações de Usuários</h2>
        <div className="d-flex align-items-center">
          <div className={itensStyles.searchBarContainer}>
            <input
              type="text"
              className={`form-control ${itensStyles.searchBar} me-2`}
              placeholder="Pesquise aqui..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-white">Carregando...</div>
      ) : (
        role !== "Funcionário" ? (
        <div className={styles.costPanel}>
          <div className={styles.costPanelHeader}>
            <h5 className="mb-0">Usuários</h5>
          </div>
          <div className={styles.costPanelBody}>
          <div className={`${styles.tableRounded}`}>
          <div className={`table-responsive ${styles.scrollArea}`}>
          <table className={`table align-middle ${styles.tableViolet} mb-0`}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Cargo</th>
                <th>Data</th>
                {(role === "Proprietário" || role === "Gerente") && (
                  <th style={{ width: 160 }}>Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={(role === "Proprietário" || role === "Gerente") ? 7 : 6} className="text-center text-white-50 py-4">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.ID_Usuario}>
                  <td>{u.ID_Usuario}</td>
                  <td>{u.Nome_Usuario}</td>
                  <td>{u.Email}</td>
                  <td>{u.Telefone || "-"}</td>
                  <td>{u.tipo_usuario}</td>
                  <td>{u.Data ? new Date(u.Data).toLocaleDateString() : "-"}</td>
                  {(role === "Proprietário" || role === "Gerente") && (
                    <td>
                      <div className="d-flex gap-2">
                        {canEditRow(u) && (
                          <button
                            className={`${modalStyles.btnSave} ${styles.btnSaveBlue} ${styles.btnCompact}`}
                            onClick={() => startEdit(u)}
                            title="Editar usuário"
                          >
                            Editar
                          </button>
                        )}
                        {canDeleteRow(u) && (
                          <button
                            className={`${modalStyles.btnCancel} ${styles.btnCompact}`}
                            onClick={() => confirmDelete(u)}
                            title="Excluir usuário"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          </div>
          </div>
        </div>
        ) : null
      )}

      {/* Meu Perfil - agora após a lista de usuários */}
      <div className={`${styles.costPanel} mt-4`}>
        <div className={styles.costPanelHeader}>
          <h5 className="mb-0">Meu Perfil</h5>
        </div>
        <div className={styles.costPanelBody}>
          {meLoading ? (
            <div className="text-white-50">Carregando seu perfil...</div>
          ) : (
            <div className={modalStyles.formGrid}>
              <div className={`${modalStyles.formGroup} ${modalStyles.colSpan2}`}>
                <label>Nome</label>
                <input className="form-control" value={meForm.nome} onChange={(e) => setMeForm({ ...meForm, nome: e.target.value })} />
              </div>
              <div className={`${modalStyles.formGroup} ${modalStyles.colSpan2}`}>
                <label>E-mail</label>
                <input type="email" className="form-control" value={meForm.email} onChange={(e) => setMeForm({ ...meForm, email: e.target.value })} />
              </div>
              <div className={modalStyles.formGroup}>
                <label>Telefone</label>
                <input className="form-control" value={meForm.telefone} onChange={(e) => setMeForm({ ...meForm, telefone: e.target.value })} />
              </div>
              <div className={modalStyles.formGroup}>
                <label>Seu cargo</label>
                <input className="form-control" value={role || me?.tipo_usuario || "-"} disabled />
              </div>
              <div className={modalStyles.formGroup}>
                <label>Senha (opcional)</label>
                <input type="password" className="form-control" value={meForm.senha} onChange={(e) => setMeForm({ ...meForm, senha: e.target.value })} />
              </div>
              <div className={modalStyles.formGroup}>
                <label>Confirmar senha</label>
                <input type="password" className="form-control" value={meForm.confirmarSenha} onChange={(e) => setMeForm({ ...meForm, confirmarSenha: e.target.value })} />
              </div>
              <div className={`${modalStyles.formGroup} ${modalStyles.colSpan2}`}>
                <div className="d-flex gap-2">
                  <button className={modalStyles.btnSave} onClick={saveMe} disabled={meSaving}>
                    {meSaving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && createPortal(
        (
          <div className={`${modalStyles.modalOverlay} ${styles.overlayTop}`}>
            <div className={`${modalStyles.modalContainer} ${styles.containerWide} shadow`}>
              <div className={modalStyles.modalHeader}>
                <h5>Editar Usuário</h5>
                <button onClick={cancelEdit} className={modalStyles.btnClose}>&times;</button>
              </div>
              <div className={modalStyles.modalBody}>
                <div className={modalStyles.formGrid}>
                  <div className={`${modalStyles.formGroup} ${modalStyles.colSpan2}`}>
                    <label>Nome</label>
                    <input className="form-control" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className={`${modalStyles.formGroup} ${modalStyles.colSpan2}`}>
                    <label>E-mail</label>
                    <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Telefone</label>
                    <input className="form-control" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Cargo</label>
                    <select
                      className="form-control"
                      value={form.papel}
                      onChange={(e) => setForm({ ...form, papel: e.target.value })}
                      disabled={role !== "Proprietário"}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {String(editing.ID_Usuario) === String(localStorage.getItem("userId")) && role === "Proprietário" && (
                      <small className="text-muted">Você não pode remover seu próprio papel de Proprietário.</small>
                    )}
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Senha (opcional)</label>
                    <input type="password" className="form-control" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} />
                  </div>
                  <div className={modalStyles.formGroup}>
                    <label>Confirmar senha</label>
                    <input type="password" className="form-control" value={form.confirmarSenha} onChange={(e) => setForm({ ...form, confirmarSenha: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className={modalStyles.modalFooter}>
                <button className={modalStyles.btnCancel} onClick={cancelEdit} disabled={saving}>Cancelar</button>
                <button className={modalStyles.btnSave} onClick={saveEdit} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {/* Delete Modal */}
      {deleting && createPortal(
        (
          <div className={`${modalStyles.modalOverlay} ${styles.overlayTop}`}>
            <div className={`${modalStyles.modalContainer} ${styles.containerConfirm} shadow`}>
              <div className={modalStyles.modalHeader}>
                <h5>Excluir Usuário</h5>
                <button onClick={cancelDelete} className={modalStyles.btnClose}>&times;</button>
              </div>
              <div className={modalStyles.modalBody}>
                <p>Tem certeza que deseja excluir o usuário <strong>{deleting.Nome_Usuario}</strong> ({deleting.Email})?</p>
                <p className="text-danger small m-0">Essa ação não pode ser desfeita.</p>
              </div>
              <div className={modalStyles.modalFooter}>
                <button className={modalStyles.btnCancel} onClick={cancelDelete} disabled={removing}>Cancelar</button>
                <button className={modalStyles.btnCancel} onClick={doDelete} disabled={removing}>
                  {removing ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
      
      </div>
    </div>
    </>
  );
}
