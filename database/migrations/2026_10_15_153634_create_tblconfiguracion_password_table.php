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
        Schema::create('tblconfiguracion_password', function (Blueprint $table) {
            $table->id('id_config');
            $table->integer('longitud_minima')->default(8);
            $table->boolean('requiere_mayuscula')->default(false);
            $table->boolean('requiere_minuscula')->default(false);
            $table->boolean('requiere_numero')->default(false);
            $table->boolean('requiere_especiales')->default(false);
            $table->string('caracteres_especiales', 255)->default('!@#$%^&*()_+-=[]{}|;:,.<>?');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblconfiguracion_password');
    }
};
