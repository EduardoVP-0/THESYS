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
        Schema::create('tblversiones_tesis', function (Blueprint $table) {
            $table->id('id_version');

            $table->foreignId('id_proyecto')
            ->constrained('tblproyectos', 'id_proyecto')
            ->onDelete('cascade');

            $table->string('numero_version', 20);

            $table->text('comentario_alumno')->nullable();

            //RUTA DONDE SE GUARDA EL ARCHIVO FISICO
            $table->string('ruta_archivo', 255);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblversiones_tesis');
    }
};
