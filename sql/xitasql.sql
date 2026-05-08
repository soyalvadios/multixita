-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: acceso_umb
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `actas_pdf`
--

DROP TABLE IF EXISTS `actas_pdf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `actas_pdf` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_asignacion` int NOT NULL,
  `parcial` tinyint NOT NULL,
  `ruta_pdf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_subida` datetime DEFAULT CURRENT_TIMESTAMP,
  `procesada` tinyint(1) DEFAULT '0',
  `alumnos_procesados` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unico_acta` (`id_asignacion`,`parcial`),
  CONSTRAINT `actas_fk1` FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `actas_pdf`
--

LOCK TABLES `actas_pdf` WRITE;
/*!40000 ALTER TABLE `actas_pdf` DISABLE KEYS */;
INSERT INTO `actas_pdf` VALUES (1,1,1,'/uploads/actas/acta_1778112906300.pdf','2026-05-06 18:15:08',1,8);
/*!40000 ALTER TABLE `actas_pdf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `alumnos_grupos`
--

DROP TABLE IF EXISTS `alumnos_grupos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alumnos_grupos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_grupo` int NOT NULL,
  `id_periodo` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ag_fk1` (`id_alumno`),
  KEY `ag_fk2` (`id_grupo`),
  KEY `ag_fk3` (`id_periodo`),
  CONSTRAINT `ag_fk1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `ag_fk2` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`),
  CONSTRAINT `ag_fk3` FOREIGN KEY (`id_periodo`) REFERENCES `periodos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alumnos_grupos`
--

LOCK TABLES `alumnos_grupos` WRITE;
/*!40000 ALTER TABLE `alumnos_grupos` DISABLE KEYS */;
INSERT INTO `alumnos_grupos` VALUES (1,4,4,1),(2,5,4,1),(3,6,4,1),(4,7,4,1),(5,8,4,1),(6,9,4,1),(7,10,4,1),(8,11,4,1);
/*!40000 ALTER TABLE `alumnos_grupos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asignaciones`
--

DROP TABLE IF EXISTS `asignaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asignaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_docente` int NOT NULL,
  `id_materia` int NOT NULL,
  `id_grupo` int NOT NULL,
  `id_periodo` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unico` (`id_docente`,`id_materia`,`id_grupo`,`id_periodo`),
  KEY `asig_fk2` (`id_materia`),
  KEY `asig_fk3` (`id_grupo`),
  KEY `asig_fk4` (`id_periodo`),
  CONSTRAINT `asig_fk1` FOREIGN KEY (`id_docente`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `asig_fk2` FOREIGN KEY (`id_materia`) REFERENCES `materias` (`id`),
  CONSTRAINT `asig_fk3` FOREIGN KEY (`id_grupo`) REFERENCES `grupos` (`id`),
  CONSTRAINT `asig_fk4` FOREIGN KEY (`id_periodo`) REFERENCES `periodos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asignaciones`
--

LOCK TABLES `asignaciones` WRITE;
/*!40000 ALTER TABLE `asignaciones` DISABLE KEYS */;
INSERT INTO `asignaciones` VALUES (1,3,1,4,1);
/*!40000 ALTER TABLE `asignaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `asistencias`
--

DROP TABLE IF EXISTS `asistencias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_asignacion` int NOT NULL,
  `fecha` date NOT NULL,
  `asistio` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `asi_fk1` (`id_alumno`),
  KEY `asi_fk2` (`id_asignacion`),
  CONSTRAINT `asi_fk1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `asi_fk2` FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencias`
--

LOCK TABLES `asistencias` WRITE;
/*!40000 ALTER TABLE `asistencias` DISABLE KEYS */;
/*!40000 ALTER TABLE `asistencias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calificaciones`
--

DROP TABLE IF EXISTS `calificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_asignacion` int NOT NULL,
  `parcial` tinyint NOT NULL,
  `calificacion` tinyint NOT NULL,
  `asistencias` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_captura` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unico_calificacion` (`id_alumno`,`id_asignacion`,`parcial`),
  KEY `cal_fk2` (`id_asignacion`),
  CONSTRAINT `cal_fk1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `cal_fk2` FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificaciones`
--

LOCK TABLES `calificaciones` WRITE;
/*!40000 ALTER TABLE `calificaciones` DISABLE KEYS */;
INSERT INTO `calificaciones` VALUES (17,4,1,1,80,'25/25','2025-10-14'),(18,5,1,1,84,'25/25','2025-10-14'),(19,6,1,1,69,'25/25','2025-10-14'),(20,7,1,1,63,'22/25','2025-10-14'),(21,8,1,1,74,'25/25','2025-10-14'),(22,9,1,1,85,'25/25','2025-10-14'),(23,10,1,1,67,'25/25','2025-10-14'),(24,11,1,1,78,'25/25','2025-10-14');
/*!40000 ALTER TABLE `calificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calificaciones_criterio`
--

DROP TABLE IF EXISTS `calificaciones_criterio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calificaciones_criterio` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_asignacion` int NOT NULL,
  `id_criterio` int NOT NULL,
  `parcial` tinyint NOT NULL,
  `calificacion` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unico` (`id_alumno`,`id_asignacion`,`id_criterio`,`parcial`),
  KEY `cc_fk2` (`id_asignacion`),
  KEY `cc_fk3` (`id_criterio`),
  CONSTRAINT `cc_fk1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `cc_fk2` FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones` (`id`),
  CONSTRAINT `cc_fk3` FOREIGN KEY (`id_criterio`) REFERENCES `criterios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calificaciones_criterio`
--

LOCK TABLES `calificaciones_criterio` WRITE;
/*!40000 ALTER TABLE `calificaciones_criterio` DISABLE KEYS */;
/*!40000 ALTER TABLE `calificaciones_criterio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carreras`
--

DROP TABLE IF EXISTS `carreras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carreras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carreras`
--

LOCK TABLES `carreras` WRITE;
/*!40000 ALTER TABLE `carreras` DISABLE KEYS */;
INSERT INTO `carreras` VALUES (1,'LF','Informática'),(2,'LP','Psicología'),(3,'LA','Administración'),(4,'IL','Logística');
/*!40000 ALTER TABLE `carreras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `constancias_tutoria`
--

DROP TABLE IF EXISTS `constancias_tutoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `constancias_tutoria` (
  `id` int NOT NULL AUTO_INCREMENT,
  `folio_constancia` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_tutoria` int NOT NULL,
  `id_alumno` int NOT NULL,
  `puntaje_final` tinyint DEFAULT NULL,
  `nivel_riesgo` enum('verde','amarillo','rojo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_emision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folio_constancia` (`folio_constancia`),
  KEY `ct_fk1` (`id_tutoria`),
  KEY `ct_fk2` (`id_alumno`),
  CONSTRAINT `ct_fk1` FOREIGN KEY (`id_tutoria`) REFERENCES `tutorias` (`id`),
  CONSTRAINT `ct_fk2` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `constancias_tutoria`
--

LOCK TABLES `constancias_tutoria` WRITE;
/*!40000 ALTER TABLE `constancias_tutoria` DISABLE KEYS */;
/*!40000 ALTER TABLE `constancias_tutoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `criterios`
--

DROP TABLE IF EXISTS `criterios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `criterios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `criterios`
--

LOCK TABLES `criterios` WRITE;
/*!40000 ALTER TABLE `criterios` DISABLE KEYS */;
INSERT INTO `criterios` VALUES (1,'EXAMEN',1),(2,'TAREAS',1),(3,'PRÁCTICAS EN CLASE',1),(4,'PROYECTO',1),(5,'TRABAJOS',1),(6,'PARTICIPACIÓN',1);
/*!40000 ALTER TABLE `criterios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupos`
--

DROP TABLE IF EXISTS `grupos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_carrera` int NOT NULL,
  `id_periodo` int NOT NULL,
  `nombre` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `semestre` tinyint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `grupos_fk1` (`id_carrera`),
  KEY `grupos_fk2` (`id_periodo`),
  CONSTRAINT `grupos_fk1` FOREIGN KEY (`id_carrera`) REFERENCES `carreras` (`id`),
  CONSTRAINT `grupos_fk2` FOREIGN KEY (`id_periodo`) REFERENCES `periodos` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupos`
--

LOCK TABLES `grupos` WRITE;
/*!40000 ALTER TABLE `grupos` DISABLE KEYS */;
INSERT INTO `grupos` VALUES (1,1,1,'26LF321',2),(2,1,1,'26LF361',6),(3,1,1,'26LF381',8),(4,1,1,'26LF351',5),(5,2,1,'26LP321',2),(6,2,1,'26LP341',4),(7,2,1,'26LP361',6),(8,2,1,'26LP381',8),(9,3,1,'26LA321',2),(10,3,1,'26LA341',4),(11,3,1,'26LA361',6),(12,3,1,'26LA381',8),(13,4,1,'26IL321',2),(14,4,1,'26IL341',4),(15,4,1,'26IL361',6),(16,4,1,'26IL381',8);
/*!40000 ALTER TABLE `grupos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materias`
--

DROP TABLE IF EXISTS `materias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clave` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creditos` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materias`
--

LOCK TABLES `materias` WRITE;
/*!40000 ALTER TABLE `materias` DISABLE KEYS */;
INSERT INTO `materias` VALUES (1,'LFQ1017','REDES DE COMPUTADORAS I',7),(2,'LFQ1018','PROGRAMACION WEB',6),(3,'LFQ1019','BASE DE DATOS II',7),(4,'LFQ1020','SISTEMAS OPERATIVOS',6);
/*!40000 ALTER TABLE `materias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periodos`
--

DROP TABLE IF EXISTS `periodos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periodos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_inicio` date DEFAULT NULL,
  `fecha_fin` date DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periodos`
--

LOCK TABLES `periodos` WRITE;
/*!40000 ALTER TABLE `periodos` DISABLE KEYS */;
INSERT INTO `periodos` VALUES (1,'25-26/1','2025-08-01','2026-01-31',1);
/*!40000 ALTER TABLE `periodos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_resultados`
--

DROP TABLE IF EXISTS `quiz_resultados`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_resultados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `materia` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `modulo` tinyint NOT NULL,
  `aciertos` tinyint NOT NULL,
  `total` tinyint NOT NULL DEFAULT '10',
  `aprobado` tinyint(1) NOT NULL,
  `fecha` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `qr_fk1` (`id_alumno`),
  CONSTRAINT `qr_fk1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_resultados`
--

LOCK TABLES `quiz_resultados` WRITE;
/*!40000 ALTER TABLE `quiz_resultados` DISABLE KEYS */;
/*!40000 ALTER TABLE `quiz_resultados` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registros_acceso`
--

DROP TABLE IF EXISTS `registros_acceso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registros_acceso` (
  `id_registro` int NOT NULL AUTO_INCREMENT,
  `id_alumno` int NOT NULL,
  `id_vehiculo` int DEFAULT NULL,
  `id_oficial` int DEFAULT NULL,
  `hora_entrada` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `hora_salida` timestamp NULL DEFAULT NULL,
  `placas_vistas` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_acceso` enum('nfc','qr','manual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'manual',
  `estado` enum('dentro','salio') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'dentro',
  PRIMARY KEY (`id_registro`),
  KEY `idx_alumno_entrada` (`id_alumno`,`hora_entrada`),
  KEY `reg_fk2` (`id_vehiculo`),
  KEY `reg_fk3` (`id_oficial`),
  CONSTRAINT `reg_fk1` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `reg_fk2` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos` (`id_vehiculo`),
  CONSTRAINT `reg_fk3` FOREIGN KEY (`id_oficial`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registros_acceso`
--

LOCK TABLES `registros_acceso` WRITE;
/*!40000 ALTER TABLE `registros_acceso` DISABLE KEYS */;
/*!40000 ALTER TABLE `registros_acceso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutoria_opciones`
--

DROP TABLE IF EXISTS `tutoria_opciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoria_opciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pregunta` int NOT NULL,
  `orden` tinyint NOT NULL DEFAULT '1',
  `texto` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valor` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `to_fk1` (`id_pregunta`),
  CONSTRAINT `to_fk1` FOREIGN KEY (`id_pregunta`) REFERENCES `tutoria_preguntas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutoria_opciones`
--

LOCK TABLES `tutoria_opciones` WRITE;
/*!40000 ALTER TABLE `tutoria_opciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutoria_opciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutoria_preguntas`
--

DROP TABLE IF EXISTS `tutoria_preguntas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutoria_preguntas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_tutoria` int NOT NULL,
  `orden` tinyint NOT NULL DEFAULT '1',
  `pregunta` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('opcion_multiple') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'opcion_multiple',
  `activa` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `tp_fk1` (`id_tutoria`),
  CONSTRAINT `tp_fk1` FOREIGN KEY (`id_tutoria`) REFERENCES `tutorias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutoria_preguntas`
--

LOCK TABLES `tutoria_preguntas` WRITE;
/*!40000 ALTER TABLE `tutoria_preguntas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutoria_preguntas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutorias`
--

DROP TABLE IF EXISTS `tutorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutorias` (
  `id` int NOT NULL AUTO_INCREMENT,
  `folio` varchar(25) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_docente` int NOT NULL,
  `id_asignacion` int NOT NULL,
  `parcial` tinyint NOT NULL DEFAULT '1',
  `titulo` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `instrucciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `estatus` enum('borrador','publicada','cerrada') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'publicada',
  `fecha_publicacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_cierre` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folio` (`folio`),
  KEY `tut_fk1` (`id_docente`),
  KEY `tut_fk2` (`id_asignacion`),
  CONSTRAINT `tut_fk1` FOREIGN KEY (`id_docente`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `tut_fk2` FOREIGN KEY (`id_asignacion`) REFERENCES `asignaciones` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorias`
--

LOCK TABLES `tutorias` WRITE;
/*!40000 ALTER TABLE `tutorias` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutorias_alumnos`
--

DROP TABLE IF EXISTS `tutorias_alumnos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutorias_alumnos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_tutoria` int NOT NULL,
  `id_alumno` int NOT NULL,
  `estado` enum('pendiente','respondida') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `puntaje_total` tinyint DEFAULT NULL,
  `nivel_riesgo` enum('verde','amarillo','rojo') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tut_alumno` (`id_tutoria`,`id_alumno`),
  KEY `ta_fk2` (`id_alumno`),
  CONSTRAINT `ta_fk1` FOREIGN KEY (`id_tutoria`) REFERENCES `tutorias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ta_fk2` FOREIGN KEY (`id_alumno`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorias_alumnos`
--

LOCK TABLES `tutorias_alumnos` WRITE;
/*!40000 ALTER TABLE `tutorias_alumnos` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutorias_alumnos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tutorias_respuestas`
--

DROP TABLE IF EXISTS `tutorias_respuestas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tutorias_respuestas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_tutoria_alumno` int NOT NULL,
  `id_opcion` int DEFAULT NULL,
  `id_pregunta` int DEFAULT NULL,
  `valor` tinyint NOT NULL DEFAULT '0',
  `opcion_texto` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tr_fk1` (`id_tutoria_alumno`),
  CONSTRAINT `tr_fk1` FOREIGN KEY (`id_tutoria_alumno`) REFERENCES `tutorias_alumnos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tutorias_respuestas`
--

LOCK TABLES `tutorias_respuestas` WRITE;
/*!40000 ALTER TABLE `tutorias_respuestas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tutorias_respuestas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `rol` enum('alumno','oficial','docente','administrativo','coordinador','administrador') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_paterno` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellido_materno` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matricula` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_selfie` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `face_verificada` tinyint(1) NOT NULL DEFAULT '0',
  `score_verificacion` decimal(5,2) DEFAULT NULL,
  `estado_verificacion_facial` enum('pendiente','aprobada','rechazada','sin_selfie') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sin_selfie',
  `ues` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grupo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrera` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `badge` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(72) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `identidad_verificada` tinyint(1) DEFAULT '0',
  `push_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `foto_credencial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nfc_uid` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `matricula` (`matricula`),
  UNIQUE KEY `badge` (`badge`),
  UNIQUE KEY `idx_nfc_uid` (`nfc_uid`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'administrador','Admin','Panel',NULL,'admin001','admin@umb.mx',NULL,NULL,0,NULL,'sin_selfie',NULL,NULL,NULL,NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',0,NULL,NULL,NULL),(2,'oficial','Oficial','Caseta',NULL,NULL,NULL,NULL,NULL,0,NULL,'sin_selfie',NULL,NULL,NULL,'CASETA01','$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',0,NULL,NULL,NULL),(3,'docente','Gerardo','Blas','Ruiz',NULL,NULL,NULL,NULL,0,NULL,'sin_selfie',NULL,NULL,NULL,'03271','$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',0,NULL,NULL,NULL),(4,'alumno','David','Alvarado','Correa','26230013',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(5,'alumno','Gabriel','Arriaga','Martinez','26230026',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(6,'alumno','Juan Jesus','Beltran','Nuñez','26230057',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(7,'alumno','Erick Josue','Contreras','Villa','26230047',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(8,'alumno','Jose Armando','Garcia','Sanchez','26230018',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(9,'alumno','Magdalena','Martinez','Trujillo','26230021',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(10,'alumno','Jocelyn','Maya','Hernandez','26230017',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(11,'alumno','Yareli','Nuñez','Sanchez','26230059',NULL,NULL,NULL,0,NULL,'sin_selfie','UES Temascalcingo','26LF351','Informática',NULL,'$2b$12$pn0.nTZEI4cOXSoF94QTtOOHilI.S8jP.qVmDjFsIN85RNGgCUsjK',1,'2026-05-04 01:23:49',1,NULL,NULL,NULL),(15,'alumno','Alberto','Alvarado','Correa','26230001',NULL,NULL,'/uploads/fotos/selfie_tmp_1778113024719.jpg',0,NULL,'pendiente','UES Temascalcingo','26LP341','Psicología',NULL,'$2b$12$Sf37e4ldN7inEfCfP5Qp2O59UrhaCJXN7MNgSCkfvrTtfrzrHXufa',0,'2026-05-07 00:16:39',0,NULL,'/uploads/credenciales/cred_frente_1778113003830.jpg|/uploads/credenciales/cred_reverso_1778113008927.jpg',NULL);
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculos`
--

DROP TABLE IF EXISTS `vehiculos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculos` (
  `id_vehiculo` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `placas` varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `modelo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('auto','moto','otro') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'auto',
  `activo` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id_vehiculo`),
  UNIQUE KEY `placas` (`placas`),
  KEY `veh_fk1` (`id_usuario`),
  CONSTRAINT `veh_fk1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculos`
--

LOCK TABLES `vehiculos` WRITE;
/*!40000 ALTER TABLE `vehiculos` DISABLE KEYS */;
INSERT INTO `vehiculos` VALUES (1,4,'NYS380A','Chevrolet','Beat','Blanco','auto',1);
/*!40000 ALTER TABLE `vehiculos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `verificaciones_identidad`
--

DROP TABLE IF EXISTS `verificaciones_identidad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `verificaciones_identidad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `foto_anverso` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `foto_reverso` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('pendiente','aprobado','rechazado') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `datos_extraidos` json DEFAULT NULL,
  `nombre_extraido` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `matricula_extraida` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `curp_extraida` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coincide_bd` tinyint(1) DEFAULT '0',
  `revisado_por` int DEFAULT NULL,
  `fecha_solicitud` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_revision` timestamp NULL DEFAULT NULL,
  `motivo_rechazo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vi_fk1` (`id_usuario`),
  KEY `vi_fk2` (`revisado_por`),
  CONSTRAINT `vi_fk1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `vi_fk2` FOREIGN KEY (`revisado_por`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `verificaciones_identidad`
--

LOCK TABLES `verificaciones_identidad` WRITE;
/*!40000 ALTER TABLE `verificaciones_identidad` DISABLE KEYS */;
/*!40000 ALTER TABLE `verificaciones_identidad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `vw_boleta_admin`
--

DROP TABLE IF EXISTS `vw_boleta_admin`;
/*!50001 DROP VIEW IF EXISTS `vw_boleta_admin`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_boleta_admin` AS SELECT 
 1 AS `id_alumno`,
 1 AS `materia`,
 1 AS `docente`,
 1 AS `parcial`,
 1 AS `calificacion`,
 1 AS `asistencias`,
 1 AS `id_materia`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `vw_boleta_admin`
--

/*!50001 DROP VIEW IF EXISTS `vw_boleta_admin`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `vw_boleta_admin` AS select `c`.`id_alumno` AS `id_alumno`,`m`.`nombre` AS `materia`,concat(coalesce(`d`.`nombre`,''),' ',coalesce(`d`.`apellido_paterno`,'')) AS `docente`,`c`.`parcial` AS `parcial`,`c`.`calificacion` AS `calificacion`,`c`.`asistencias` AS `asistencias`,`m`.`id` AS `id_materia` from (((`calificaciones` `c` left join `asignaciones` `a` on((`c`.`id_asignacion` = `a`.`id`))) left join `materias` `m` on((`a`.`id_materia` = `m`.`id`))) left join `usuarios` `d` on((`a`.`id_docente` = `d`.`id_usuario`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-07 21:03:15
