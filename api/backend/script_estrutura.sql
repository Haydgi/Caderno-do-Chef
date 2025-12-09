-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: crud
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `despesas`
--

DROP TABLE IF EXISTS `despesas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despesas` (
  `ID_Despesa` int NOT NULL AUTO_INCREMENT,
  `ID_Usuario` int NOT NULL,
  `Nome_Despesa` varchar(100) NOT NULL,
  `Custo_Mensal` float NOT NULL,
  `Tempo_Operacional` float NOT NULL,
  `Data_Despesa` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_Despesa`),
  KEY `fk_ID_Usuario_idx` (`ID_Usuario`),
  CONSTRAINT `fk_ID_Usuario` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historico_alteracoes`
--

DROP TABLE IF EXISTS `historico_alteracoes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_alteracoes` (
  `ID_Historico` int NOT NULL AUTO_INCREMENT,
  `ID_Ingrediente` int NOT NULL,
  `ID_Usuario` int NOT NULL,
  `Preco` decimal(10,2) NOT NULL,
  `Taxa_Desperdicio` decimal(5,2) NOT NULL,
  `Data_Alteracoes` datetime DEFAULT CURRENT_TIMESTAMP,
  `Status` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`ID_Historico`),
  KEY `ID_Ingrediente` (`ID_Ingrediente`),
  KEY `ID_Usuario` (`ID_Usuario`),
  CONSTRAINT `historico_alteracoes_ibfk_1` FOREIGN KEY (`ID_Ingrediente`) REFERENCES `ingredientes` (`ID_Ingredientes`),
  CONSTRAINT `historico_alteracoes_ibfk_2` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historico_impostos`
--

DROP TABLE IF EXISTS `historico_impostos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historico_impostos` (
  `ID_Historico` int NOT NULL AUTO_INCREMENT,
  `ID_Imposto` int NOT NULL,
  `Valor` decimal(10,2) NOT NULL,
  `Data_Registro` date NOT NULL,
  PRIMARY KEY (`ID_Historico`),
  KEY `ID_Imposto` (`ID_Imposto`),
  CONSTRAINT `historico_impostos_ibfk_1` FOREIGN KEY (`ID_Imposto`) REFERENCES `impostos` (`ID_Imposto`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `impostos`
--

DROP TABLE IF EXISTS `impostos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `impostos` (
  `ID_Imposto` int NOT NULL AUTO_INCREMENT,
  `ID_Usuario` int NOT NULL,
  `Nome_Imposto` varchar(255) NOT NULL,
  `Categoria_Imposto` varchar(100) DEFAULT NULL,
  `Frequencia` enum('mensal','anual') NOT NULL,
  `Valor_Medio` decimal(10,2) NOT NULL,
  `Data_Cadastro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Data_Atualizacao` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_Imposto`),
  UNIQUE KEY `ID_Usuario` (`ID_Usuario`,`Nome_Imposto`),
  CONSTRAINT `impostos_ibfk_1` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingredientes`
--

DROP TABLE IF EXISTS `ingredientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredientes` (
  `ID_Ingredientes` int NOT NULL AUTO_INCREMENT,
  `ID_Usuario` int NOT NULL,
  `Nome_Ingrediente` varchar(50) NOT NULL,
  `Custo_Ingrediente` float NOT NULL,
  `Unidade_De_Medida` varchar(45) NOT NULL,
  `Data_Ingrediente` datetime DEFAULT CURRENT_TIMESTAMP,
  `Categoria` varchar(45) NOT NULL,
  `Indice_de_Desperdicio` float NOT NULL,
  PRIMARY KEY (`ID_Ingredientes`),
  KEY `fk_ingredientes_usuario` (`ID_Usuario`),
  CONSTRAINT `fk_ingredientes_usuario` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_Usuario` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ingredientes_receita`
--

DROP TABLE IF EXISTS `ingredientes_receita`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredientes_receita` (
  `ID_Receita` int NOT NULL,
  `ID_Ingredientes` int NOT NULL,
  `Quantidade_Utilizada` float NOT NULL,
  `Unidade_De_Medida` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`ID_Receita`,`ID_Ingredientes`),
  KEY `ID_Ingredientes_idx` (`ID_Ingredientes`),
  CONSTRAINT `fk_ingredientes_receita_ingredientes` FOREIGN KEY (`ID_Ingredientes`) REFERENCES `ingredientes` (`ID_Ingredientes`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ingredientes_receita_receitas` FOREIGN KEY (`ID_Receita`) REFERENCES `receitas` (`ID_Receita`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `preco`
--

DROP TABLE IF EXISTS `preco`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preco` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `ID_Ingrediente` int NOT NULL,
  `ID_Historico` int NOT NULL,
  `ID_Usuario` int NOT NULL,
  `Quantidade_Utilizada` decimal(10,2) NOT NULL,
  `Unidade_Medida` varchar(20) DEFAULT NULL,
  `Custo_Unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Ingrediente` (`ID_Ingrediente`),
  KEY `ID_Historico` (`ID_Historico`),
  KEY `ID_Usuario` (`ID_Usuario`),
  CONSTRAINT `preco_ibfk_2` FOREIGN KEY (`ID_Ingrediente`) REFERENCES `ingredientes` (`ID_Ingredientes`),
  CONSTRAINT `preco_ibfk_3` FOREIGN KEY (`ID_Historico`) REFERENCES `historico_alteracoes` (`ID_Historico`),
  CONSTRAINT `preco_ibfk_4` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `receitas`
--

DROP TABLE IF EXISTS `receitas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `receitas` (
  `ID_Receita` int NOT NULL AUTO_INCREMENT,
  `ID_Usuario` int NOT NULL,
  `Nome_Receita` varchar(100) NOT NULL,
  `Custo_Total_Ingredientes` float NOT NULL,
  `Descricao` text,
  `Tempo_Preparo` int NOT NULL,
  `Porcentagem_De_Lucro` float NOT NULL,
  `Categoria` varchar(50) DEFAULT NULL,
  `Imagem_URL` varchar(255) NOT NULL,
  `Data_Receita` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_Receita`),
  KEY `fk_receitas_usuario` (`ID_Usuario`),
  CONSTRAINT `fk_receitas_usuario` FOREIGN KEY (`ID_Usuario`) REFERENCES `usuario` (`ID_Usuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `ID_Usuario` int NOT NULL AUTO_INCREMENT,
  `Nome_Usuario` varchar(50) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Email_Confirmado` tinyint(1) NOT NULL DEFAULT '0',
  `Token_Confirmacao` varchar(64) DEFAULT NULL,
  `Token_Confirmacao_Expira` datetime DEFAULT NULL,
  `Senha` varchar(100) NOT NULL,
  `Telefone` varchar(20) NOT NULL,
  `tipo_usuario` enum('Proprietário','Gerente','Funcionário') NOT NULL,
  `Data` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ID_Usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-07 20:05:52
