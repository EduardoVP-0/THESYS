<?php

namespace App\Http\Controllers\Alumno;

use App\Http\Controllers\Controller;
use App\Models\Admin\Oficios_Oficiales;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class OficioOficialController extends Controller
{
    /**
     * Obtiene el adaptador del disco S3 de Supabase con tipado estricto.
     */
    private function s3(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('s3');

        return $disk;
    }

    /**
     * Muestra el catálogo de oficios oficiales activos para el alumno.
     */
    public function index(Request $request): Response
    {
        $query = Oficios_Oficiales::with('usuario_registro:id,name')
            ->where('estado', true);

        if ($request->filled('tipo')) {
            $tipo = $request->input('tipo');
            $query->where(function ($q) use ($tipo) {
                $q->where('tipo', 'like', "%{$tipo}%")
                    ->orWhereRaw('LOWER(tipo) LIKE LOWER(?)', ["%{$tipo}%"]);
            });
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre_oficio', 'like', "%{$search}%")
                    ->orWhere('tipo', 'like', "%{$search}%");
            });
        }

        $oficios = $query->orderBy('id_oficio_oficial', 'desc')
            ->paginate(6)
            ->withQueryString();

        $oficios->getCollection()->transform(function ($oficio) {
            if ($oficio->url_archivo && trim($oficio->url_archivo) !== '') {
                $filename = basename($oficio->url_archivo);
                $oficio->url_archivo = route('alumno.oficios_oficiales.documento', [
                    'id' => $oficio->id_oficio_oficial,
                    'filename' => $filename,
                ]);
            }

            return $oficio;
        });

        return Inertia::render('Alumno/oficios_oficiales/index', [
            'oficios' => $oficios,
            'filters' => $request->only(['search', 'tipo']),
        ]);
    }

    /**
     * Visualiza o transmite el documento PDF del oficio oficial desde Supabase Storage para el alumno.
     */
    public function verDocumento(int|string $id, ?string $filename = null): SymfonyResponse
    {
        $oficio = Oficios_Oficiales::where('estado', true)->findOrFail($id);

        if ($oficio->url_archivo && trim($oficio->url_archivo) !== '') {
            $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');
            $s3 = $this->s3();
            $pureFilename = basename($oficio->url_archivo);

            $candidates = [
                "oficios/{$pureFilename}",
                $oficio->url_archivo,
                Str::after($oficio->url_archivo, "/{$bucket}/"),
                $pureFilename,
            ];

            $resolvedPath = null;
            foreach ($candidates as $cand) {
                if ($cand && $s3->exists($cand)) {
                    $resolvedPath = $cand;
                    break;
                }
            }

            abort_unless(
                $resolvedPath !== null,
                404,
                'El documento físico no fue encontrado en el almacenamiento en la nube de Supabase.'
            );

            $downloadName = $filename ?: $pureFilename;

            return $s3->response($resolvedPath, $downloadName, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$downloadName.'"',
            ]);
        }

        $localPath = str_replace('/storage/', '', $oficio->url_archivo);
        if (Storage::disk('public')->exists($localPath)) {
            return response()->file(storage_path('app/public/'.$localPath));
        }

        abort(404, 'Documento no encontrado.');
    }
}
