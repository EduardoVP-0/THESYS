<?php

use App\Http\Controllers\Admin\AlumnoController;
use App\Http\Controllers\Admin\CarreraController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\OficiosOficialesController;
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

        Route::get('/oficios_oficiales', [OficiosOficialesController::class, 'index'])->name('oficios_oficiales.index');

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
    });

/*Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
Route::post('products', [ProductController::class,'store'])->name('products.store');
Route::get('products/edit/{product}', [ProductController::class, 'edit'])->name('products.edit');
Route::put('products/{product}', [ProductController::class,'update'])->name('products.update');
Route::delete('products/{product}', [ProductController::class,'destroy'])->name('products.destroy');*/

require __DIR__.'/settings.php';
