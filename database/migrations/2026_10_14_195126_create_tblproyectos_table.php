<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tblproyectos', function (Blueprint $table) {
            $table->id('id_proyecto');

            $table->string('titulo', 255);
            $table->text('resumen')->nullable();
            $table->string('estado', 50)->default('Propuesta');
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblproyectos');
    }
};
