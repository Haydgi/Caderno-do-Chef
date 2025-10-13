import React, { Fragment } from 'react';
import { Helmet } from 'react-helmet';

import Navbar from '../../components/Home/navbar'; // Corrigido o caminho
import Resumo from '../../components/Home/resumo'; // Corrigido o caminho
import Bullets from '../../components/Home/bullets';
import Descricao from '../../components/Home/descricao'; // Corrigido o caminho
import PassoAPasso from '../../components/Home/passo-a-passo'; // Corrigido o caminho
import SugestaoCadastro from '../../components/Home/sugestao-cadastro'; // Corrigido o caminho
import Equipe from '../../components/Home/equipe'; // Corrigido o caminho
import Footer from '../../components/Home/footer'; // Corrigido o caminho
import './Home.css'; // Usando estilos globais

const Home = (props) => {
  return (
    <div className="home-container">
      <Helmet>
        <title>Caderno do Chef</title>
        <meta property="og:title" content="Fatherly Superficial Shark" />
      </Helmet>
      <Navbar></Navbar>
      <Resumo></Resumo>
      <Bullets></Bullets>
      <Descricao></Descricao>
      <PassoAPasso></PassoAPasso>
      <SugestaoCadastro></SugestaoCadastro>
      <Equipe></Equipe>
      <Footer></Footer>
    </div>
  );
};

export default Home;