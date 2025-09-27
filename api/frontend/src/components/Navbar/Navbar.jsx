import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { MdMenu, MdMenuBook, MdBarChart, MdShoppingCart, MdAttachMoney } from "react-icons/md";

/* Small helper (keeps same logic used elsewhere) */
const isTokenValid = () => {
  const t = localStorage.getItem("token");
  return !!t && t !== "undefined" && t !== "null" && t.trim() !== "";
};

export default function Navbar({ onLogout }) {
  // If no valid token, don't render this system navbar
  if (!isTokenValid()) return null;

  const [menuAberto, setMenuAberto] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!window.__NavbarInstances) window.__NavbarInstances = 0;
      window.__NavbarInstances += 1;
      if (window.__NavbarInstances > 1) setShouldRender(false);
    }
    return () => {
      if (typeof window !== "undefined" && window.__NavbarInstances) {
        window.__NavbarInstances = Math.max(0, window.__NavbarInstances - 1);
      }
    };
  }, []);

  if (!shouldRender) return null;

  const handleLogout = () => {
    // remove token
    localStorage.removeItem("token");
    // notify other listeners (tabs/components)
    try {
      window.dispatchEvent(new CustomEvent("authChanged", { detail: { token: null } }));
    } catch (e) {
      // ignore
    }
    // call optional callback from parent
    if (typeof onLogout === "function") {
      onLogout();
    } else {
      // fallback navigation to home / sign-in
      navigate("/");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      if (!localStorage.getItem("token")) {
        setMenuAberto(false);
      }
    };
    window.addEventListener("authChanged", onAuthChanged);
    return () => window.removeEventListener("authChanged", onAuthChanged);
  }, []);

  return (
    <div className="container-fluid">
      <nav className="navbar d-none d-md-flex">
        <ul className="nav-list">
          <li>
            <NavLink to="/receitas" className="hoverable">
              <MdMenuBook style={{ verticalAlign: "middle", marginRight: 6 }} /> Receitas
            </NavLink>
          </li>
          <li>
            <NavLink to="/relatorios" className="hoverable">
              <MdBarChart style={{ verticalAlign: "middle", marginRight: 6 }} /> Relatórios
            </NavLink>
          </li>
          <li>
            <img src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_che2.png`} alt="Logo" />
          </li>
          <li>
            <NavLink to="/ingredientes" className="hoverable">
              <MdShoppingCart style={{ verticalAlign: "middle", marginRight: 6 }} /> Ingredientes
            </NavLink>
          </li>
          <li>
            <NavLink to="/despesas" className="hoverable">
              <MdAttachMoney style={{ verticalAlign: "middle", marginRight: 6 }} /> Despesas
            </NavLink>
          </li>
        </ul>
        <button className="btnLogout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> Sair
        </button>
      </nav>

      <nav className="navbar navbar-expand-md d-flex d-md-none px-3">
        <img src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_che2.png`} alt="Logo" className="navbar-logo" style={{ height: "40px" }} />

        <button className="btn" type="button" onClick={() => setMenuAberto(!menuAberto)}>
          <MdMenu />
        </button>

        <div ref={menuRef} className={`mobile-sidebar ${menuAberto ? "open" : ""}`} tabIndex={-1}>
          <div className="mobile-sidebar-header d-flex align-items-center justify-content-between px-3 py-2">
            <img src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_che2.png`} alt="Logo" style={{ height: "36px" }} />
            <button className="btn" onClick={() => setMenuAberto(false)}>
              <MdMenu size={28} />
            </button>
          </div>
          <ul className="navbar-nav flex-column px-3">
            <li className="nav-item">
              <NavLink to="/receitas" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdMenuBook style={{ verticalAlign: "middle", marginRight: 6 }} /> Receitas
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/relatorios" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdBarChart style={{ verticalAlign: "middle", marginRight: 6 }} /> Relatórios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/ingredientes" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdShoppingCart style={{ verticalAlign: "middle", marginRight: 6 }} /> Ingredientes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/despesas" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdAttachMoney style={{ verticalAlign: "middle", marginRight: 6 }} /> Despesas
              </NavLink>
            </li>
            <li className="nav-item mt-2">
              <button className="btnLogoutCelular" onClick={handleLogout}>
                Sair <i className="bi bi-box-arrow-right"></i>
              </button>
            </li>
          </ul>
        </div>

        {menuAberto && <div className="mobile-sidebar-overlay" onClick={() => setMenuAberto(false)} />}
      </nav>
    </div>
  );
}
