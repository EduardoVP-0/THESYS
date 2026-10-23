<?php

namespace App\Mail;

use App\Models\Admin\Alumno;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

// Notificación institucional por correo electrónico con credenciales de acceso para nuevos alumnos.
class CredencialesAlumnoMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Crea una nueva instancia de mensaje.
     */
    public function __construct(
        public Alumno $alumno,
        public string $plainPassword
    ) {}

    /**
     * Define el asunto del correo que vera el alumno en su bandeja de entrada
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Bienvenido a THESYS UNACH - Tus Credenciales de Acceso',
        );
    }

    /**
     * Define qué plantilla blade utilizara el diseño visual del correo.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.credenciales',
        );
    }

    /**
     * Obtiene los archivos adjuntos.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
