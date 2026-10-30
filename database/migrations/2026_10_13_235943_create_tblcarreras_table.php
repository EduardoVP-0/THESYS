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
        Schema::create('tblcarreras', function (Blueprint $table) {
            // LLAVE PRIMARIA
            $table->id('id_carrera');

            // Atributos
            $table->string('nombre_carrera', 100)->unique();
            $table->text('descripcion')->nullable();
            $table->tinyInteger('duracion_semestres');
            $table->boolean('estado')->default(true);

            // Definicion de llave foranea
            $table->foreignId('id_usuario_registro')
                ->nullable()
                ->constrained('users')
                ->onDelete('restrict');

            // DATOS DE AUDITORIA
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblcarreras');
    }
};
