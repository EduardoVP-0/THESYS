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
        Schema::create('tbldocentes', function (Blueprint $table) {
            $table->foreignId('id_usuario')
            ->primary()
            ->constrained('users')
            ->onDelete('cascade');

            $table->foreignId('id_usuario_registro')
            ->nullable()->constrained('users')
            ->onDelete('restrict');
            
            $table->string('nombre', 100);
            $table->string('apellido_p', 100);
            $table->string('apellido_m', 100);
            $table->string('telefono', 20)->nullable();
            $table->string('cedula_profesional', 20)->unique();
            $table->string('curp', 18)->unique();
            $table->string('especialidad',100);
            $table->string('grado_academico',50);
            $table->string('tipo_contrato',100);
            $table->boolean('estado')->default(true);
            //$table->string('nivel_acceso', 100); PODRIA SER POR EL ROL
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbldocentes');
    }
};
