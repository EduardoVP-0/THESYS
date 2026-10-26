<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocenteRequest;
use App\Http\Requests\UpdateDocenteRequest;
use App\Mail\CredencialesDocenteMail;
use App\Models\Admin\Docente;
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
 * CONTROLADOR DE GESTIÓN DE DOCENTES (MÓDULO ADMINISTRATIVO)
 * Maneja el ciclo de vida completo del personal docente
 */
class DocenteController extends Controller
{
    /**
     * Muestra la pantalla principal con la tabla de docentes, metricas y filtros
     */
    public function index(Request $request): Response
    {
        $query = Docente::with('user');
        // Buscador global (Nombre, Apellidos, Cedula, CURP, Especialidad o Correo)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('apellido_p', 'like', "%{$search}%")
                    ->orWhere('apellido_m', 'like', "%{$search}%")
                    ->orWhere('cedula_profesional', 'like', "%{$search}%")
                    ->orWhere('curp', 'like', "%{$search}%")
                    ->orWhere('especialidad', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($qu) use ($search) {
                        $qu->where('email', 'like', "%{$search}%");
                    });
            });
        }
        // Filtro por Grado Academico
        if ($request->filled('grado') && $request->input('grado') !== 'todos') {
            $query->where('grado_academico', $request->input('grado'));
        }
        // Filtro por Tipo de Contrato
        if ($request->filled('contrato') && $request->input('contrato') !== 'todos') {
            $query->where('tipo_contrato', $request->input('contrato'));
        }
        // Filtro por Estado de Cuenta (Activo / Suspendido)
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $estadoBool = $request->input('estado') === 'activo';
            $query->whereHas('user', fn ($q) => $q->where('estado', $estadoBool));
        }
        // Paginacion de 6 docentes por pagina conservando parametros de filtro
        $docentes = $query->latest('created_at')->paginate(6)->withQueryString();
        // Metricas para las Cards superiores
        $stats = [
            'total' => Docente::count(),
            'activos' => Docente::whereHas('user', fn ($q) => $q->where('estado', true))->count(),
            'posgrado' => Docente::whereIn('grado_academico', ['Maestría', 'Doctorado', 'Especialidad'])->count(),
            'tiempo_completo' => Docente::where('tipo_contrato', 'Tiempo completo')->count(),
        ];

        return Inertia::render('admin/docentes/index', [
            'docentes' => $docentes,
            'stats' => $stats,
            'filters' => $request->only(['search', 'grado', 'contrato', 'estado']),
        ]);
    }

    /**
     * Guarda el nuevo docente en la base de datos
     * Crea primero la cuenta en `users` (con rol 4 = Docente) y después el registro en `tbldocentes`.
     */
    public function store(StoreDocenteRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        // Generamos una contraseña temporal segura de 12 caracteres
        $plainPassword = Str::password(length: 12, letters: true, numbers: true, symbols: true, spaces: false);
        // Transaccion de base de datos para garantizar consistencia entre ambas tablas
        $docente = DB::transaction(function () use ($validated, $plainPassword) {
            $nombreCompleto = trim("{$validated['nombre']} {$validated['apellido_p']} {$validated['apellido_m']}");
            // Registro en `users`
            $user = User::create([
                'name' => $nombreCompleto,
                'email' => strtolower($validated['email']),
                'password' => $plainPassword,
                'id_rol' => 4, // Rol 4 = Docente
                'estado' => true,
            ]);
            // Registro en `tbldocentes`
            $docenteData = $validated;
            $docenteData['id_usuario'] = $user->id;
            $docenteData['id_usuario_registro'] = Auth::id();
            $docenteData['estado'] = true;

            return Docente::create($docenteData);
        });
        $docente->load('user');
        // Envio de correo institucional con credenciales
        try {
            Mail::to($validated['email'])->send(new CredencialesDocenteMail($docente, $plainPassword));
            Log::info("Correo de credenciales enviado exitosamente al docente: {$validated['email']}");
        } catch (\Throwable $e) {
            Log::error("Error al enviar correo de credenciales al docente: {$e->getMessage()}");
        }

        return redirect()->route('admin.docentes.index')
            ->with('success', 'Docente registrado exitosamente en el sistema.');
    }

    /**
     * Actualiza la informacion del docente en `users` y `tbldocentes`.
     */
    public function update(UpdateDocenteRequest $request, Docente $docente): RedirectResponse
    {
        $validated = $request->validated();
        DB::transaction(function () use ($validated, $docente) {
            $nombreCompleto = trim("{$validated['nombre']} {$validated['apellido_p']} {$validated['apellido_m']}");
            $docente->user->update([
                'name' => $nombreCompleto,
                'email' => strtolower($validated['email']),
            ]);
            $docente->update($validated);
        });

        return redirect()->route('admin.docentes.index')
            ->with('success', 'Información del docente actualizada correctamente.');
    }

    /**
     * Alterna el estado de acceso de la cuenta del docente (Activo / Suspendido).
     */
    public function toggleStatus(Docente $docente): RedirectResponse
    {
        $user = $docente->user;
        $nuevoEstado = ! $user->estado;
        $user->update(['estado' => $nuevoEstado]);
        $docente->update(['estado' => $nuevoEstado]);
        $mensaje = $nuevoEstado
            ? 'Acceso del docente activado exitosamente.'
            : 'Acceso del docente suspendido exitosamente.';

        return redirect()->route('admin.docentes.index')
            ->with('success', $mensaje);
    }
}
