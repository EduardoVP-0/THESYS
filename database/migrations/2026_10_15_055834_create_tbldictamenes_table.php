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
        Schema::create('tbldictamenes', function (Blueprint $table) {
            $table->id('id_dictamen');

            //PARA SABER QUIEN ESTA EMITIENDO ESTE DICTAMEN
            //SE USA CASCADE POR QUE SI SE ELIMINA AL DOCENTE DE SER JURAOD SU DICTAMEN DEBE INVALIDARSE
            $table->foreignId('id_jurado_proyecto')
            ->constrained('tbljurados_proyectos', 'id_jurado_proyecto')
            ->onDelete('cascade');

            $table->string('voto', 50);

            $table->text('observaciones')->nullable();

            $table->timestamps();

            //EL JURADO SOLO PUEDE EMITIR UN UNICO VOTO
            $table->unique(['id_jurado_proyecto']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbldictamenes');
    }
};
