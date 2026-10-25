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
        Schema::create('tbljurados_proyectos', function (Blueprint $table) {
            $table->id('id_jurado_proyecto');

            // SE USA CASCADE POR QUE SI SE ELIMINA AL USUARIO, SU PARTICIPACION COMO JURADO TAMBIEN
            $table->foreignId('id_usuario')
                ->constrained('users')
                ->onDelete('cascade');

            // SI SE BORRA UN PROYECTO DEL SISTEMA, SE BORRAN SUS JURADOS ASIGNADOS
            $table->foreignId('id_proyecto')
                ->constrained('tblproyectos', 'id_proyecto')
                ->onDelete('cascade');

            $table->string('cargo', 100);

            // SE ASIGNAN DOCENTES COMO JURADOS Y EL DEBE ACEPTAR O RECHAZAR
            $table->string('estado_aceptacion', 50)->default('Pendiente');

            $table->timestamps();

            // IMPIDE QUE AGREGUES A UN USUARIO DOS VECES AL MISMO PROYECTO
            $table->unique(['id_usuario', 'id_proyecto']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbljurados_proyectos');
    }
};
