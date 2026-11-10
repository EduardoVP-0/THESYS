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
        Schema::create('tblrequisitos_documentos', function (Blueprint $table) {
            $table->id('id_requisito');

            // Clave única institucional del documento (ej: DOC-E1-01)
            $table->string('clave', 50)->unique();

            // Nombre oficial del documento requerido
            $table->string('nombre', 150);

            // Descripción detallada con fundamento en el Estatuto Integral UNACH
            $table->text('descripcion')->nullable();

            // Etapa reglamentaria a la que pertenece (1: Arranque, 2: Desarrollo, 3: Revisión, 4: Expediente Final)
            $table->unsignedTinyInteger('etapa')->default(1);

            // Indica si se genera por el sistema o se vincula automáticamente (ej: Anteproyecto, Oficio Jurado)
            $table->boolean('es_sistema')->default(false);

            // Indica si se sincroniza desde tblproyectos.ruta_documento (Protocolo / Anteproyecto)
            $table->boolean('es_vinculo_anteproyecto')->default(false);

            // Indica si es obligatorio o adicional/opcional
            $table->boolean('obligatorio')->default(true);

            // Orden de visualización dentro de su etapa
            $table->integer('orden')->default(1);

            // Estado para activar o desactivar requisitos sin eliminarlos
            $table->boolean('activo')->default(true);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblrequisitos_documentos');
    }
};
