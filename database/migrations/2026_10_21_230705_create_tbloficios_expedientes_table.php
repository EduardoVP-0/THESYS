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
        Schema::create('tbloficios_expedientes', function (Blueprint $table) {
            $table->id('id_oficio');

            $table->foreignId('id_usuario')
                ->constrained('tblalumnos', 'id_usuario')
                ->onDelete('cascade');

            $table->string('tipo_oficio', 150);
            $table->string('url_archivo', 255);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tbloficios_expedientes');
    }
};
