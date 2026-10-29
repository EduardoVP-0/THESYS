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
        Schema::create('tblconceptos_pagos', function (Blueprint $table) {
            $table->id('id_concepto');

            // Clave o código institucional del trámite (ej: UNACH-TES-01)
            $table->string('clave', 50)->unique()->nullable();

            // Nombre oficial del concepto (ej: Inscripción del tema de tesis)
            $table->string('nombre', 255);

            // Descripción detallada de los requisitos o alcance del pago
            $table->text('descripcion')->nullable();

            // Monto o costo actual fijado
            $table->decimal('monto', 10, 2);

            // Orden secuencial de visualización en el catálogo (1, 2, 3...)
            $table->integer('orden')->default(1);

            // Estado para activar o pausar conceptos sin eliminarlos
            $table->boolean('activo')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblconceptos_pagos');
    }
};
