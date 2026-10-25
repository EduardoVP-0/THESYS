<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Proyecto;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * CONTROLADOR DE VALIDACION DE ANTEPROYECTOS
 * Permite a la coordinacion academica revisar, aprobar o solicitar cambios a las propuestas iniciales
 */
class AnteproyectoController extends Controller
{
    /**
     * Muestra la bandeja de anteproyectos con metricas, filtros y panel de revision
     */
    public function index(Request $request): Response
    {
        $query = Proyecto::with(['alumnos.user', 'alumnos.carrera', 'asesores.user']);

        // Buscador reactivo por titulo, nombre del sustentante, matricula o correo
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', "%{$search}%")
                    ->orWhere('resumen', 'like', "%{$search}%")
                    ->orWhereHas('alumnos', function ($qa) use ($search) {
                        $qa->where('nombre', 'like', "%{$search}%")
                            ->orWhere('apellido_p', 'like', "%{$search}%")
                            ->orWhere('apellido_m', 'like', "%{$search}%")
                            ->orWhere('matricula', 'like', "%{$search}%")
                            ->orWhereHas('user', function ($qu) use ($search) {
                                $qu->where('email', 'like', "%{$search}%");
                            });
                    });
            });
        }

        // Filtro por Estado (Borrador, En revision, Aprobado, Con cambios)
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado', $request->input('estado'));
        }

        // Paginacion de 6 anteproyectos por pagina
        $anteproyectos = $query->latest('id_proyecto')->paginate(6)->withQueryString();

        // 5 Fichas de Metricas superiores
        $stats = [
            'total' => Proyecto::count(),
            'en_revision' => Proyecto::where('estado', 'En revisión')->count(),
            'aprobados' => Proyecto::where('estado', 'Aprobado')->count(),
            'con_cambios' => Proyecto::where('estado', 'Con cambios')->count(),
            'sin_asesor' => Proyecto::doesntHave('asesores')->count(),
        ];

        return Inertia::render('admin/anteproyectos/index', [
            'anteproyectos' => $anteproyectos,
            'stats' => $stats,
            'filters' => $request->only(['search', 'estado']),
        ]);
    }

    /**
     * Aprueba el anteproyecto autorizando al alumno a continuar el proceso de titulacion
     */
    public function aprobar(Request $request, Proyecto $proyecto): RedirectResponse
    {
        if ($proyecto->estado === 'Borrador') {
            return redirect()->route('admin.anteproyectos.index')
                ->with('error', 'No se puede aprobar un anteproyecto que se encuentra en fase de borrador. El alumno debe enviarlo formalmente primero.');
        }

        $validated = $request->validate([
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);

        $proyecto->update([
            'estado' => 'Aprobado',
            'observaciones_coordinacion' => $validated['observaciones'] ?? $proyecto->observaciones_coordinacion,
        ]);

        return redirect()->route('admin.anteproyectos.index')
            ->with('success', "El anteproyecto \"{$proyecto->titulo}\" ha sido aprobado exitosamente.");
    }

    /**
     * Solicita cambios al sustentante y registra las observaciones de la coordinacion
     */
    public function solicitarCambios(Request $request, Proyecto $proyecto): RedirectResponse
    {
        if ($proyecto->estado === 'Borrador') {
            return redirect()->route('admin.anteproyectos.index')
                ->with('error', 'No se pueden solicitar cambios a un anteproyecto en borrador. El sustentante aún no lo envía para su dictamen.');
        }

        $validated = $request->validate([
            'observaciones' => ['required', 'string', 'min:5', 'max:2000'],
        ], [
            'observaciones.required' => 'Debes ingresar las observaciones para orientar al alumno sobre los cambios requeridos.',
            'observaciones.min' => 'Las observaciones deben contener al menos 5 caracteres.',
        ]);

        $proyecto->update([
            'estado' => 'Con cambios',
            'observaciones_coordinacion' => $validated['observaciones'],
        ]);

        return redirect()->route('admin.anteproyectos.index')
            ->with('success', "Se han solicitado cambios al anteproyecto \"{$proyecto->titulo}\". El alumno podrá corregir su propuesta.");
    }

    /**
     * Visualiza o transmite el documento PDF del anteproyecto desde Supabase Storage.
     */
    public function verDocumento(Proyecto $proyecto): SymfonyResponse
    {
        abort_unless(
            $proyecto->ruta_documento && trim($proyecto->ruta_documento) !== '',
            404,
            'Este anteproyecto aún no cuenta con un documento PDF adjunto.'
        );

        $filename = basename($proyecto->ruta_documento);

        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');

        abort_unless(
            $s3->exists($proyecto->ruta_documento),
            404,
            "El archivo físico \"{$filename}\" no fue encontrado en el almacenamiento en la nube. Contacte al sustentante para que vuelva a adjuntarlo."
        );

        return $s3->response(
            $proyecto->ruta_documento,
            $filename,
            [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$filename.'"',
            ]
        );
    }
}
