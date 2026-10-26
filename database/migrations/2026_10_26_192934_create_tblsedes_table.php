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
        Schema::create('tblsedes', function (Blueprint $table) {
            // LLAVE PRIMARIA
            $table->id('id_sede');

            // DATOS DE LA SEDE
            $table->string('nombre_sede', 120)->unique();
            $table->string('direccion', 255)->nullable();

            // ESTADO LÓGICO (ACTIVA / INACTIVA)
            $table->boolean('estado')->default(true);

            // DATOS DE AUDITORÍA
            $table->foreignId('id_usuario_registro')
                ->nullable()
                ->constrained('users')
                ->onDelete('restrict');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblsedes');
    }
};
