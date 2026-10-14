<?php

use Carbon\Traits\Timestamp;
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
            //LLAVE PRIMARIA
            $table->id('id_carrera');

            //Atributos
            $table->string('nombre_carrera');
            $table->text('descripcion')->nullable();
            $table->tinyInteger('duracion_semestres');
            $table->boolean('estado')->default(true);

            //DATOS DE AUDITORIA
            $table->timestamp('fecha_registro')->useCurrent();
            $table->unsignedBigInteger('id_usuario_registro');
            
            //Definicion de llave foranea
            $table->foreign('id_usuario_registro')
            ->references('id')
            ->on('users')
            ->onDelete('restrict');
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
