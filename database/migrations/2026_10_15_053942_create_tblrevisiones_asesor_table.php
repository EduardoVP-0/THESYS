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
        Schema::create('tblrevisiones_asesor', function (Blueprint $table) {
            $table->id('id_revision');


            /*PARA SABER QUE VERSION DE TESIS SE ESTA REVISANDO
            SE USA CASCADA POR QUE SI SE ELIMINA UNA VERSION, SUS REVISIONES NO SIRVEN*/
            $table->foreignId('id_version')
            ->constrained('tblversiones_tesis', 'id_version')
            ->onDelete('cascade');

            /*QUIEN HIZO ESTA VERSION
            ESTA LLAVE SE RESCATA DE LA LLAVE PIVOTE DE MUCHOS A MUCHOS
            Y SE USA CASCADE POR QUE SI SE DESHACE UNA ASIGNACION DEL ASESOR Y PROYECTO
            SUS REVISIONES PENDIENTES DEBERIAN CANCELARSE O ELIMINARSE*/
            $table->foreignId('id_asesor_proyecto')
            ->constrained('tblasesores_proyectos', 'id_asesor_proyecto')
            ->onDelete('cascade');

            $table->string('estado_revision', 50)->default('Pendiente');

            $table->text('observaciones')->nullable();

            //Para saber cuando se creo y cuando se actualizo
            $table->timestamps();
            
            //ESTO EVITA QUE UN MISMO ASESOR CREE DOS VERSIONES SEPARADAS DE LA MISMA VERSION DEL MISMO ARCHIVO
            //SI POR EJEMPLO EL ALUMNO SUBE LA VERSION 2, ENTONCES SI PODRA HACER OTRA REVISION
            $table->unique(['id_version','id_asesor_proyecto']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblrevisiones_asesor');
    }
};
