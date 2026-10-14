<?php

//use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

/*Route::get('products', [ProductController::class, 'index'])->name('products.index');
Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
Route::post('products', [ProductController::class,'store'])->name('products.store');
Route::get('products/edit/{product}', [ProductController::class, 'edit'])->name('products.edit');
Route::put('products/{product}', [ProductController::class,'update'])->name('products.update');
Route::delete('products/{product}', [ProductController::class,'destroy'])->name('products.destroy');*/



require __DIR__.'/settings.php';
