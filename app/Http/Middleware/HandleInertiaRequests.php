<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user()?->load('rol'),
                'docente' => fn () => $this->resolveDocenteRoles($request),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    /**
     * Determina qué funciones tiene asignadas el docente autenticado (asesor, revisor y/o jurado).
     * Se resuelve en una sola consulta con EXISTS para mantener la carga mínima en cada petición.
     *
     * @return array{es_asesor: bool, es_revisor: bool, es_jurado: bool}|null
     */
    protected function resolveDocenteRoles(Request $request): ?array
    {
        $user = $request->user();

        if (! $user || (int) $user->id_rol !== 4) {
            return null;
        }

        $roles = DB::selectOne(
            'SELECT
                EXISTS (SELECT 1 FROM tblasesores_proyectos WHERE id_usuario = ?) AS es_asesor,
                EXISTS (SELECT 1 FROM tblrevisores_proyectos WHERE id_usuario = ?) AS es_revisor,
                EXISTS (SELECT 1 FROM tbljurados_proyectos WHERE id_usuario = ?) AS es_jurado',
            [$user->id, $user->id, $user->id]
        );

        return [
            'es_asesor' => (bool) $roles->es_asesor,
            'es_revisor' => (bool) $roles->es_revisor,
            'es_jurado' => (bool) $roles->es_jurado,
        ];
    }
}
