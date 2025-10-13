import React, { useState, Fragment } from 'react'

import PropTypes from 'prop-types'

import './container-infos.css'

const ContainerInfos = (props) => {
  const [activeTab, setActiveTab] = useState(0)
  return (
    <div className="thq-section-padding">
      <div className="container-infos-container2 thq-section-max-width">
        <div className="container-infos-tabs-menu">
          <div
            onClick={() => setActiveTab(0)}
            className="container-infos-tab-horizontal1"
          >
            <div className="container-infos-divider-container1">
              {activeTab === 0 && (
                <div className="container-infos-container3"></div>
              )}
            </div>
            <div className="container-infos-content1">
              <h2 className="thq-heading-2">
                {props.feature1Title ?? (
                  <Fragment>
                    <span className="container-infos-text4">
                      Delicious Recipes
                    </span>
                  </Fragment>
                )}
              </h2>
              <span className="thq-body-small">
                {props.feature1Description ?? (
                  <Fragment>
                    <span className="container-infos-text2">
                      Explore a wide range of mouth-watering recipes from
                      appetizers to desserts.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          </div>
          <div
            onClick={() => setActiveTab(1)}
            className="container-infos-tab-horizontal2"
          >
            <div className="container-infos-divider-container2">
              {activeTab === 1 && (
                <div className="container-infos-container4"></div>
              )}
            </div>
            <div className="container-infos-content2">
              <h2 className="thq-heading-2">
                {props.feature2Title ?? (
                  <Fragment>
                    <span className="container-infos-text3">
                      Helpful Cooking Tips
                    </span>
                  </Fragment>
                )}
              </h2>
              <span className="thq-body-small">
                {props.feature2Description ?? (
                  <Fragment>
                    <span className="container-infos-text5">
                      Discover useful tips and tricks to enhance your cooking
                      skills and techniques.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          </div>
          <div
            onClick={() => setActiveTab(2)}
            className="container-infos-tab-horizontal3"
          >
            <div className="container-infos-divider-container3">
              {activeTab === 2 && (
                <div className="container-infos-container5"></div>
              )}
            </div>
            <div className="container-infos-content3">
              <h2 className="thq-heading-2">
                {props.feature3Title ?? (
                  <Fragment>
                    <span className="container-infos-text6">
                      Informative Articles
                    </span>
                  </Fragment>
                )}
              </h2>
              <span className="thq-body-small">
                {props.feature3Description ?? (
                  <Fragment>
                    <span className="container-infos-text1">
                      Read insightful articles on food trends, ingredients, and
                      culinary inspiration.
                    </span>
                  </Fragment>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="container-infos-image-container">
          {activeTab === 0 && (
            <img
              alt={props.feature1ImgAlt}
              src={props.feature1ImgSrc}
              className="container-infos-image1"
            />
          )}
          {activeTab === 1 && (
            <img
              alt={props.feature2ImgAlt}
              src={props.feature2ImgSrc}
              className="container-infos-image1"
            />
          )}
          {activeTab === 2 && (
            <img
              alt={props.feature3ImgAlt}
              src={props.feature3ImgSrc}
              className="container-infos-image1"
            />
          )}
        </div>
      </div>
    </div>
  )
}

ContainerInfos.defaultProps = {
  feature3Description: undefined,
  feature1ImgAlt: 'Image of delicious recipes',
  feature1Description: undefined,
  feature3ImgAlt: 'Image of informative articles',
  feature2Title: undefined,
  feature1Title: undefined,
  feature1ImgSrc: 'https://play.teleporthq.io/static/svg/default-img.svg',
  feature3ImgSrc:
    'https://images.unsplash.com/photo-1628977479910-583755967ec1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTc0ODYzMTg5NHw&ixlib=rb-4.1.0&q=80&w=1080',
  feature2Description: undefined,
  feature3Title: undefined,
  feature2ImgAlt: 'Image of cooking tips',
  feature2ImgSrc:
    'https://images.unsplash.com/photo-1535999930924-9b47c55d0f7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTc0ODYzMTg5NHw&ixlib=rb-4.1.0&q=80&w=1080',
}

ContainerInfos.propTypes = {
  feature3Description: PropTypes.element,
  feature1ImgAlt: PropTypes.string,
  feature1Description: PropTypes.element,
  feature3ImgAlt: PropTypes.string,
  feature2Title: PropTypes.element,
  feature1Title: PropTypes.element,
  feature1ImgSrc: PropTypes.string,
  feature3ImgSrc: PropTypes.string,
  feature2Description: PropTypes.element,
  feature3Title: PropTypes.element,
  feature2ImgAlt: PropTypes.string,
  feature2ImgSrc: PropTypes.string,
}

export default ContainerInfos
