import React from 'react';
import styles from './ModalSelecaoTipoDespesa.module.css';
import { FaMoneyBillWave, FaHandHoldingUsd } from 'react-icons/fa';

const ModalSelecaoTipoDespesa = ({ onSelect, onClose }) => {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2 className={styles.modalTitle}>O que você deseja cadastrar?</h2>

                <div className={styles.optionsContainer}>
                    <div className={styles.optionCard} onClick={() => onSelect('operacional')}>
                        <FaMoneyBillWave size={50} className={styles.icon} />
                        <h3 className={styles.optionTitle}>Despesa Operacional</h3>
                        <p className={styles.optionDescription}>
                            Custos fixos e variáveis do dia a dia, como aluguel, salários e luz.
                        </p>
                    </div>

                    <div className={styles.optionCard} onClick={() => onSelect('imposto')}>
                        <FaHandHoldingUsd size={50} className={styles.icon} />
                        <h3 className={styles.optionTitle}>Imposto</h3>
                        <p className={styles.optionDescription}>
                            Pagamentos de tributos federais, estaduais ou municipais.
                        </p>
                    </div>
                </div>

                <div className={styles.closeButtonContainer}>
                    <button onClick={onClose} className={styles.btnClose}>Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default ModalSelecaoTipoDespesa;
