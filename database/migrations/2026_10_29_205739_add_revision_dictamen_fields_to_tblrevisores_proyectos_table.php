<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CAMPOS DE DICTAMEN POR REVISOR EN LA PIVOTE DE REVISORES
 *
 * Agrega en `tblrevisores_proyectos` el estado de revisión de cada revisor
 * sobre la versión actual de la tesis ("Pendiente", "Con cambios", "Aprobado"),
 * los comentarios del dictamen y la fecha del registro.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tblrevisores_proyectos', function (Blueprint $table) {
            $table->string('estado_revision', 50)->default('Pendiente')->after('estado_asignacion');
            $table->text('comentarios_revision')->nullable()->after('estado_revision');
            $table->timestamp('fecha_revision')->nullable()->after('comentarios_revision');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tblrevisores_proyectos', function (Blueprint $table) {
            $table->dropColumn(['estado_revision', 'comentarios_revision', 'fecha_revision']);
        });
    }
};
