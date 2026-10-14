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
        Schema::create('tblpagos', function (Blueprint $table) {
            $table->id('id_pago');

            //USAMOS RESTRICT YA QUE NO SE PUEDE BORRAR UN USUARIO CON HISTORIAL FINANCIERO
            $table->foreignId('id_usuario')
            ->constrained('users')
            ->onDelete('restrict');

            //Para el dinero se usa decimal para que se redondee bien
            $table->decimal('monto', 10, 2);

            $table->string('concepto', 255);

            //Tiene nullable por si no se genera referencia bancaria
            $table->string('referencia_bancaria', 100)->unique()->nullable();

            //Estado del pago
            $table->string('estado_validacion', 50)->default('Pendiente');

            //Ayudara a dar la fecha en la que se registro el pago y la fecha cuando se cambia el estado de validacion
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tblpagos');
    }
};
