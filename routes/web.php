<?php

use App\Http\Controllers\Admin\AdministradorController;
use App\Http\Controllers\Admin\AlumnoController;
use App\Http\Controllers\Admin\AnteproyectoController;
use App\Http\Controllers\Admin\AsignacionAsesorController;
use App\Http\Controllers\Admin\AsignacionExamenController;
use App\Http\Controllers\Admin\AsignacionJuradoController;
use App\Http\Controllers\Admin\AsignacionRevisorController;
use App\Http\Controllers\Admin\CarreraController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DocenteController;
use App\Http\Controllers\Admin\ExpedienteController;
use App\Http\Controllers\Admin\OficiosOficialesController;
use App\Http\Controllers\Admin\PagoController;
use App\Http\Controllers\Admin\SedeController;
use App\Http\Controllers\Admin\VeredictoController;
use App\Http\Controllers\Alumno\AlumnoTesisAsesorController;
use App\Http\Controllers\Alumno\AlumnoTesisRevisoresController;
use App\Http\Controllers\Alumno\AnteproyectoController as AlumnoAnteproyectoController;
use App\Http\Controllers\Alumno\CalendarioController as AlumnoCalendarioController;
use App\Http\Controllers\Alumno\DashboardController as AlumnoDashboardController;
use App\Http\Controllers\Alumno\ExamenController as AlumnoExamenController;
use App\Http\Controllers\Alumno\ExpedienteController as AlumnoExpedienteController;
use App\Http\Controllers\Alumno\JuradoController as AlumnoJuradoController;
use App\Http\Controllers\Alumno\OficioOficialController as AlumnoOficioOficialController;
use App\Http\Controllers\Alumno\PagoController as AlumnoPagoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn (Request $request) => redirect()->route(
        (int) $request->user()?->id_rol === 5 ? 'alumno.dashboard' : 'admin.dashboard'
    ))->name('dashboard');
});

// Rutas de Alumno (Rol 5)
Route::middleware(['auth', 'verified', 'role:5'])
    ->prefix('alumno')
    ->name('alumno.')
    ->group(function () {
        Route::get('/dashboard', [AlumnoDashboardController::class, 'index'])->name('dashboard');

        /*
        MODULO DE MI ANTEPROYECTO (SUSTENTANTE)
        */
        Route::get('/mi-anteproyecto', [AlumnoAnteproyectoController::class, 'index'])->name('anteproyecto.index');
        Route::post('/mi-anteproyecto/borrador', [AlumnoAnteproyectoController::class, 'guardarBorrador'])->name('anteproyecto.borrador');
        Route::post('/mi-anteproyecto/enviar', [AlumnoAnteproyectoController::class, 'enviarRevision'])->name('anteproyecto.enviar');
        Route::get('/mi-anteproyecto/documento', [AlumnoAnteproyectoController::class, 'verDocumento'])->name('anteproyecto.documento');
        Route::redirect('/anteproyecto', '/alumno/mi-anteproyecto');

        /*
        MODULO DE MI JURADO (SUSTENTANTE)
        */
        Route::get('/mi-jurado', [AlumnoJuradoController::class, 'index'])->name('jurado.index');
        Route::redirect('/jurado', '/alumno/mi-jurado');

        /*
        MODULO DE MIS EXÁMENES (SUSTENTANTE)
        */
        Route::get('/mis-examenes', [AlumnoExamenController::class, 'index'])->name('examenes.index');
        Route::redirect('/examenes', '/alumno/mis-examenes');

        /*
        MODULO DE CALENDARIO ACADÉMICO (SUSTENTANTE)
        */
        Route::get('/calendario-academico', [AlumnoCalendarioController::class, 'index'])->name('calendario.index');
        Route::redirect('/calendario', '/alumno/calendario-academico');

        /*
        MODULO DE MI TESIS - DIRECTOR DE TESIS (SUSTENTANTE)
        */
        Route::get('/tesis-asesor', [AlumnoTesisAsesorController::class, 'index'])->name('tesis-asesor.index');
        Route::post('/tesis-asesor', [AlumnoTesisAsesorController::class, 'store'])->name('tesis-asesor.store');
        Route::get('/tesis-asesor/{version}/documento', [AlumnoTesisAsesorController::class, 'verDocumento'])->name('tesis-asesor.documento');

        /*
        MODULO DE MI TESIS - REVISORES (SUSTENTANTE)
        */
        Route::get('/mi-tesis', [AlumnoTesisRevisoresController::class, 'index'])->name('tesis-revisores.index');
        Route::post('/mi-tesis', [AlumnoTesisRevisoresController::class, 'store'])->name('tesis-revisores.store');
        Route::get('/mi-tesis/{version}/documento', [AlumnoTesisRevisoresController::class, 'verDocumento'])->name('tesis-revisores.documento');

        /*
        MODULO DE PAGOS (SUSTENTANTE)
        */
        Route::get('/pagos', [AlumnoPagoController::class, 'index'])->name('pagos.index');
        Route::get('/pagos/create', [AlumnoPagoController::class, 'create'])->name('pagos.create');
        Route::post('/pagos', [AlumnoPagoController::class, 'store'])->name('pagos.store');
        Route::get('/pagos/{pago}/documento', [AlumnoPagoController::class, 'verDocumento'])->name('pagos.documento');

        /*
        MODULO DE OFICIOS OFICIALES (SUSTENTANTE)
        */
        Route::get('/oficios_oficiales', [AlumnoOficioOficialController::class, 'index'])->name('oficios_oficiales.index');
        Route::get('/oficios_oficiales/{id}/documento/{filename?}', [AlumnoOficioOficialController::class, 'verDocumento'])
            ->where('filename', '.*')
            ->name('oficios_oficiales.documento');
        Route::redirect('/oficios-oficiales', '/alumno/oficios_oficiales');

        /*
        MODULO DE MI EXPEDIENTE DIGITAL (SUSTENTANTE)
        */
        Route::get('/mi-expediente', [AlumnoExpedienteController::class, 'index'])->name('expediente.index');
        Route::get('/mi-expediente/anteproyecto/documento', [AlumnoExpedienteController::class, 'verAnteproyectoDocumento'])->name('expediente.anteproyecto.documento');
        Route::get('/mi-expediente/version/{version}/documento', [AlumnoExpedienteController::class, 'verVersionDocumento'])->name('expediente.version.documento');
        Route::get('/mi-expediente/oficio/{oficio}/documento', [AlumnoExpedienteController::class, 'verOficioDocumento'])->name('expediente.oficio.documento');
        Route::redirect('/expediente', '/alumno/mi-expediente');
    });

// Rutas de Administrador (Roles 1, 2 y 3)
Route::middleware(['auth', 'verified', 'role:1,2,3'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard/report', [AdminDashboardController::class, 'report'])->name('dashboard.report');

        /*
        MODULO DE CARRERAS (CRUD ADMINISTRATIVO)
        */

        // Listado de carreras y estadísticas
        Route::get('/carreras', [CarreraController::class, 'index'])->name('carreras.index');

        // Formulario para registrar una nueva carrera
        Route::get('/carreras/create', [CarreraController::class, 'create'])->name('carreras.create');

        // Almacenar la nueva carrera en la base de datos
        Route::post('/carreras', [CarreraController::class, 'store'])->name('carreras.store');

        // Formulario de edición con los datos cargados
        Route::get('/carreras/{carrera}/edit', [CarreraController::class, 'edit'])->name('carreras.edit');

        // Actualizar la información de la carrera
        Route::put('/carreras/{carrera}', [CarreraController::class, 'update'])->name('carreras.update');

        // Alternar estado (Activar / Desactivar carrera - Baja lógica)
        Route::patch('/carreras/{carrera}/toggle-status', [CarreraController::class, 'toggleStatus'])->name('carreras.toggle-status');

        // Exportar Carreras (CSV, PDF, Word)
        Route::get('/carreras/export-csv', [CarreraController::class, 'exportCsv'])->name('carreras.export-csv');
        Route::get('/carreras/export-pdf', [CarreraController::class, 'exportPdf'])->name('carreras.export-pdf');
        Route::get('/carreras/export-word', [CarreraController::class, 'exportWord'])->name('carreras.export-word');

        /*
        MODULO DE SEDES (CATÁLOGO ADMINISTRATIVO)
        */
        // Listado de sedes con métricas, filtros y estatus
        Route::get('/sedes', [SedeController::class, 'index'])->name('sedes.index');
        // Registrar una nueva sede
        Route::post('/sedes', [SedeController::class, 'store'])->name('sedes.store');
        // Actualizar los datos de una sede
        Route::put('/sedes/{sede}', [SedeController::class, 'update'])->name('sedes.update');
        // Alternar estado (Activa / Inactiva - Baja lógica)
        Route::patch('/sedes/{sede}/toggle-status', [SedeController::class, 'toggleStatus'])->name('sedes.toggle-status');

        /*
        MODULO DE OFICIOS OFICIALES (CRUD ADMINISTRATIVO)
        */

        // Listado de oficios oficiales
        Route::get('/oficios_oficiales', [OficiosOficialesController::class, 'index'])->name('oficios_oficiales.index');
        // Visualizar documento PDF del oficio oficial desde Supabase Storage
        Route::get('oficios_oficiales/{id}/documento/{filename?}', [OficiosOficialesController::class, 'verDocumento'])->name('oficios_oficiales.documento');
        // Formulario para registrar un nuevo oficio oficial
        Route::get('oficios_oficiales/create', [OficiosOficialesController::class, 'create'])->name('oficios_oficiales.create');
        // Almacenar el nuevo oficio oficial en la base de datos
        Route::post('oficios_oficiales', [OficiosOficialesController::class, 'store'])->name('oficios_oficiales.store');
        // Formulario de edición con los datos cargados
        // Actualizar la información del oficio oficial
        Route::match(['post', 'put'], 'oficios_oficiales/{id}', [OficiosOficialesController::class, 'update'])->name('oficios_oficiales.update');

        // Alternar estado (Activar / Desactivar oficio oficial - Baja lógica)
        Route::patch('oficios_oficiales/{id}/toggle-status', [OficiosOficialesController::class, 'toggleStatus'])->name('oficios_oficiales.toggle-status');

        // Eliminar oficio oficial
        Route::delete('oficios_oficiales/{id}', [OficiosOficialesController::class, 'destroy'])->name('oficios_oficiales.destroy');

        /*
        MODULO DE ALUMNOS (CRUD ADMINISTRATIVO)
        */

        // Listado de alumnos con paginación, filtros y métricas
        Route::get('/alumnos', [AlumnoController::class, 'index'])->name('alumnos.index');

        // Registrar un nuevo alumno (transacción en users + tblalumnos)
        Route::post('/alumnos', [AlumnoController::class, 'store'])->name('alumnos.store');

        // Actualizar datos del alumno
        Route::put('/alumnos/{alumno}', [AlumnoController::class, 'update'])->name('alumnos.update');

        // Alternar estado de la cuenta (Activar / Suspender acceso)
        Route::patch('/alumnos/{alumno}/toggle-status', [AlumnoController::class, 'toggleStatus'])->name('alumnos.toggle-status');

        // Redirección amigable por si se accede mediante /admin/estudiantes
        Route::redirect('/estudiantes', '/admin/alumnos');

        /*
        MODULO DE DOCENTES (CRUD ADMINISTRATIVO)
        */
        // Listado de docentes con paginacion, filtros y metricas
        Route::get('/docentes', [DocenteController::class, 'index'])->name('docentes.index');
        // Registrar un nuevo docente (transaccion en users + tbldocentes)
        Route::post('/docentes', [DocenteController::class, 'store'])->name('docentes.store');
        // Actualizar datos del docente
        Route::put('/docentes/{docente}', [DocenteController::class, 'update'])->name('docentes.update');
        // Alternar estado de la cuenta (Activar / Suspender acceso)
        Route::patch('/docentes/{docente}/toggle-status', [DocenteController::class, 'toggleStatus'])->name('docentes.toggle-status');
        // Redireccion amigable por si se accede mediante /admin/profesores
        Route::redirect('/profesores', '/admin/docentes');

        /*
        MODULO DE ASIGNACIONES (ASESORES)
        */
        // Listado de anteproyectos aprobados pendientes de asesor
        Route::get('/asignaciones/asesores', [AsignacionAsesorController::class, 'index'])->name('asignaciones.asesores.index');
        // Registrar la asignación de un asesor a un anteproyecto
        Route::post('/asignaciones/asesores', [AsignacionAsesorController::class, 'store'])->name('asignaciones.asesores.store');

        /*
        MODULO DE ASIGNACIONES (JURADOS)
        */
        // Consulta de jurados conformados por proyecto de tesis
        Route::get('/asignaciones/jurados/consulta', [AsignacionJuradoController::class, 'consulta'])->name('asignaciones.jurados.consulta');
        // Listado de proyectos con asesor activo y docentes disponibles para integrar el jurado
        Route::get('/asignaciones/jurados', [AsignacionJuradoController::class, 'index'])->name('asignaciones.jurados.index');
        // Registrar la estructura completa del jurado de un proyecto
        Route::post('/asignaciones/jurados', [AsignacionJuradoController::class, 'store'])->name('asignaciones.jurados.store');
        // Sustituir a un integrante de jurado que rechazó la designación
        Route::patch('/asignaciones/jurados/{proyecto}/sustituir', [AsignacionJuradoController::class, 'sustituir'])->name('asignaciones.jurados.sustituir');
        // Actualizar estado de aceptación de un integrante del jurado
        Route::patch('/asignaciones/jurados/miembros/{jurado}/estado', [AsignacionJuradoController::class, 'actualizarEstadoMiembro'])->name('asignaciones.jurados.actualizar-estado-miembro');

        /*
        MODULO DE ASIGNACIONES (EXÁMENES PROFESIONALES)
        */
        // Programación de examen para proyectos con jurado completo
        Route::get('/asignaciones/examenes', [AsignacionExamenController::class, 'index'])->name('asignaciones.examenes.index');
        // Registrar fecha, hora y sede del examen profesional
        Route::post('/asignaciones/examenes', [AsignacionExamenController::class, 'store'])->name('asignaciones.examenes.store');

        /*
        MODULO DE VEREDICTOS (DICTÁMENES DEL JURADO)
        */
        // Consulta de veredictos por examen con agregado de votos
        Route::get('/veredictos', [VeredictoController::class, 'index'])->name('veredictos.index');

        /*
        MODULO DE PAGOS (CRUD ADMINISTRATIVO)
        */

        // Listado de pagos con paginacion, filtros y metricas
        Route::get('/pagos', [PagoController::class, 'index'])->name('pagos.index');
        // Actualizar estado de validación (Validar / Rechazar pago)
        Route::patch('/pagos/{id}/estado', [PagoController::class, 'updateEstado'])->name('pagos.update-estado');
        // Visualizar comprobante PDF del pago desde Supabase Storage
        Route::get('/pagos/{pago}/documento', [PagoController::class, 'verDocumento'])->name('pagos.documento');

        /*
        MODULO DE ADMINISTRADORES (CRUD ADMINISTRATIVO)
        */
        // Listado de administradores con paginacion, filtros y metricas
        Route::get('/administradores', [AdministradorController::class, 'index'])->name('administradores.index');
        // Registrar un nuevo administrador (transaccion en users + tbladministradores)
        Route::post('/administradores', [AdministradorController::class, 'store'])->name('administradores.store');
        // Actualizar datos del administrador
        Route::put('/administradores/{administrador}', [AdministradorController::class, 'update'])->name('administradores.update');
        // Alternar estado de la cuenta (Activar / Suspender acceso)
        Route::patch('/administradores/{administrador}/toggle-status', [AdministradorController::class, 'toggleStatus'])->name('administradores.toggle-status');

        /*
        MODULO DE ANTEPROYECTOS (VALIDACION Y REVISION)
        */
        // Bandeja de anteproyectos con paginacion, filtros y panel de revision
        Route::get('/anteproyectos', [AnteproyectoController::class, 'index'])->name('anteproyectos.index');
        // Visualizar documento PDF del anteproyecto
        Route::get('/anteproyectos/{proyecto}/documento', [AnteproyectoController::class, 'verDocumento'])->name('anteproyectos.documento');
        // Aprobar anteproyecto
        Route::patch('/anteproyectos/{proyecto}/aprobar', [AnteproyectoController::class, 'aprobar'])->name('anteproyectos.aprobar');
        // Solicitar cambios al sustentante
        Route::patch('/anteproyectos/{proyecto}/solicitar-cambios', [AnteproyectoController::class, 'solicitarCambios'])->name('anteproyectos.solicitar-cambios');

        /*
        MODULO DE ASIGNACION DE REVISORES
        */
        // Interfaz de asignacion de revisores a anteproyectos aprobados
        Route::get('/asignaciones/revisores', [AsignacionRevisorController::class, 'index'])->name('asignaciones.revisores.index');
        // Guardar la asignacion de los 2 revisores
        Route::post('/asignaciones/revisores', [AsignacionRevisorController::class, 'store'])->name('asignaciones.revisores.store');

        /*
        MODULO DE EXPEDIENTES DIGITALES
        */
        // Repositorio general de expedientes con metricas y tabla
        Route::get('/expedientes', [ExpedienteController::class, 'index'])->name('expedientes.index');
        // Expediente digital detallado del sustentante
        Route::get('/expedientes/{alumno}', [ExpedienteController::class, 'show'])->name('expedientes.show');
        // Visor de documentos de anteproyecto
        Route::get('/expedientes/anteproyecto/{proyecto}/documento', [ExpedienteController::class, 'verAnteproyectoDocumento'])->name('expedientes.anteproyecto.documento');
        // Visor de versiones de tesis
        Route::get('/expedientes/version/{version}/documento', [ExpedienteController::class, 'verVersionDocumento'])->name('expedientes.version.documento');
        // Visor de oficios de expediente
        Route::get('/expedientes/oficio/{oficio}/documento', [ExpedienteController::class, 'verOficioDocumento'])->name('expedientes.oficio.documento');
    });

// Redireccion amigable para la navegacion del sidebar
Route::redirect('/docente', '/asesor/dashboard');
Route::redirect('/asesor', '/asesor/dashboard');
Route::redirect('/alumno', '/alumno/dashboard');
Route::redirect('/expedientes', '/admin/expedientes');
Route::redirect('/asignaciones/revisiones', '/admin/asignaciones/revisores');
Route::redirect('/asignaciones/revisores', '/admin/asignaciones/revisores');
Route::redirect('/veredictos', '/admin/veredictos');

require __DIR__.'/settings.php';
