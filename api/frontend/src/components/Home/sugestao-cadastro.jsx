import React, { Fragment } from 'react'
import { useNavigate } from 'react-router-dom';

import PropTypes from 'prop-types'

import './sugestao-cadastro.css'

const SugestaoCadastro = (props) => {
  const navigate = useNavigate();

  return (
    <div className="thq-section-padding">
      <div className="thq-section-max-width">
        <div className="sugestao-cadastro-accent2-bg">
          <div className="sugestao-cadastro-accent1-bg">
            <div className="sugestao-cadastro-container2">
              <div className="sugestao-cadastro-content">
                <span className="thq-heading-2">
                  {props.heading1 ?? (
                    <Fragment>
                      <span className="sugestao-cadastro-text4">
                        Pronto para experimentar as capacidades do Caderno?
                      </span>
                    </Fragment>
                  )}
                </span>
                <p className="thq-body-large">
                  {props.content1 ?? (
                    <Fragment>
                      <span className="sugestao-cadastro-text5">
                        Cadastre-se hoje e comece a desfrutar da experiência de uma ótima gestão de preços como você nunca viu antes!
                      </span>
                    </Fragment>
                  )}
                </p>
              </div>
              <div className="sugestao-cadastro-actions">
                <button
                  type="button"
                  className="sugestao-cadastro-button"
                  onClick={() => navigate('/sign-up')}
                >
                  <span>
                    {props.action1 ?? (
                      <Fragment>
                        <span className="sugestao-cadastro-text6">
                          Quero o meu Caderno!
                        </span>
                      </Fragment>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

SugestaoCadastro.defaultProps = {
  heading1: undefined,
  content1: undefined,
  action1: undefined,
}

SugestaoCadastro.propTypes = {
  heading1: PropTypes.element,
  content1: PropTypes.element,
  action1: PropTypes.element,
}

export default SugestaoCadastro
