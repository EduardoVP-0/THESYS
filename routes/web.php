<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn() => redirect()->route('admin.dashboard'))->name('dashboard');
});


// Rutas de Administrador (Roles 1, 2 y 3)
Route::middleware(['auth', 'verified', 'role:1,2,3'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    });

/*Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
Route::post('products', [ProductController::class,'store'])->name('products.store');
Route::get('products/edit/{product}', [ProductController::class, 'edit'])->name('products.edit');
Route::put('products/{product}', [ProductController::class,'update'])->name('products.update');
Route::delete('products/{product}', [ProductController::class,'destroy'])->name('products.destroy');*/

require __DIR__ . '/settings.php';
