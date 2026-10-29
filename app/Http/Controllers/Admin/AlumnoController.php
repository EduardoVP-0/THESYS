<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAlumnoRequest;
use App\Http\Requests\UpdateAlumnoRequest;
use App\Mail\CredencialesAlumnoMail;
use App\Models\Admin\Alumno;
use App\Models\Admin\Carrera;
use App\Models\Admin\ConceptoPago;
use App\Models\Admin\Pago;
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
 * CONTROLADOR DE GESTIÓN DE ALUMNOS (MÓDULO ADMINISTRATIVO)
 * Maneja el ciclo de vida completo de los sustentantes:
 * - Creación (users + tblalumnos)
 * - Generación automática de contraseña segura
 * - Paginación, filtros avanzados y métricas en tiempo real
 */
class AlumnoController extends Controller
{
    /**
     * Muestra la pantalla principal con la tabla de alumnos, métricas y filtros
     */
    public function index(Request $request): Response
    {
        // Cargamos las relaciones user (correo, estado) y carrera (nombre de carrera)
        $query = Alumno::with(['user', 'carrera']);
        // Buscador global (Nombre, Apellidos, Matrícula, CURP o Correo Institucional)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('apellido_p', 'like', "%{$search}%")
                    ->orWhere('apellido_m', 'like', "%{$search}%")
                    ->orWhere('matricula', 'like', "%{$search}%")
                    ->orWhere('curp', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($qu) use ($search) {
                        $qu->where('email', 'like', "%{$search}%");
                    });
            });
        }
        // Filtro por Carrera
        if ($request->filled('carrera') && $request->input('carrera') !== 'todas') {
            $query->where('id_carrera', $request->input('carrera'));
        }
        // Filtro por Turno escolar (Matutino, Vespertino, Mixto)
        if ($request->filled('turno') && $request->input('turno') !== 'todos') {
            $query->where('turno', $request->input('turno'));
        }
        // Filtro por Estado Académico
        if ($request->filled('estado') && $request->input('estado') !== 'todos') {
            $query->where('estado_academico', $request->input('estado'));
        }
        // Paginación limpia de 6 alumnos por página conservando parámetros de filtro
        $alumnos = $query->latest('created_at')->paginate(6)->withQueryString();
        // Métricas para las Cards superiores del diseño
        $stats = [
            'total' => Alumno::count(),
            'activos' => Alumno::whereHas('user', fn ($q) => $q->where('estado', true))->count(),
            'egresados' => Alumno::where('estado_academico', 'Egresado')->count(),
            'bajas' => Alumno::whereIn('estado_academico', ['Baja temporal', 'Baja definitiva'])->count(),
        ];
        // Catálogo de carreras vigentes para los selectores de los modales y filtros
        $carreras = Carrera::where('estado', true)
            ->orderBy('nombre_carrera')
            ->get(['id_carrera', 'nombre_carrera']);

        return Inertia::render('admin/alumnos/index', [
            'alumnos' => $alumnos,
            'stats' => $stats,
            'carreras' => $carreras,
            'filters' => $request->only(['search', 'carrera', 'turno', 'estado']),
        ]);
    }

    /**
     * Guarda el nuevo alumno en la base de datos
     * Crea primero el usuario en `users` y después el expediente en `tblalumnos`
     */
    public function store(StoreAlumnoRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        // Generamos una contraseña aleatoria y segura de 12 caracteres
        // Str::password() de Laravel genera una combinación de letras, números y símbolos
        // sin caracteres ambiguos (0, O, l, 1) para facilitar su lectura al administrador
        $plainPassword = Str::password(length: 12, letters: true, numbers: true, symbols: true, spaces: false);
        // Transacción de BD para garantizar consistencia entre users y tblalumnos
        $alumno = DB::transaction(function () use ($validated, $plainPassword) {
            // Nombre completo para la tabla users
            $nombreCompleto = trim("{$validated['nombre']} {$validated['apellido_p']} {$validated['apellido_m']}");
            // Registro en la tabla `users` (credenciales de autenticación)
            $user = User::create([
                'name' => $nombreCompleto,
                'email' => strtolower($validated['email']),
                'password' => $plainPassword, // Encriptado automáticamente por el cast del modelo User
                'id_rol' => 5,                // Rol 5 = Alumno (Sustentante)
                'estado' => true,
            ]);
            // Registro en la tabla `tblalumnos` (expediente escolar)
            $alumnoData = $validated;
            $alumnoData['id_usuario'] = $user->id;             // Llave primaria compartida
            $alumnoData['id_usuario_registro'] = Auth::id();   // Auditoría de quién lo dio de alta
            $alumnoData['estado_academico'] = $validated['estado_academico'] ?? 'Activo';

            $alumno = Alumno::create($alumnoData);

            // Generar automáticamente los pagos iniciales del catálogo oficial
            $conceptosActivos = ConceptoPago::where('activo', true)
                ->orderBy('orden', 'asc')
                ->get();

            foreach ($conceptosActivos as $concepto) {
                Pago::create([
                    'id_usuario' => $user->id,
                    'id_concepto' => $concepto->id_concepto,
                    'concepto' => $concepto->nombre,
                    'monto' => $concepto->monto,
                    'referencia_bancaria' => null,
                    'estado_validacion' => 'Pendiente',
                ]);
            }

            return $alumno;
        });

        // Cargamos relaciones para que la plantilla de correo tenga acceso a la carrera y usuario
        $alumno->load(['user', 'carrera']);

        // Enviamos el correo institucional con las credenciales de acceso al alumno
        try {
            Mail::to($validated['email'])->send(new CredencialesAlumnoMail($alumno, $plainPassword));
        } catch (\Throwable $e) {
            // Si el servicio de correo fallara (ej: red caída), se registra en el log
            // sin romper el flujo del sistema ni impedir que el alumno quede registrado
            Log::error("Error al enviar correo de credenciales al alumno: {$e->getMessage()}");
        }

        return redirect()->route('admin.alumnos.index')
            ->with('success', 'Alumno registrado exitosamente en el sistema.');
    }

    /**
     * Actualiza la información del alumno tanto en users como en tblalumnos.
     */
    public function update(UpdateAlumnoRequest $request, Alumno $alumno): RedirectResponse
    {
        $validated = $request->validated();
        DB::transaction(function () use ($validated, $alumno) {
            // Actualizamos datos de usuario si cambió el nombre o correo
            $nombreCompleto = trim("{$validated['nombre']} {$validated['apellido_p']} {$validated['apellido_m']}");
            $alumno->user->update([
                'name' => $nombreCompleto,
                'email' => strtolower($validated['email']),
            ]);
            // Actualizamos el expediente en tblalumnos
            $alumno->update($validated);
        });

        return redirect()->route('admin.alumnos.index')
            ->with('success', 'Información del alumno actualizada correctamente.');
    }

    /**
     * Alterna el estado de acceso de la cuenta del alumno (Activo / Suspendido).
     */
    public function toggleStatus(Alumno $alumno): RedirectResponse
    {
        $user = $alumno->user;
        $nuevoEstado = ! $user->estado;
        $user->update(['estado' => $nuevoEstado]);
        $mensaje = $nuevoEstado
            ? 'Acceso del alumno activado exitosamente.'
            : 'Acceso del alumno suspendido exitosamente.';

        return redirect()->route('admin.alumnos.index')
            ->with('success', $mensaje);
    }
}
