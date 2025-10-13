import { useEffect, useState } from 'react';
import Dashboard from '../../../components/Relatorios/Dashboard';
import styles from './Relatorios.module.css';
import Navbar from '../../../components/Navbar/Navbar';

function Relatorios() {

  useEffect(() => {
      document.body.classList.add('produtos-page');
      return () => {
        document.body.classList.remove('produtos-page');
      };
    }, []);

  return (
    <div>
      <Navbar/>
      <div className={styles.dashboardContainer}>
        <Dashboard />
      </div>
    </div>

  );
}

export default Relatorios;