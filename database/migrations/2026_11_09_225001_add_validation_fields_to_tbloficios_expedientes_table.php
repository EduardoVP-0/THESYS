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
        Schema::table('tbloficios_expedientes', function (Blueprint $table) {
            $table->foreignId('id_requisito')
                ->nullable()
                ->after('id_usuario')
                ->constrained('tblrequisitos_documentos', 'id_requisito')
                ->nullOnDelete();

            $table->string('estado_validacion', 50)
                ->default('Pendiente')
                ->after('url_archivo');

            $table->text('observaciones')
                ->nullable()
                ->after('estado_validacion');

            $table->foreignId('id_validador')
                ->nullable()
                ->after('observaciones')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('fecha_validacion')
                ->nullable()
                ->after('id_validador');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tbloficios_expedientes', function (Blueprint $table) {
            $table->dropForeign(['id_requisito']);
            $table->dropForeign(['id_validador']);
            $table->dropColumn([
                'id_requisito',
                'estado_validacion',
                'observaciones',
                'id_validador',
                'fecha_validacion',
            ]);
        });
    }
};
