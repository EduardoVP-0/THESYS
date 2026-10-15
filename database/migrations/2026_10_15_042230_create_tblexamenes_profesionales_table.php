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
        Schema::create('tblexamenes_profesionales', function (Blueprint $table) {
            
            $table->id('id_examen');


            //SE USA CASCADE POR QUE SI SE BORRA UN PROYECTO NO TIENE SENTIDO CONSERVAR SUS EXAMENES
            $table->foreignId('id_proyecto')
            ->unique()
            ->constrained('tblproyectos')
            ->OnDelete('cascade');

            //DATOS DEL DIA
            $table->date('fecha_examen');
            $table->time('hora_examen');
            $table->string('sede', 150);

            $table->string('estado_examen', 50)->default('Programado');
            $table->string('resultado_final', 100)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblexamenes_profesionales');
    }
};
