<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Alumno;
use App\Models\Admin\Proyecto;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE MI ANTEPROYECTO (PORTAL DEL SUSTENTANTE)
 * Gestiona el guardado en borrador, envio oficial a revision y consulta del estado del anteproyecto
 */
class AnteproyectoController extends Controller
{
    /**
     * Muestra el formulario de Mi Anteproyecto y la linea del tiempo de su estado.
     */
    public function index(Request $request): Response
    {
        $alumno = Alumno::with('carrera')->find($request->user()->id);

        $proyecto = $alumno
            ? $alumno->proyectos()->with(['asesores.user', 'revisores.user'])->latest('tblproyectos.id_proyecto')->first()
            : null;

        $proyectoData = null;

        if ($proyecto) {
            $tieneDocumento = (bool) ($proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '');
            $esEditable = in_array($proyecto->estado, Proyecto::ESTADOS_EDITABLES, true);

            $proyectoData = [
                'id_proyecto' => $proyecto->id_proyecto,
                'titulo' => $proyecto->titulo,
                'resumen' => $proyecto->resumen ?? '',
                'estado' => $proyecto->estado,
                'fecha_envio' => $proyecto->fecha_envio?->toIso8601String(),
                'fecha_envio_formateada' => $proyecto->fecha_envio?->format('d/m/Y H:i'),
                'updated_at' => $proyecto->updated_at?->toIso8601String(),
                'updated_at_formateada' => $proyecto->updated_at?->format('d/m/Y H:i'),
                'ruta_documento' => $proyecto->ruta_documento,
                'nombre_documento' => $tieneDocumento ? basename($proyecto->ruta_documento) : null,
                'url_documento' => $tieneDocumento ? route('alumno.anteproyecto.documento') : null,
                'observaciones_coordinacion' => $proyecto->observaciones_coordinacion,
                'editable' => $esEditable,
                'asesor' => $proyecto->asesor_asignado ? [
                    'nombre_completo' => $proyecto->asesor_asignado->nombre_completo,
                    'grado_academico' => $proyecto->asesor_asignado->grado_academico,
                    'email' => $proyecto->asesor_asignado->user?->email,
                ] : null,
            ];
        }

        return Inertia::render('Alumno/anteproyecto/index', [
            'proyecto' => $proyectoData,
            'alumno' => $alumno ? [
                'id_usuario' => $alumno->id_usuario,
                'nombre_completo' => $alumno->nombre_completo,
                'matricula' => $alumno->matricula,
                'carrera' => $alumno->carrera?->nombre_carrera ?? 'Sin carrera asignada',
            ] : null,
        ]);
    }

    /**
     * Guarda o actualiza el anteproyecto en modo Borrador (o mantiene Con cambios mientras edita)
     */
    public function guardarBorrador(Request $request): RedirectResponse
    {
        $alumno = Alumno::find($request->user()->id);

        if (! $alumno) {
            return redirect()->back()
                ->with('error', 'No se encontró un expediente de alumno vinculado a tu cuenta de usuario.');
        }

        $proyecto = $alumno->proyectos()->latest('tblproyectos.id_proyecto')->first();

        if ($proyecto && ! in_array($proyecto->estado, Proyecto::ESTADOS_EDITABLES, true)) {
            return redirect()->back()
                ->with('error', 'No puedes modificar el anteproyecto mientras se encuentra en revisión o una vez aprobado.');
        }

        $validated = $request->validate([
            'titulo' => ['required', 'string', 'min:5', 'max:255'],
            'resumen' => ['nullable', 'string', 'max:2000'],
            'documento' => ['nullable', 'file', 'mimes:pdf', 'max:2048'],
        ], [
            'titulo.required' => 'Ingresa al menos un título preliminar para poder guardar tu borrador.',
            'titulo.min' => 'El título debe contener al menos 5 caracteres.',
            'titulo.max' => 'El título no puede exceder los 255 caracteres.',
            'resumen.max' => 'El resumen no puede exceder los 2,000 caracteres.',
            'documento.mimes' => 'El documento adjunto debe estar estrictamente en formato PDF.',
            'documento.max' => 'El archivo PDF no debe superar el tamaño máximo permitido de 2 MB.',
        ]);

        $rutaDocumento = $proyecto?->ruta_documento;

        if ($request->hasFile('documento')) {
            $rutaDocumento = $this->almacenarPdfEnSupabase(
                $request->file('documento'),
                $alumno->matricula,
                $proyecto?->ruta_documento
            );
        }

        DB::transaction(function () use ($alumno, $proyecto, $validated, $rutaDocumento): void {
            $estadoConservar = $proyecto && $proyecto->estado === Proyecto::ESTADO_CON_CAMBIOS
                ? Proyecto::ESTADO_CON_CAMBIOS
                : Proyecto::ESTADO_BORRADOR;

            if ($proyecto) {
                $proyecto->update([
                    'titulo' => trim($validated['titulo']),
                    'resumen' => isset($validated['resumen']) ? trim($validated['resumen']) : null,
                    'estado' => $estadoConservar,
                    'ruta_documento' => $rutaDocumento,
                ]);
            } else {
                $nuevoProyecto = Proyecto::create([
                    'titulo' => trim($validated['titulo']),
                    'resumen' => isset($validated['resumen']) ? trim($validated['resumen']) : null,
                    'estado' => Proyecto::ESTADO_BORRADOR,
                    'fecha_envio' => null,
                    'ruta_documento' => $rutaDocumento,
                ]);

                $alumno->proyectos()->attach($nuevoProyecto->id_proyecto);
            }
        });

        return redirect()->route('alumno.anteproyecto.index')
            ->with('success', 'Borrador guardado correctamente. Tus datos se cargarán automáticamente cuando vuelvas a ingresar.');
    }

    /**
     * Envia oficialmente el anteproyecto a revision por la coordinacion academica
     * Una vez enviado, el formulario queda bloqueado hasta recibir dictamen
     */
    public function enviarRevision(Request $request): RedirectResponse
    {
        $alumno = Alumno::find($request->user()->id);

        if (! $alumno) {
            return redirect()->back()
                ->with('error', 'No se encontró un expediente de alumno vinculado a tu cuenta de usuario.');
        }

        $proyecto = $alumno->proyectos()->latest('tblproyectos.id_proyecto')->first();

        if ($proyecto && ! in_array($proyecto->estado, Proyecto::ESTADOS_EDITABLES, true)) {
            return redirect()->back()
                ->with('error', 'Tu anteproyecto ya fue enviado y no admite modificaciones en su estado actual.');
        }

        $tieneDocumentoPrevio = (bool) ($proyecto && $proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '');

        $validated = $request->validate([
            'titulo' => ['required', 'string', 'min:10', 'max:255'],
            'resumen' => ['required', 'string', 'min:30', 'max:2000'],
            'documento' => [$tieneDocumentoPrevio ? 'nullable' : 'required', 'file', 'mimes:pdf', 'max:2048'],
        ], [
            'titulo.required' => 'El título del proyecto es obligatorio para enviarlo a revisión.',
            'titulo.min' => 'El título definitivo debe tener al menos 10 caracteres.',
            'titulo.max' => 'El título no puede exceder los 255 caracteres.',
            'resumen.required' => 'El resumen ejecutivo es obligatorio para enviar tu propuesta a revisión.',
            'resumen.min' => 'El resumen debe describir tu propuesta con al menos 30 caracteres.',
            'resumen.max' => 'El resumen no puede exceder los 2,000 caracteres.',
            'documento.required' => 'Debes adjuntar el documento PDF de tu anteproyecto para enviarlo a revisión.',
            'documento.mimes' => 'El archivo del anteproyecto debe estar únicamente en formato PDF.',
            'documento.max' => 'El archivo PDF no debe superar el límite máximo de 2 MB (2,048 KB).',
        ]);

        $rutaDocumento = $proyecto?->ruta_documento;

        if ($request->hasFile('documento')) {
            $rutaDocumento = $this->almacenarPdfEnSupabase(
                $request->file('documento'),
                $alumno->matricula,
                $proyecto?->ruta_documento
            );
        }

        DB::transaction(function () use ($alumno, $proyecto, $validated, $rutaDocumento): void {
            if ($proyecto) {
                $proyecto->update([
                    'titulo' => trim($validated['titulo']),
                    'resumen' => trim($validated['resumen']),
                    'estado' => Proyecto::ESTADO_EN_REVISION,
                    'fecha_envio' => now(),
                    'ruta_documento' => $rutaDocumento,
                ]);
            } else {
                $nuevoProyecto = Proyecto::create([
                    'titulo' => trim($validated['titulo']),
                    'resumen' => trim($validated['resumen']),
                    'estado' => Proyecto::ESTADO_EN_REVISION,
                    'fecha_envio' => now(),
                    'ruta_documento' => $rutaDocumento,
                ]);

                $alumno->proyectos()->attach($nuevoProyecto->id_proyecto);
            }
        });

        return redirect()->route('alumno.anteproyecto.index')
            ->with('success', 'Tu anteproyecto ha sido enviado oficialmente a revisión. La edición permanecerá bloqueada mientras la coordinación evalúa tu propuesta.');
    }

    /**
     * Visualiza en línea el documento PDF actual del anteproyecto del alumno desde Supabase Storage.
     */
    public function verDocumento(Request $request): SymfonyResponse
    {
        $alumno = Alumno::find($request->user()->id);
        $proyecto = $alumno?->proyectos()->latest('tblproyectos.id_proyecto')->first();

        abort_unless(
            $proyecto && $proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '',
            404,
            'Aún no tienes un documento PDF adjunto en tu anteproyecto.'
        );

        $filename = basename($proyecto->ruta_documento);

        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');

        $ruta = $proyecto->ruta_documento;
        if (! $s3->exists($ruta)) {
            $rutaConCarpeta = 'anteproyectos/'.ltrim($ruta, '/');
            if ($s3->exists($rutaConCarpeta)) {
                $ruta = $rutaConCarpeta;
            }
        }

        abort_unless(
            $s3->exists($ruta),
            404,
            "El archivo físico \"{$filename}\" no fue localizado en el almacenamiento en la nube."
        );

        return $s3->response(
            $ruta,
            $filename,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ]
        );
    }

    /**
     * Sube el PDF del anteproyecto a Supabase Storage y elimina el archivo previo si existía.
     */
    private function almacenarPdfEnSupabase(UploadedFile $archivo, string $matricula, ?string $rutaPrevia = null): string
    {
        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');

        if ($rutaPrevia && trim($rutaPrevia) !== '') {
            if ($s3->exists($rutaPrevia)) {
                $s3->delete($rutaPrevia);
            } else {
                $rutaConCarpeta = 'anteproyectos/'.ltrim($rutaPrevia, '/');
                if ($s3->exists($rutaConCarpeta)) {
                    $s3->delete($rutaConCarpeta);
                }
            }
        }

        $nombreOriginal = pathinfo($archivo->getClientOriginalName(), PATHINFO_FILENAME);
        $nombreLimpio = Str::slug($nombreOriginal, '_') ?: 'anteproyecto';
        $nombreLimpio = Str::limit($nombreLimpio, 60, '');
        $nombreFinal = "{$matricula}_{$nombreLimpio}_".time().'.pdf';

        return $archivo->storeAs('anteproyectos', $nombreFinal, 's3');
    }
}

