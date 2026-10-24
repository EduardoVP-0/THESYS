<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAdministradorRequest;
use App\Http\Requests\UpdateAdministradorRequest;
use App\Mail\CredencialesAdministradorMail;
use App\Models\Admin\Administrador;
use App\Models\Roles;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CONTROLADOR DE GESTIÓN DE ADMINISTRADORES (MÓDULO ADMINISTRATIVO)
 * Maneja el ciclo de vida completo del personal administrativo
 */
class AdministradorController extends Controller
{
    /**
     * Muestra la pantalla principal con la tabla de administradores, métricas y filtros
     */
    public function index(Request $request): Response
    {
        $query = Administrador::with('user');

        // Buscador global (Nombre, Apellidos, Área o Correo)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('apellido_p', 'like', "%{$search}%")
                    ->orWhere('apellido_m', 'like', "%{$search}%")
                    ->orWhere('area', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($qu) use ($search) {
                        $qu->where('email', 'like', "%{$search}%");
                    });
            });
        }

        // Filtro por Rol (1=Superadmin, 2=Administrador, 3=Coordinación)
        if ($request->filled('rol') && $request->input('rol') !== 'todos') {
            $query->whereHas('user', fn ($q) => $q->where('id_rol', $request->input('rol')));
        }

        // Filtro por Estado de Cuenta (Activo / Suspendido)
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $estadoBool = $request->input('estado') === 'activo';
            $query->whereHas('user', fn ($q) => $q->where('estado', $estadoBool));
        }

        // Paginación de 6 administradores por página conservando parámetros de filtro
        $administradores = $query->latest('created_at')->paginate(6)->withQueryString();

        // Métricas para las Cards superiores
        $stats = [
            'total' => Administrador::count(),
            'activos' => Administrador::whereHas('user', fn ($q) => $q->where('estado', true))->count(),
            'admins' => Administrador::whereHas('user', fn ($q) => $q->where('id_rol', 2))->count(),
            'coordinacion' => Administrador::whereHas('user', fn ($q) => $q->where('id_rol', 3))->count(),
        ];

        // Catalogo de roles administrativos asignables (2=Administrador, 3=Coordinacion)
        // Por seguridad, el rol 1 (Superadmin) se excluye de la creacion y edición manual
        $roles = Roles::whereIn('id_rol', [2, 3])
            ->orderBy('id_rol')
            ->get(['id_rol', 'nombre_rol']);

        return Inertia::render('admin/administradores/index', [
            'administradores' => $administradores,
            'stats' => $stats,
            'roles' => $roles,
            'filters' => $request->only(['search', 'rol', 'estado']),
        ]);
    }

    /**
     * Guarda el nuevo administrador en la base de datos
     * Crea primero la cuenta en `users` (con el rol seleccionado 1-3) y después el registro en `tbladministradores`.
     */
    public function store(StoreAdministradorRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Generamos una contraseña temporal segura de 12 caracteres
        $plainPassword = Str::password(length: 12, letters: true, numbers: true, symbols: true, spaces: false);

        // Transacción de base de datos para garantizar consistencia entre ambas tablas
        $administrador = DB::transaction(function () use ($validated, $plainPassword) {
            $nombreCompleto = trim("{$validated['nombre']} {$validated['apellido_p']} {$validated['apellido_m']}");

            // Registro en `users`
            $user = User::create([
                'name' => $nombreCompleto,
                'email' => strtolower($validated['email']),
                'password' => $plainPassword,
                'id_rol' => $validated['id_rol'], // Rol dinámico: 1, 2 o 3
                'estado' => true,
            ]);

            // Registro en `tbladministradores`
            return Administrador::create([
                'id_usuario' => $user->id,
                'id_usuario_registro' => Auth::id(),
                'nombre' => $validated['nombre'],
                'apellido_p' => $validated['apellido_p'],
                'apellido_m' => $validated['apellido_m'],
                'telefono' => $validated['telefono'] ?? null,
                'area' => $validated['area'],
                'estado' => true,
            ]);
        });

        $administrador->load('user');

        // Envío de correo institucional con credenciales
        try {
            Mail::to($validated['email'])->send(new CredencialesAdministradorMail($administrador, $plainPassword));
        } catch (\Throwable $e) {
            Log::error("Error al enviar correo de credenciales al administrador: {$e->getMessage()}");
        }

        return redirect()->route('admin.administradores.index')
            ->with('success', 'Administrador registrado exitosamente en el sistema.');
    }

    /**
     * Actualiza la información del administrador en `users` y `tbladministradores`.
     */
    public function update(UpdateAdministradorRequest $request, Administrador $administrador): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $administrador) {
            $nombreCompleto = trim("{$validated['nombre']} {$validated['apellido_p']} {$validated['apellido_m']}");

            $administrador->user->update([
                'name' => $nombreCompleto,
                'email' => strtolower($validated['email']),
                'id_rol' => $validated['id_rol'],
            ]);

            $administrador->update([
                'nombre' => $validated['nombre'],
                'apellido_p' => $validated['apellido_p'],
                'apellido_m' => $validated['apellido_m'],
                'telefono' => $validated['telefono'] ?? null,
                'area' => $validated['area'],
            ]);
        });

        return redirect()->route('admin.administradores.index')
            ->with('success', 'Información del administrador actualizada correctamente.');
    }

    /**
     * Alterna el estado de acceso de la cuenta del administrador (Activo / Suspendido).
     */
    public function toggleStatus(Administrador $administrador): RedirectResponse
    {
        $user = $administrador->user;
        $nuevoEstado = ! $user->estado;
        $user->update(['estado' => $nuevoEstado]);
        $administrador->update(['estado' => $nuevoEstado]);

        $mensaje = $nuevoEstado
            ? 'Acceso del administrador activado exitosamente.'
            : 'Acceso del administrador suspendido exitosamente.';

        return redirect()->route('admin.administradores.index')
            ->with('success', $mensaje);
    }
}
