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
            $table->string('estado', 50)->default('Borrador'); // Borrador, En revision, Aprobado, Con cambios

            // CAMPOS DE ANTEPROYECTO:
            $table->timestamp('fecha_envio')->nullable();          // null = "Sin enviar", con fecha = "Enviado"
            $table->string('ruta_documento', 255)->nullable();     // Archivo PDF del anteproyecto
            $table->text('observaciones_coordinacion')->nullable(); // Retroalimentacion del panel derecho

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
