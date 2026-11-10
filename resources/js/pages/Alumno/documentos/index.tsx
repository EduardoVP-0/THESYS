import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { 
    CheckCircle2, 
    PlayCircle, 
    ChevronDown, 
    ChevronUp,
    FileText,
    CloudUpload,
    X,
    Info,
    Clock,
    Lock,
    MessageSquare,
    Send,
    AlertCircle,
    Calendar,
    Paperclip,
    ShieldAlert
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';

export default function MisDocumentosIndex() {
    const [openStage, setOpenStage] = useState<number | null>(1);
    const [prorrogaModalOpen, setProrrogaModalOpen] = useState(false);
    const [selectedStageForProrroga, setSelectedStageForProrroga] = useState<string>('Etapa 1: Inicio de Titulación');
    
    // Estado simulado para el formulario / minichat de prórroga
    const [motivoProrroga, setMotivoProrroga] = useState('');
    const [historialChat, setHistorialChat] = useState([
        {
            emisor: 'admin',
            nombre: 'Coordinación de Titulación',
            fecha: '02/Nov/2026 10:30 AM',
            mensaje: 'Atento aviso: Tu periodo de 60 días para completar la Etapa 1 ha vencido el 01/Nov/2026. La subida de documentos se encuentra temporalmente bloqueada. Si requieres prórroga reglamentaria, por favor envía tu justificación por este medio.'
        }
    ]);

    const toggleStage = (stage: number) => {
        setOpenStage(openStage === stage ? null : stage);
    };

    // Configuraciones de vigencia y bloqueo por etapa (simulado)
    const etapasInfo = {
        etapa1: {
            diasRestantes: 0,
            fechaLimite: '01/Nov/2026',
            bloqueadaPorTiempo: true, // Simulación: bloqueada tras 60 días
            estado: 'Plazo Vencido',
        },
        etapa2: {
            diasRestantes: 0,
            fechaLimite: 'Sin fecha asignada',
            bloqueadaPorTiempo: false,
            estado: 'Completada',
        },
        etapa3: {
            diasRestantes: 20,
            fechaLimite: '29/Nov/2026',
            bloqueadaPorTiempo: false, // Activa en tiempo
            estado: 'En revisión',
        },
        etapa4: {
            diasRestantes: 45,
            fechaLimite: '24/Dic/2026',
            bloqueadaPorTiempo: false, // Pendiente / Activa
            estado: 'Pendiente',
        },
        etapa5: {
            diasRestantes: null,
            fechaLimite: 'Sujeto a aprobación de expediente',
            bloqueadaPorTiempo: false,
            estado: 'Por programar',
        }
    };

    const handleEnviarSolicitud = () => {
        if (!motivoProrroga.trim()) return;
        
        setHistorialChat([
            ...historialChat,
            {
                emisor: 'alumno',
                nombre: 'Tú (Sustentante)',
                fecha: 'Hoy hace un momento',
                mensaje: motivoProrroga
            }
        ]);
        setMotivoProrroga('');
    };

    // Documentos Etapa 1: Arranque (Registro y Aprobación del Tema)
    const etapa1Docs = [
        { id: 'e1-1', title: 'Solicitud por escrito', desc: 'Dirigida al Director(a) de tu Facultad pidiendo titularte por la opción de Tesis (Art. 203 y 239).', isUploaded: true, fileName: 'solicitud_titulacion.pdf', isSystem: false },
        { id: 'e1-2', title: 'Certificado de Estudios Profesionales', desc: 'Acredita que has cursado y aprobado el 100% de los créditos del plan de estudios (Art. 196).', isUploaded: true, fileName: 'certificado_100_creditos.pdf', isSystem: false },
        { id: 'e1-3', title: 'Constancia de Liberación de Servicio Social', desc: 'Documento oficial con sello y firma que acredita el cumplimiento del servicio social (Art. 198).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e1-4', title: 'Constancia de Buena Conducta', desc: 'Expedida por la Dirección o Coordinación de tu Unidad Académica (Art. 203).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e1-5', title: 'Acta de Registro de Tema y Asesor', desc: 'Documento oficial emitido por la Facultad donde se aprueba tu tema y se designa a tu Director(a) (Art. 350, Fracc. I).', isUploaded: true, fileName: 'acta_registro_tema.pdf', isSystem: true },
    ];

    // Documentos Etapa 2: Desarrollo y Originalidad
    const etapa2Docs = [
        { 
            id: 'e2-1', 
            title: 'Protocolo / Anteproyecto Registrado', 
            desc: 'Documento inicial cargado y aprobado en el módulo "Mi Anteproyecto". Vinculado automáticamente a tu expediente.', 
            isUploaded: true, 
            fileName: 'anteproyecto_aprobado_oficial.pdf', 
            isSystem: true,
            isAnteproyectoLink: true 
        },
        { 
            id: 'e2-2', 
            title: 'Carta Protesta de Honestidad e Integridad', 
            desc: 'Aceptación expresa de que el trabajo es inédito y original; si se detecta plagio se anula el grado (Art. 242, Fracc. XIII).', 
            isUploaded: true, 
            fileName: 'carta_protesta_firmada.pdf', 
            isSystem: false,
            isAnteproyectoLink: false 
        },
    ];

    // Documentos Etapa 3: Revisión y Sinodales
    const etapa3Docs = [
        { id: 'e3-1', title: 'Acta de Revisión y Aprobación de Tesis', desc: 'Firmada por tu Director(a) o Comité Tutorial certificando que el trabajo cumple requisitos de fondo y forma (Art. 350, Fracc. II).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e3-2', title: 'Oficios de Asignación del Jurado', desc: 'Designación oficial de los 5 integrantes del jurado (3 titulares y 2 suplentes: Presidente, Secretario y Vocales) (Art. 350, Fracc. III).', isUploaded: true, fileName: 'oficio_comision_jurado.pdf', isSystem: true },
    ];

    // Documentos Etapa 4: Expediente Final (Previo a la Defensa)
    const etapa4Docs = [
        { id: 'e4-1', title: 'Oficio de Entrega de Tesis en Digital', desc: 'Comprobante emitido por la Dirección de Desarrollo Bibliotecario al depositar la tesis en el repositorio (Art. 350, Fracc. V).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e4-2', title: 'Constancia de No Adeudo de Biblioteca y Laboratorio', desc: 'Certifica que no tienes pendientes ni adeudos de libros, material o equipo institucional (Art. 350, Fracc. IV).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e4-3', title: 'Comprobantes de Pago Oficiales', desc: 'Recibos de derechos de titulación, derecho a examen profesional y expedición de título (Art. 350, Fracc. VI).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e4-4', title: 'Documentación adicional (Servicios Escolares)', desc: 'Acta de nacimiento actualizada, CURP, fotos tamaño título e identificación oficial INE (Art. 350, Fracc. VIII).', isUploaded: false, fileName: '', isSystem: false },
        { id: 'e4-5', title: 'Acuse de Entrega de Ejemplares Impresos', desc: 'Constancia de entrega de los 3 a 5 ejemplares engargolados exigidos por tu Facultad para los sinodales.', isUploaded: false, fileName: '', isSystem: false },
    ];

    // Componente reutilizable para las tarjetas de subida
    const FileUploadCard = ({ doc, isStageBlocked = false }: { doc: any, isStageBlocked?: boolean }) => (
        <div className={`flex flex-col p-4 border rounded-lg shadow-sm transition-all ${
            isStageBlocked && !doc.isUploaded ? 'opacity-75 bg-gray-50/80 border-gray-200' : 
            doc.isSystem ? 'border-blue-200 bg-blue-50/20' : 'border-border bg-white'
        }`}>
            <div className="flex items-start gap-3 mb-4">
                <div className={`p-2 rounded-md shrink-0 ${
                    isStageBlocked && !doc.isUploaded ? 'bg-gray-200 text-gray-400' :
                    doc.isSystem ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                    <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{doc.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{doc.desc}</p>
                    {doc.isAnteproyectoLink ? (
                        <span className="inline-block mt-2 text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            Sincronizado de Mi Anteproyecto
                        </span>
                    ) : doc.isSystem ? (
                        <span className="inline-block mt-2 text-[10px] font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Generado por el sistema
                        </span>
                    ) : null}
                </div>
            </div>

            {/* ZONA DE SUBIDA */}
            {doc.isAnteproyectoLink ? (
                <div className="mt-auto flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50/70 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                            <span className="text-xs font-semibold text-emerald-900 truncate block" title={doc.fileName}>
                                {doc.fileName}
                            </span>
                            <span className="text-[10px] text-emerald-700 block">Vinculado desde tu anteproyecto aprobado</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded shrink-0">
                        Aprobado
                    </span>
                </div>
            ) : doc.isUploaded ? (
                <div className="mt-auto flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-xs font-medium text-green-800 truncate" title={doc.fileName}>
                            {doc.fileName}
                        </span>
                    </div>
                    {!isStageBlocked && (
                        <button className="text-green-700 hover:text-red-500 transition-colors p-1" title="Eliminar archivo">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : isStageBlocked ? (
                <div className="mt-auto flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-200 bg-gray-100/60 rounded-lg cursor-not-allowed">
                    <Lock className="w-5 h-5 text-gray-400 mb-1.5" />
                    <span className="text-xs font-semibold text-gray-500">
                        Entrega Bloqueada
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Plazo vencido (Requiere prórroga)</span>
                </div>
            ) : (
                <button className="mt-auto flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg transition-all group cursor-pointer">
                    <CloudUpload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-600">
                        Haz clic para subir
                    </span>
                    <span className="text-[10px] text-gray-400 mt-1">PDF (Máx. 10MB)</span>
                </button>
            )}
        </div>
    );

    return (
        <>
            <Head title="Mis Documentos" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-background text-foreground">
                {/* ENCABEZADO */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                            MIS DOCUMENTOS
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Consulta los requisitos de cada etapa y carga tus documentos para avanzar hacia tu examen de grado.
                        </p>
                    </div>
                </div>

                {/* PROGRESO DE LOS DOCUMENTOS */}
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground">Avance Integral de Titulación</h2>
                                    <p className="text-sm text-muted-foreground">Progreso general a través de las 5 etapas reglamentarias de la UNACH.</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-blue-600">55%</span>
                                    <span className="text-sm text-muted-foreground block">completado</span>
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-500" 
                                    style={{ width: '55%' }}
                                ></div>
                            </div>

                            {/* TARJETAS RESUMEN DE LAS 5 ETAPAS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-2">
                                <div className="flex flex-col p-3 border border-amber-200 rounded-xl bg-amber-50/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">1</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1 border border-amber-200">
                                            <Lock className="w-2.5 h-2.5" /> Bloqueado
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">1. Arranque</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">3 de 5 docs</p>
                                </div>

                                <div className="flex flex-col p-3 border border-emerald-200 rounded-xl bg-emerald-50/40">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">2</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> Lista
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">2. Desarrollo</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">2 de 2 docs</p>
                                </div>

                                <div className="flex flex-col p-3 border border-blue-200 rounded-xl bg-blue-50/50">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">3</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full flex items-center gap-1">
                                            <PlayCircle className="w-2.5 h-2.5" /> Activa
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">3. Revisión</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">1 de 2 docs</p>
                                </div>

                                <div className="flex flex-col p-3 border border-border rounded-xl bg-gray-50/60">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">4</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                            Pendiente
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">4. Exp. Final</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">0 de 5 docs</p>
                                </div>

                                <div className="flex flex-col p-3 border border-border rounded-xl bg-gray-50/60">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[11px] font-bold text-gray-600">5</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                                            Defensa
                                        </span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-foreground">5. Examen</h4>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Protocolo oral</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SECCIÓN: ACORDEONES DE LAS ETAPAS */}
                <div className="flex flex-col gap-4">
                    
                    {/* ETAPA 1: EL ARRANQUE */}
                    <div className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleStage(1)}
                            className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-sm font-bold text-amber-700">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-foreground">Etapa 1: El Arranque (Registro y Aprobación del Tema)</h3>
                                        <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                                            Plazo vencido (2 meses)
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Solicitud formal de tesis, certificado de estudios y liberación de servicio social.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 1 ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                            </div>
                        </button>

                        {openStage === 1 && (
                            <div className="p-5 border-t border-border bg-white flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-amber-900">El tiempo reglamentario de entrega ha finalizado</h4>
                                            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                                Han transcurrido más de 60 días desde la habilitación de esta etapa. Puedes solicitar una prórroga con justificación a Coordinación.
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => {
                                            setSelectedStageForProrroga('Etapa 1: El Arranque');
                                            setProrrogaModalOpen(true);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs font-semibold gap-2 shadow-xs cursor-pointer"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Solicitar Prórroga
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {etapa1Docs.map((doc) => (
                                        <FileUploadCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            isStageBlocked={etapasInfo.etapa1.bloqueadaPorTiempo} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 2: EL DESARROLLO */}
                    <div className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleStage(2)}
                            className="w-full flex items-center justify-between p-5 bg-emerald-50/20 hover:bg-emerald-50/40 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">2</span>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-foreground">Etapa 2: El Desarrollo (Elaboración de la Tesis)</h3>
                                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                            Requisitos cubiertos
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Documento escrito inédito (Art. 212) y carta protesta de honestidad e integridad académica.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 2 ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                            </div>
                        </button>

                        {openStage === 2 && (
                            <div className="p-5 border-t border-border bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {etapa2Docs.map((doc) => (
                                        <FileUploadCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            isStageBlocked={etapasInfo.etapa2.bloqueadaPorTiempo} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 3: LA REVISIÓN */}
                    <div className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleStage(3)}
                            className="w-full flex items-center justify-between p-5 bg-blue-50/30 hover:bg-blue-50/60 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm font-bold text-blue-700">3</span>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-foreground">Etapa 3: La Revisión (Aprobación del Trabajo)</h3>
                                        <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                                            Vigente ({etapasInfo.etapa3.diasRestantes} días restantes)
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Acta de aprobación del Comité Tutorial y designación oficial del jurado sinodal.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 3 ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                            </div>
                        </button>

                        {openStage === 3 && (
                            <div className="p-5 border-t border-border bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {etapa3Docs.map((doc) => (
                                        <FileUploadCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            isStageBlocked={etapasInfo.etapa3.bloqueadaPorTiempo} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 4: EL EXPEDIENTE FINAL */}
                    <div className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleStage(4)}
                            className="w-full flex items-center justify-between p-5 bg-gray-50/70 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-sm font-bold text-gray-700">4</span>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-foreground">Etapa 4: El Expediente Final (Trámites previos al Examen)</h3>
                                        <span className="text-[11px] font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                                            Integración de carpeta
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Entrega digital a biblioteca, constancias de no adeudo, cuotas de pago y documentos de Servicios Escolares.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 4 ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                            </div>
                        </button>

                        {openStage === 4 && (
                            <div className="p-5 border-t border-border bg-white">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {etapa4Docs.map((doc) => (
                                        <FileUploadCard 
                                            key={doc.id} 
                                            doc={doc} 
                                            isStageBlocked={etapasInfo.etapa4.bloqueadaPorTiempo} 
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ETAPA 5: LA DEFENSA (EXAMEN PROFESIONAL) */}
                    <div className="border border-purple-200 rounded-xl bg-purple-50/20 overflow-hidden shadow-sm">
                        <button 
                            onClick={() => toggleStage(5)}
                            className="w-full flex items-center justify-between p-5 bg-purple-50/40 hover:bg-purple-50/70 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-sm font-bold text-purple-700">5</span>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-foreground">Etapa 5: La Defensa (Examen Profesional y Toma de Protesta)</h3>
                                        <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                                            Acto protocolario
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Exposición oral de la tesis (90 min), deliberación del jurado y firma del acta oficial (Art. 214).</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {openStage === 5 ? <ChevronUp className="w-6 h-6 text-gray-500" /> : <ChevronDown className="w-6 h-6 text-gray-500" />}
                            </div>
                        </button>

                        {openStage === 5 && (
                            <div className="p-5 border-t border-purple-200/60 bg-white">
                                <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 flex items-start gap-3">
                                    <Info className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1 text-xs text-purple-900 leading-relaxed">
                                        <p className="font-semibold text-sm">Criterios de la Defensa Oral:</p>
                                        <p>• Esta etapa se programa una vez validado al 100% el expediente de la Etapa 4 por Servicios Escolares.</p>
                                        <p>• La réplica oral tiene una duración máxima de 90 minutos ante los 3 sinodales titulares.</p>
                                        <p>• Una vez aprobado el examen, el acta de examen profesional y el título oficial se emiten conforme al Artículo 199 del Estatuto.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* AVISO NORMATIVO (Minimalista) */}
                <div className="flex items-start gap-3 p-5 bg-gray-50 border border-gray-200 rounded-xl mt-4">
                    <Info className="w-5 h-5 mt-0.5 shrink-0 text-gray-400" />
                    <div>
                        <h4 className="text-sm font-semibold text-foreground">Aviso Normativo (Artículos 212 y 214)</h4>
                        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                            La tesis debe ser un producto académico original e inédito. Puede ser de autoría individual o colectiva (máximo 2 personas). Su extensión y formato deben sujetarse a los criterios establecidos por tu Facultad. Asegúrate de entregar los ejemplares impresos y digitales que se te soliciten.
                        </p>
                    </div>
                </div>

                {/* MODAL / MINICHAT DE SOLICITUD DE PRÓRROGA */}
                <Dialog open={prorrogaModalOpen} onOpenChange={setProrrogaModalOpen}>
                    <DialogContent className="sm:max-w-[580px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="p-6 pb-4 bg-muted/30 border-b border-border shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                                    <MessageSquare className="size-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold text-foreground">
                                        Solicitud de Prórroga
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                                        {selectedStageForProrroga} • Coordinación de Titulación
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4 min-h-0">
                            {/* Alerta informativa */}
                            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                                <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                                <p>
                                    Explica el motivo por el cual no pudiste cargar tu documentación en los 2 meses fijados. El Administrador revisará tu mensaje y decidirá si otorga días adicionales para reactivar tus entregas.
                                </p>
                            </div>

                            {/* HILO DE CONVERSACIÓN / MINICHAT */}
                            <div className="border border-border rounded-xl p-4 bg-muted/15 max-h-[240px] overflow-y-auto space-y-3">
                                {historialChat.map((msg, index) => (
                                    <div 
                                        key={index} 
                                        className={`flex flex-col ${msg.emisor === 'alumno' ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
                                            <span className="font-semibold text-foreground">{msg.nombre}</span>
                                            <span>•</span>
                                            <span>{msg.fecha}</span>
                                        </div>
                                        <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed break-words whitespace-pre-wrap ${
                                            msg.emisor === 'alumno' 
                                                ? 'bg-blue-600 text-white rounded-tr-xs' 
                                                : 'bg-white border border-border text-foreground rounded-tl-xs shadow-2xs'
                                        }`}>
                                            {msg.mensaje}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CAJA DE MENSAJE NUEVO */}
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground">
                                        Redactar justificación o mensaje para Coordinación:
                                    </label>
                                    <span className="text-[10px] text-muted-foreground">
                                        {motivoProrroga.length} / 1000 caracteres
                                    </span>
                                </div>
                                <textarea
                                    value={motivoProrroga}
                                    onChange={(e) => setMotivoProrroga(e.target.value.slice(0, 1000))}
                                    placeholder="Escribe detalladamente tu situación (ej. retraso de constancia laboral/servicio social, incapacidad, etc.)..."
                                    className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none h-28 max-h-36 overflow-y-auto break-words"
                                />
                            </div>
                        </div>

                        <DialogFooter className="p-4 bg-muted/20 border-t border-border flex sm:justify-between items-center gap-2 shrink-0">
                            <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                Respuesta estimada: 24 a 48 hrs hábiles
                            </span>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setProrrogaModalOpen(false)}
                                    className="text-xs cursor-pointer"
                                >
                                    Cerrar
                                </Button>
                                <Button 
                                    size="sm"
                                    onClick={handleEnviarSolicitud}
                                    disabled={!motivoProrroga.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
                                >
                                    <Send className="size-3.5" />
                                    Enviar Mensaje
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </>
    );
}

// Breadcrumbs para la barra superior
MisDocumentosIndex.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Mis Documentos',
            href: '/alumno/mis-documentos',
        },
    ],
};

