<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Oficios_Oficiales;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class OficiosOficialesController extends Controller
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

    public function index(Request $request): Response
    {
        $query = Oficios_Oficiales::query();

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

        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado', $request->input('estado') === '1');
        }

        $oficios = $query->orderBy('id_oficio_oficial', 'desc')
            ->paginate(6)
            ->withQueryString();

        $oficios->getCollection()->transform(function ($oficio) {
            if ($oficio->url_archivo && str_contains($oficio->url_archivo, 'supabase.co')) {
                $filename = basename($oficio->url_archivo);
                $oficio->url_archivo = route('admin.oficios_oficiales.documento', [
                    'id' => $oficio->id_oficio_oficial,
                    'filename' => $filename,
                ]);
            }

            return $oficio;
        });

        $pendientesPorTipo = Oficios_Oficiales::where('estado', false)
            ->selectRaw('tipo, count(*) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo')
            ->toArray();

        return Inertia::render('admin/oficios_oficiales/index', [
            'oficios' => $oficios,
            'pendientesPorTipo' => $pendientesPorTipo,
            'filters' => $request->only(['search', 'estado', 'tipo']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'nombre_oficio' => 'required|string|max:100',
            'tipo' => 'required|string',
            'archivo' => 'required|file|mimes:pdf|max:20480',
        ]);

        // 1. Guarda el archivo en Supabase Storage (disco S3, bucket anteproyectos en la carpeta oficios)
        $path = $request->file('archivo')->store('oficios', 's3');

        // 2. Genera la URL en Supabase S3
        $urlCompleta = $this->s3()->url($path);

        // 3. Guarda la URL de Supabase y los datos en la base de datos
        Oficios_Oficiales::create([
            'nombre_oficio' => $request->nombre_oficio,
            'tipo' => $request->tipo,
            'url_archivo' => $urlCompleta,
            'estado' => $request->estado ?? true,
        ]);

        return redirect()->back()->with('success', 'Oficio oficial registrado correctamente en Supabase.');
    }

    public function update(Request $request, int|string $id): RedirectResponse
    {
        $oficio = Oficios_Oficiales::findOrFail($id);

        $request->validate([
            'nombre_oficio' => 'required|string|max:100',
            'tipo' => 'required|string',
            'archivo' => 'nullable|file|mimes:pdf|max:20480',
            'estado' => 'nullable',
        ]);

        $data = [
            'nombre_oficio' => $request->nombre_oficio,
            'tipo' => $request->tipo,
            'estado' => $request->boolean('estado', true),
        ];

        if ($request->hasFile('archivo')) {
            // Eliminar archivo anterior de S3 si existía
            if ($oficio->url_archivo && str_contains($oficio->url_archivo, 'supabase.co')) {
                $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');
                $oldPath = Str::after($oficio->url_archivo, "/{$bucket}/");
                if ($oldPath && $this->s3()->exists($oldPath)) {
                    $this->s3()->delete($oldPath);
                }
            }

            $path = $request->file('archivo')->store('oficios', 's3');
            $data['url_archivo'] = $this->s3()->url($path);
        }

        $oficio->update($data);

        return redirect()->back()->with('success', 'Oficio oficial actualizado correctamente.');
    }

    public function toggleStatus(int|string $id): RedirectResponse
    {
        $oficio = Oficios_Oficiales::findOrFail($id);
        $oficio->update([
            'estado' => ! $oficio->estado,
        ]);

        $mensaje = $oficio->estado
            ? 'Oficio oficial activado exitosamente.'
            : 'Oficio oficial desactivado exitosamente.';

        return redirect()->back()->with('success', $mensaje);
    }

    public function destroy(int|string $id): RedirectResponse
    {
        $oficio = Oficios_Oficiales::findOrFail($id);

        // Si el archivo físico está en S3, eliminarlo
        if ($oficio->url_archivo && str_contains($oficio->url_archivo, 'supabase.co')) {
            $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');
            $path = Str::after($oficio->url_archivo, "/{$bucket}/");
            if ($path && $this->s3()->exists($path)) {
                $this->s3()->delete($path);
            }
        }

        $oficio->delete();

        return redirect()->back()->with('success', 'Oficio oficial eliminado correctamente.');
    }

    /**
     * Visualiza o transmite el documento PDF del oficio oficial desde Supabase Storage.
     */
    public function verDocumento(int|string $id, ?string $filename = null): SymfonyResponse
    {
        $oficio = Oficios_Oficiales::findOrFail($id);

        if ($oficio->url_archivo && str_contains($oficio->url_archivo, 'supabase.co')) {
            $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');
            $path = Str::after($oficio->url_archivo, "/{$bucket}/");
            $s3 = $this->s3();

            abort_unless(
                $path && $s3->exists($path),
                404,
                'El documento físico no fue encontrado en el almacenamiento en la nube de Supabase.'
            );

            $downloadName = $filename ?: basename($path);

            return $s3->response($path, $downloadName, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="'.$downloadName.'"',
            ]);
        }

        // Retrocompatibilidad con archivos locales previos
        $localPath = str_replace('/storage/', '', $oficio->url_archivo);
        if (Storage::disk('public')->exists($localPath)) {
            return response()->file(storage_path('app/public/'.$localPath));
        }

        abort(404, 'Documento no encontrado.');
    }
}
