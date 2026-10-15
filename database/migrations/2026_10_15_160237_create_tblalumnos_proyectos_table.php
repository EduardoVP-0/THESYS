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
        Schema::create('tblalumnos_proyectos', function (Blueprint $table) {
            $table->id('id_alumno_proyecto');
            $table->foreignId('id_alumno')
            ->constrained('tblalumnos', 'id_usuario')
            ->onDelete('cascade');

            $table->foreignId('id_proyecto')
            ->constrained('tblproyectos','id_proyecto')
            ->onDelete('cascade');
            
            $table->timestamps();
            $table->unique(['id_alumno','id_proyecto']);
        });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblalumnos_proyectos');
    }
};
