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
        Schema::create('tbloficios_oficiales', function (Blueprint $table) {
            // LLAVE PRIMARIA
            $table->id('id_oficio_oficial');

            // LLAVES FORANEAS
            $table->foreignId('id_usuario_registro')
                ->nullable()
                ->constrained('users')
                ->onDelete('restrict');

            $table->string('nombre_oficio', 100)->unique();
            $table->boolean('estado')->default(true);
            $table->string('tipo', 50);
            $table->string('url_archivo', 255);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbloficios_oficiales');
    }
};
