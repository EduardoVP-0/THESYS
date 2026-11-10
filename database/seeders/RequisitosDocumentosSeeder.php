<?php

namespace Database\Seeders;

use App\Models\Admin\RequisitoDocumento;
use Illuminate\Database\Seeder;

class RequisitosDocumentosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $requisitos = [
            // ETAPA 1: El Arranque (Registro y Aprobación del Tema)
            [
                'clave' => 'DOC-E1-01',
                'nombre' => 'Solicitud por escrito',
                'descripcion' => 'Dirigida al Director(a) de tu Facultad pidiendo titularte por la opción de Tesis (Art. 203 y 239).',
                'etapa' => 1,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 1,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E1-02',
                'nombre' => 'Certificado de Estudios Profesionales',
                'descripcion' => 'Acredita que has cursado y aprobado el 100% de los créditos del plan de estudios (Art. 196).',
                'etapa' => 1,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 2,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E1-03',
                'nombre' => 'Constancia de Liberación de Servicio Social',
                'descripcion' => 'Documento oficial con sello y firma que acredita el cumplimiento del servicio social (Art. 198).',
                'etapa' => 1,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 3,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E1-04',
                'nombre' => 'Constancia de Buena Conducta',
                'descripcion' => 'Expedida por la Dirección o Coordinación de tu Unidad Académica (Art. 203).',
                'etapa' => 1,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 4,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E1-05',
                'nombre' => 'Acta de Registro de Tema y Asesor',
                'descripcion' => 'Documento oficial emitido por la Facultad donde se aprueba tu tema y se designa a tu Director(a) (Art. 350, Fracc. I).',
                'etapa' => 1,
                'es_sistema' => true,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 5,
                'activo' => true,
            ],

            // ETAPA 2: El Desarrollo (Elaboración de la Tesis)
            [
                'clave' => 'DOC-E2-01',
                'nombre' => 'Protocolo / Anteproyecto Registrado',
                'descripcion' => 'Documento inicial cargado y aprobado en el módulo "Mi Anteproyecto". Vinculado automáticamente a tu expediente.',
                'etapa' => 2,
                'es_sistema' => true,
                'es_vinculo_anteproyecto' => true,
                'obligatorio' => true,
                'orden' => 1,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E2-02',
                'nombre' => 'Carta Protesta de Honestidad e Integridad',
                'descripcion' => 'Aceptación expresa de que el trabajo es inédito y original; si se detecta plagio se anula el grado (Art. 242, Fracc. XIII).',
                'etapa' => 2,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 2,
                'activo' => true,
            ],

            // ETAPA 3: La Revisión (Aprobación del Trabajo)
            [
                'clave' => 'DOC-E3-01',
                'nombre' => 'Acta de Revisión y Aprobación de Tesis',
                'descripcion' => 'Firmada por tu Director(a) o Comité Tutorial certificando que el trabajo cumple requisitos de fondo y forma (Art. 350, Fracc. II).',
                'etapa' => 3,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 1,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E3-02',
                'nombre' => 'Oficios de Asignación del Jurado',
                'descripcion' => 'Designación oficial de los 5 integrantes del jurado (3 titulares y 2 suplentes: Presidente, Secretario y Vocales) (Art. 350, Fracc. III).',
                'etapa' => 3,
                'es_sistema' => true,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 2,
                'activo' => true,
            ],

            // ETAPA 4: El Expediente Final (Trámites previos al Examen)
            [
                'clave' => 'DOC-E4-01',
                'nombre' => 'Oficio de Entrega de Tesis en Digital',
                'descripcion' => 'Comprobante emitido por la Dirección de Desarrollo Bibliotecario al depositar la tesis en el repositorio (Art. 350, Fracc. V).',
                'etapa' => 4,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 1,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E4-02',
                'nombre' => 'Constancia de No Adeudo de Biblioteca y Laboratorio',
                'descripcion' => 'Certifica que no tienes pendientes ni adeudos de libros, material o equipo institucional (Art. 350, Fracc. IV).',
                'etapa' => 4,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 2,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E4-03',
                'nombre' => 'Comprobantes de Pago Oficiales',
                'descripcion' => 'Recibos de derechos de titulación, derecho a examen profesional y expedición de título (Art. 350, Fracc. VI).',
                'etapa' => 4,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 3,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E4-04',
                'nombre' => 'Documentación adicional (Servicios Escolares)',
                'descripcion' => 'Acta de nacimiento actualizada, CURP, fotos tamaño título e identificación oficial INE (Art. 350, Fracc. VIII).',
                'etapa' => 4,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => false,
                'orden' => 4,
                'activo' => true,
            ],
            [
                'clave' => 'DOC-E4-05',
                'nombre' => 'Acuse de Entrega de Ejemplares Impresos',
                'descripcion' => 'Constancia de entrega de los 3 a 5 ejemplares engargolados exigidos por tu Facultad para los sinodales.',
                'etapa' => 4,
                'es_sistema' => false,
                'es_vinculo_anteproyecto' => false,
                'obligatorio' => true,
                'orden' => 5,
                'activo' => true,
            ],
        ];

        foreach ($requisitos as $requisito) {
            RequisitoDocumento::updateOrCreate(
                ['clave' => $requisito['clave']],
                $requisito
            );
        }
    }
}
