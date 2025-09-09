import { useState, useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";
import { MdMenu, MdMenuBook, MdBarChart, MdShoppingCart, MdAttachMoney } from "react-icons/md";
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const handleLogout = () => {
    console.log("Usuário saiu");
    navigate('/');
  };

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="container-fluid">
      <nav className="navbar d-none d-md-flex">
        {/* Navbar Desktop original */}
        <ul className="nav-list">
          <li>
            <NavLink to="/receitas" className="hoverable" activeClassName="active">
              <MdMenuBook style={{ verticalAlign: 'middle', marginRight: 6 }} /> Receitas
            </NavLink>
          </li>
          <li>
            <NavLink to="/relatorios" className="hoverable" activeClassName="active">
              <MdBarChart style={{ verticalAlign: 'middle', marginRight: 6 }} /> Relatórios
            </NavLink>
          </li>
          <li>
            <img src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_che2.png`} alt="Logo" className="" />
          </li>
          <li>
            <NavLink to="/ingredientes" className="hoverable" activeClassName="active">
              <MdShoppingCart style={{ verticalAlign: 'middle', marginRight: 6 }} /> Ingredientes
            </NavLink>
          </li>
          <li>
            <NavLink to="/despesas" className="hoverable" activeClassName="active">
              <MdAttachMoney style={{ verticalAlign: 'middle', marginRight: 6 }} /> Despesas
            </NavLink>
          </li>
        </ul>
        <button className="btnLogout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> Sair
        </button>
      </nav>

      {/* Navbar Mobile com Bootstrap */}
      <nav className="navbar navbar-expand-md d-flex d-md-none px-3">
        <img src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_che2.png`} alt="Logo" className="navbar-logo" style={{ height: "40px" }} />
        
        <button
          className="btn"
          type="button"
          onClick={() => setMenuAberto(!menuAberto)}
        >
          <i className="MdMenu"><MdMenu /></i>
        </button>

        {/* Sidebar lateral mobile */}
        <div
          ref={menuRef}
          className={`mobile-sidebar ${menuAberto ? "open" : ""}`}
          tabIndex={-1}
        >
          <div className="mobile-sidebar-header d-flex align-items-center justify-content-between px-3 py-2">
            <img src={`${import.meta.env.BASE_URL}midia/logo_caderno_do_che2.png`} alt="Logo" style={{ height: "36px" }} />
            <button className="btn" onClick={() => setMenuAberto(false)}>
              <MdMenu size={28} />
            </button>
          </div>
          <ul className="navbar-nav flex-column px-3">
            <li className="nav-item">
              <NavLink to="/receitas" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdMenuBook style={{ verticalAlign: 'middle', marginRight: 6 }} /> Receitas
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/relatorios" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdBarChart style={{ verticalAlign: 'middle', marginRight: 6 }} /> Relatórios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/ingredientes" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdShoppingCart style={{ verticalAlign: 'middle', marginRight: 6 }} /> Ingredientes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/despesas" className="nav-link" onClick={() => setMenuAberto(false)}>
                <MdAttachMoney style={{ verticalAlign: 'middle', marginRight: 6 }} /> Despesas
              </NavLink>
            </li>
            <li className="nav-item mt-2">
              <button className="btnLogoutCelular" onClick={handleLogout}>
                Sair <i className="bi bi-box-arrow-right"></i>
              </button>
            </li>
          </ul>
        </div>
        {/* Overlay para fechar ao clicar fora */}
        {menuAberto && <div className="mobile-sidebar-overlay" onClick={() => setMenuAberto(false)} />}
      </nav>
    </div>
  );
}
