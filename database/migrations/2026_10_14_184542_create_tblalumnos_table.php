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
        Schema::create('tblalumnos', function (Blueprint $table) {
            // LLAVE PRIMARIA Y FORANEA
            $table->foreignId('id_usuario')
                ->primary()
                ->constrained('users')
                ->onDelete('cascade');

            // LLAVE FORANEA DE QUIEN REGISTRO AL ALUMNO
            $table->foreignId('id_usuario_registro')
                ->nullable()
                ->constrained('users')
                ->onDelete('restrict');

            // LLAVE FORANEA DE CARRERA
            $table->foreignId('id_carrera')
                ->constrained('tblcarreras', 'id_carrera')
                ->onDelete('restrict');

            // DATOS PERSONALES
            $table->string('nombre', 100);
            $table->string('apellido_p', 100);
            $table->string('apellido_m', 100);
            $table->date('fecha_nacimiento');
            $table->string('sexo', 20);
            $table->string('curp', 18)->unique();
            $table->string('telefono', 20)->nullable();
            $table->string('matricula', 10)->unique();
            $table->string('calle', 150)->nullable();
            $table->string('colonia', 100)->nullable();
            $table->string('codigo_postal', 10)->nullable();

            // DATOS ACADEMICOS
            $table->string('turno', 50);
            $table->date('fecha_ingreso');
            $table->string('generacion', 50);
            $table->string('estado_academico', 50)->default('Activo');

            // DATOS DE AUDITORÍA
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblalumnos');
    }
};
