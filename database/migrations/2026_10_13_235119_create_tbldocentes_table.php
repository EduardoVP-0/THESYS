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
        Schema::create('tbldocentes', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->foreignId('id_usuario_registro')->constrained('users', 'id')->onDelete('cascade');
            $table->string('nombre', 100);
            $table->string('apellido_p', 100);
            $table->string('apellido_m', 100);
            $table->string('telefono', 20);
            $table->string('cedula_profesional', 100);
            $table->string('curp', 100);
            $table->string('especialidad',100);
            $table->string('grado_academico',50);
            $table->string('tipo_contrato',200);
            $table->boolean('estado')->default(true);
            $table->string('nivel_acceso', 100);
            $table->timestamp('fecha_registro')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbldocentes');
    }
};
