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
        Schema::table('tblpagos', function (Blueprint $table) {
            // Relación con el concepto del catálogo (nullable para mantener histórico)
            $table->foreignId('id_concepto')
                ->nullable()
                ->after('id_usuario')
                ->constrained('tblconceptos_pagos', 'id_concepto')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tblpagos', function (Blueprint $table) {
            $table->dropForeign(['id_concepto']);
            $table->dropColumn('id_concepto');
        });
    }
};
