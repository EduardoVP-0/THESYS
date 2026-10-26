-- =====================================================================
-- THESYS · DATOS DEMOSTRATIVOS PARA PGADMIN 4
-- ---------------------------------------------------------------------
-- Este archivo se puede ejecutar directamente en pgAdmin 4.
-- También se utiliza desde DemoDataSeeder para poblar la base local.
--
-- Distribución de los datos:
--   * 3 carreras, 4 sedes y 10 docentes.
--   * 17 proyectos con sus sustentantes.
--   * 10 exámenes profesionales programados o realizados.
--   * 24 votos de jurado sobre 8 exámenes.
--   * Proyectos pendientes para cada flujo administrativo:
--       - 1011: sin asesor.
--       - 1012: con asesor, sin jurado.
--       - 1013 y 1014: con jurado, sin examen.
--       - 1015 a 1017: proyectos en seguimiento para el dashboard.
--
-- Todos los identificadores son altos para no chocar con los datos
-- existentes. El script es idempotente: elimina y vuelve a crear su
-- propio bloque de datos.
-- =====================================================================

BEGIN;

