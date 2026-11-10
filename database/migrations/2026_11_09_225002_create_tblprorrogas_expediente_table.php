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
        Schema::create('tblprorrogas_expediente', function (Blueprint $table) {
            $table->id('id_prorroga');

            $table->foreignId('id_usuario')
                ->constrained('tblalumnos', 'id_usuario')
                ->onDelete('cascade');

            $table->unsignedTinyInteger('etapa')->default(1);

            // Emisor del mensaje en el minichat ('alumno' o 'admin')
            $table->string('emisor', 20)->default('alumno');

            // Mensaje o justificación enviada
            $table->text('mensaje');

            // Estado de la solicitud ('Pendiente', 'Aprobada', 'Rechazada')
            $table->string('estado', 50)->default('Pendiente');

            // Días adicionales otorgados en caso de aprobación
            $table->integer('dias_otorgados')->nullable();

            $table->foreignId('id_administrador')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('fecha_resolucion')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblprorrogas_expediente');
    }
};
