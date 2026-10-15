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
        Schema::create('tblasesores_proyectos', function (Blueprint $table) {
            $table->id('id_asesor_proyecto');

            //SI BORRAN AL DOCENTE DEL SISTEMA, SE BORRA SU ASIGNACION
            $table->foreignId('id_usuario')
            ->constrained('users')
            ->onDelete('cascade');

            //SI BORRAN UN PROYECTO DEL SISTEMA, SE BORRAN SUS ASESORES ASIGNADOS
            $table->foreignId('id_proyecto')
            ->constrained('tblproyectos', 'id_proyecto')
            ->onDelete('cascade');

            $table->string('estado_asignacion', 50)->default('Activo');

            $table->timestamps();

            /*VALIDACION UNICA COMPUESTA
            ESTO EVITA QUE SE ASOCIE UN MISMO DOCENTE DOS VECES AL MISMO PROYECTO*/
            $table->unique(['id_usuario','id_proyecto']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblasesores_proyectos');
    }
};
