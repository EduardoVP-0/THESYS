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
        Schema::create('tblrevisores_proyectos', function (Blueprint $table) {
            $table->id('id_revisor_proyecto');
            $table->foreignId('id_usuario')->constrained('users')->onDelete('cascade');
            $table->foreignId('id_proyecto')->constrained('tblproyectos', 'id_proyecto')->onDelete('cascade');
            $table->string('estado_asignacion', 50)->default('Activo');
            $table->unique(['id_usuario', 'id_proyecto']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblrevisores_proyectos');
    }
};
