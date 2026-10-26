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
        Schema::table('tblexamenes_profesionales', function (Blueprint $table) {
            // La columna `sede` se conserva para no romper los exámenes históricos.
            $table->foreignId('id_sede')
                ->nullable()
                ->after('id_proyecto')
                ->constrained('tblsedes', 'id_sede')
                ->onDelete('restrict');

            $table->index('fecha_examen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tblexamenes_profesionales', function (Blueprint $table) {
            $table->dropIndex(['fecha_examen']);
            $table->dropConstrainedForeignId('id_sede');
        });
    }
};
