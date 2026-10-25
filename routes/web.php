<?php

use App\Http\Controllers\Admin\AdministradorController;
use App\Http\Controllers\Admin\AlumnoController;
use App\Http\Controllers\Admin\AnteproyectoController;
use App\Http\Controllers\Admin\AsignacionRevisorController;
use App\Http\Controllers\Admin\CarreraController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DocenteController;
use App\Http\Controllers\Admin\OficiosOficialesController;
use App\Http\Controllers\Admin\PagoController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn () => redirect()->route('admin.dashboard'))->name('dashboard');
});

// Rutas de Administrador (Roles 1, 2 y 3)
Route::middleware(['auth', 'verified', 'role:1,2,3'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

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
        MODULO DE PAGOS (CRUD ADMINISTRATIVO)
        */

        // Listado de pagos con paginacion, filtros y metricas
        Route::get('/pagos', [PagoController::class, 'index'])->name('pagos.index');
        // Actualizar estado de validación (Validar / Rechazar pago)
        Route::patch('/pagos/{id}/estado', [PagoController::class, 'updateEstado'])->name('pagos.update-estado');

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
    });

// Redireccion amigable para la navegacion del sidebar
Route::redirect('/asignaciones/revisiones', '/admin/asignaciones/revisores');
Route::redirect('/asignaciones/revisores', '/admin/asignaciones/revisores');

/*Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
Route::post('products', [ProductController::class,'store'])->name('products.store');
Route::get('products/edit/{product}', [ProductController::class, 'edit'])->name('products.edit');
Route::put('products/{product}', [ProductController::class,'update'])->name('products.update');
Route::delete('products/{product}', [ProductController::class,'destroy'])->name('products.destroy');*/

require __DIR__.'/settings.php';
