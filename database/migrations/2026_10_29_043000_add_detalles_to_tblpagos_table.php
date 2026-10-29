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
            if (! Schema::hasColumn('tblpagos', 'metodo_pago')) {
                $table->string('metodo_pago', 100)->nullable()->after('referencia_bancaria');
            }
            if (! Schema::hasColumn('tblpagos', 'comentarios')) {
                $table->text('comentarios')->nullable()->after('estado_validacion');
            }
            if (! Schema::hasColumn('tblpagos', 'fecha_pago')) {
                $table->timestamp('fecha_pago')->nullable()->after('comentarios');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tblpagos', function (Blueprint $table) {
            $table->dropColumn(['metodo_pago', 'comentarios', 'fecha_pago']);
        });
    }
};

