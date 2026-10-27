<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Resuelve y transmite documentos almacenados en Supabase o en el disco público.
 */
trait TransmiteDocumentos
{
    /**
     * Transmite un archivo PDF aplicando rutas candidatas y encabezados inline.
     */
    protected function streamDocumento(string $rawPath, string $defaultFolder = 'documentos'): SymfonyResponse
    {
        $bucket = config('filesystems.disks.s3.bucket', 'anteproyectos');

        $cleanPath = $rawPath;

        if (str_contains($cleanPath, 'http://') || str_contains($cleanPath, 'https://')) {
            $cleanPath = str_contains($cleanPath, "/{$bucket}/")
                ? Str::after($cleanPath, "/{$bucket}/")
                : basename($cleanPath);
        }

        $cleanPath = ltrim($cleanPath, '/');
        $filename = basename($cleanPath);

        $candidatePaths = array_values(array_unique([
            $cleanPath,
            "{$defaultFolder}/{$filename}",
            $filename,
        ]));

        /** @var FilesystemAdapter $s3 */
        $s3 = Storage::disk('s3');

        foreach ($candidatePaths as $candidate) {
            if ($s3->exists($candidate)) {
                return $s3->response($candidate, $filename, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="'.$filename.'"',
                ]);
            }
        }

        foreach ($candidatePaths as $candidate) {
            if (Storage::disk('public')->exists($candidate)) {
                return Storage::disk('public')->response($candidate, $filename, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="'.$filename.'"',
                ]);
            }
        }

        abort(
            404,
            "El archivo físico \"{$filename}\" no fue encontrado en el almacenamiento.",
        );
    }
}
