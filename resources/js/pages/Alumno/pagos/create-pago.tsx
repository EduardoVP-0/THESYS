import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    CreditCard,
    Building2,
    ShieldAlert,
    Check,
    Printer,
    Loader2,
    CheckCircle2,
    Download,
    Sparkles,
    AlertCircle,
    FileText,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';

interface PagoData {
    id_pago: number;
    id_concepto?: number | null;
    concepto: string;
    descripcion?: string;
    clave?: string;
    monto: number;
    referencia_bancaria?: string | null;
    metodo_pago?: string | null;
    estado_validacion: 'Pendiente' | 'Validado' | 'Rechazado';
    comentarios?: string | null;
    url_comprobante?: string | null;
    url_descarga?: string | null;
}

interface AlumnoData {
    nombre_completo: string;
    matricula: string;
    carrera: string;
    tesis_titulo: string;
}

interface Props {
    pago?: PagoData | null;
    alumno?: AlumnoData;
    referenciaSugerida?: string;
}

export default function CreatePago({
    pago,
    alumno = {
        nombre_completo: 'Sustentante UNACH',
        matricula: 'S/M',
        carrera: 'Ingeniería en Desarrollo y Tecnologías de Software',
        tesis_titulo: 'Proyecto de titulación en curso',
    },
    referenciaSugerida = 'UNACH-REV-2026-083',
}: Props) {
    // Estado para controlar qué método está seleccionado ('card' o 'cash')
    const [method, setMethod] = useState<'card' | 'cash'>('card');

    // Estados para la generación del folio (Pago en persona)
    const [folioGenerated, setFolioGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);

    // Estados para los modales de simulación y éxito
    const [simulationModal, setSimulationModal] = useState<'none' | 'processing-card' | 'processing-cash' | 'success'>('none');
    const [cashCountdown, setCashCountdown] = useState(5);

    // Estados para la tarjeta interactiva 3D
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const conceptoActual = pago?.concepto || 'Revisión de tesis';
    const montoActual = pago?.monto ?? 1250.0;
    const claveActual = pago?.clave || 'TES-001';
    const referenciaBase = pago?.referencia_bancaria
        ? pago.referencia_bancaria.replace(/\.pdf$/i, '')
        : referenciaSugerida;
    const nombreArchivoFinal = pago?.referencia_bancaria
        ? pago.referencia_bancaria.endsWith('.pdf')
            ? pago.referencia_bancaria
            : `${pago.referencia_bancaria}.pdf`
        : `${referenciaSugerida}.pdf`;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);

    // Formatear número de tarjeta en bloques de 4 dígitos
    const handleCardNumberChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
        const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
        setIsCardFlipped(false);
        if (cardError) setCardError(null);
    };

    // Formatear fecha de expiración MM/AA
    const handleCardExpiryChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
        if (digitsOnly.length >= 3) {
            setCardExpiry(`${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2)}`);
        } else {
            setCardExpiry(digitsOnly);
        }
        setIsCardFlipped(true);
        if (cardError) setCardError(null);
    };

    // Formatear código de seguridad CVV
    const handleCardCvvChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
        setCardCvv(digitsOnly);
        setIsCardFlipped(true);
        if (cardError) setCardError(null);
    };

    // Generar el folio para pago en persona
    const handleGenerateFolio = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setFolioGenerated(true);
        }, 900);
    };

    // Abrir modal con formato minimalista de ficha e imprimir
    const handlePrintFolio = () => {
        setShowPrintModal(true);
    };

    // Ejecutar el guardado real en base de datos y Supabase
    const submitPaymentToServer = (metodo: 'card' | 'cash', minWaitMs: number) => {
        const startTime = Date.now();

        if (!pago?.id_pago) {
            setTimeout(() => {
                setSimulationModal('success');
            }, minWaitMs);
            return;
        }

        router.post(
            '/alumno/pagos',
            {
                id_pago: pago.id_pago,
                metodo_pago: metodo,
                referencia_codigo: referenciaSugerida,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.max(0, minWaitMs - elapsed);
                    setTimeout(() => {
                        setSimulationModal('success');
                    }, remaining);
                },
                onError: () => {
                    setSimulationModal('none');
                    setCardError('Ocurrió un error al procesar el pago. Intenta nuevamente.');
                },
            }
        );
    };

    // Validar todos los campos de la tarjeta y lanzar simulación
    const handleSimulateCardPayment = () => {
        const cleanDigits = cardNumber.replace(/\s/g, '');
        const cleanExpiry = cardExpiry.replace(/\D/g, '');

        if (!cardName.trim() || cleanDigits.length < 16 || cleanExpiry.length < 4 || cardCvv.length < 3) {
            setCardError(
                'Por favor completa TODOS los campos de la tarjeta: Nombre del titular, los 16 dígitos de la tarjeta, Fecha de expiración (MM/AA) y Código de seguridad (CVV).'
            );
            return;
        }

        setCardError(null);
        setSimulationModal('processing-card');
        submitPaymentToServer('card', 3200);
    };

    // Simular pago en persona con espera de 5 segundos (notificación bancaria de 24h)
    const handleSimulateCashPayment = () => {
        setCashCountdown(5);
        setSimulationModal('processing-cash');
        submitPaymentToServer('cash', 5000);
    };

    // Contador regresivo de 5 segundos cuando está en processing-cash
    useEffect(() => {
        if (simulationModal !== 'processing-cash') return;
        if (cashCountdown <= 1) return;

        const timer = setInterval(() => {
            setCashCountdown((prev) => (prev > 1 ? prev - 1 : 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [simulationModal, cashCountdown]);

    // Si cambia de método, reseteamos alertas
    const handleMethodChange = (newMethod: 'card' | 'cash') => {
        setMethod(newMethod);
        setCardError(null);
    };

    const fechaLimite = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const fechaEmision = new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <>
            <Head title="Registrar Pago" />

            <div className="flex flex-1 flex-col gap-6 bg-background p-4 text-foreground md:p-6 max-w-6xl mx-auto w-full">
                {/* ENCABEZADO CON BOTÓN DE REGRESAR */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                        <Button
                            asChild
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl border-border"
                        >
                            <Link href="/alumno/pagos">
                                <ArrowLeft className="size-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                ESCOGER MÉTODO DE PAGO
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Completa el pago del arancel: <b className="text-foreground">{conceptoActual}</b>
                            </p>
                        </div>
                    </div>
                </div>

                {/* AVISO DE DEMO */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200 flex gap-3">
                    <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Simulador de Pasarela Institucional — THESYS</p>
                        <p className="mt-1">
                            Al completar el pago se generará tu comprobante oficial en PDF con sello digital y quedará enviado a revisión administrativa.
                        </p>
                    </div>
                </div>

                {/* GRID PRINCIPAL: FORMULARIO IZQUIERDA, RESUMEN DERECHA */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
                    {/* COLUMNA IZQUIERDA: MÉTODOS Y FORMULARIO DINÁMICO */}
                    <div className="flex flex-col gap-6">
                        {/* Selector de Método */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Opción Tarjeta */}
                            <div
                                onClick={() => handleMethodChange('card')}
                                className={`rounded-xl border-2 p-4 flex items-start gap-3 cursor-pointer transition-all ${
                                    method === 'card'
                                        ? 'border-[#10B981] bg-[#10B981]/5'
                                        : 'border-border bg-card hover:border-[#10B981]/50 opacity-60'
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-lg ${
                                        method === 'card'
                                            ? 'bg-[#10B981]/20 text-[#10B981]'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    <CreditCard className="size-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Tarjeta de crédito o débito</p>
                                    <p className="text-xs text-muted-foreground mt-1">Visa, Mastercard, AMEX y más</p>
                                </div>
                                {method === 'card' && (
                                    <div className="ml-auto text-[#10B981]">
                                        <Check className="size-5" />
                                    </div>
                                )}
                            </div>

                            {/* Opción Pago en Persona */}
                            <div
                                onClick={() => handleMethodChange('cash')}
                                className={`rounded-xl border-2 p-4 flex items-start gap-3 cursor-pointer transition-all ${
                                    method === 'cash'
                                        ? 'border-[#10B981] bg-[#10B981]/5'
                                        : 'border-border bg-card hover:border-[#10B981]/50 opacity-60'
                                }`}
                            >
                                <div
                                    className={`p-2 rounded-lg ${
                                        method === 'cash'
                                            ? 'bg-[#10B981]/20 text-[#10B981]'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Pago en persona</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Generar ficha de referencia para ventanilla
                                    </p>
                                </div>
                                {method === 'cash' && (
                                    <div className="ml-auto text-[#10B981]">
                                        <Check className="size-5" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* FORMULARIO DINÁMICO SEGÚN EL MÉTODO */}
                        {method === 'card' ? (
                            /* ─── VISTA PAGO CON TARJETA ─── */
                            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <h2 className="font-bold text-foreground">Pago con tarjeta</h2>
                                    <span className="text-xs text-muted-foreground">Todos los campos son obligatorios</span>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[10px] font-bold italic text-blue-800">
                                        VISA
                                    </div>
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center">
                                        <div className="flex -space-x-1">
                                            <div className="size-4 rounded-full bg-red-500 opacity-80" />
                                            <div className="size-4 rounded-full bg-yellow-500 opacity-80" />
                                        </div>
                                    </div>
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[10px] font-bold text-blue-500">
                                        AMEX
                                    </div>
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[9px] font-bold text-red-600 tracking-tighter">
                                        SANT
                                    </div>
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[10px] font-bold italic text-[#003087]">
                                        PayPal
                                    </div>
                                </div>

                                {/* TARJETA BANCARIA INTERACTIVA 3D (ROSADO OSCURITO) */}
                                <div className="flex justify-center py-2">
                                    <div
                                        onClick={() => setIsCardFlipped(!isCardFlipped)}
                                        title="Haz clic para voltear la tarjeta"
                                        className="group relative h-52 w-full max-w-[360px] cursor-pointer select-none [perspective:1000px]"
                                    >
                                        <div
                                            className={`relative h-full w-full rounded-2xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d] ${
                                                isCardFlipped ? '[transform:rotateY(180deg)]' : ''
                                            }`}
                                        >
                                            {/* ─── CARA FRONTAL DE LA TARJETA ─── */}
                                            <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#be185d] via-[#9d174d] to-[#701a3c] p-6 text-white shadow-lg [backface-visibility:hidden]">
                                                <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-pink-400/20 blur-2xl" />
                                                <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-rose-300/15 blur-2xl" />

                                                <div className="relative z-10 flex items-center justify-between">
                                                    <div className="flex h-9 w-12 items-center justify-center rounded-md border border-amber-200/60 bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 shadow-inner">
                                                        <div className="grid h-6 w-9 grid-cols-3 gap-0.5 rounded-xs border border-amber-700/40 p-0.5">
                                                            <div className="border-r border-b border-amber-700/40" />
                                                            <div className="border-b border-amber-700/40" />
                                                            <div className="border-b border-l border-amber-700/40" />
                                                            <div className="border-r border-amber-700/40" />
                                                            <div />
                                                            <div className="border-l border-amber-700/40" />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-semibold tracking-widest text-pink-100/80 uppercase">
                                                            THESYS BANK
                                                        </span>
                                                        <div className="flex -space-x-2">
                                                            <div className="size-6 rounded-full bg-rose-300/80" />
                                                            <div className="size-6 rounded-full bg-pink-200/80" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative z-10 my-auto pt-2">
                                                    <p className="font-mono text-lg sm:text-xl font-bold tracking-[0.18em] text-white drop-shadow">
                                                        {cardNumber || '•••• •••• •••• ••••'}
                                                    </p>
                                                </div>

                                                <div className="relative z-10 flex items-end justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[9px] font-medium tracking-wider text-pink-200/80 uppercase">
                                                            Titular de la tarjeta
                                                        </p>
                                                        <p className="truncate font-mono text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
                                                            {cardName || 'NOMBRE DEL TITULAR'}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-medium tracking-wider text-pink-200/80 uppercase">
                                                            Expira
                                                        </p>
                                                        <p className="font-mono text-xs sm:text-sm font-bold tracking-wider text-white">
                                                            {cardExpiry || 'MM/AA'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ─── CARA TRASERA DE LA TARJETA (VUELTA 180°) ─── */}
                                            <div className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#831843] via-[#9d174d] to-[#500724] py-5 text-white shadow-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                                                <div className="mt-1 h-11 w-full bg-neutral-950/90 shadow-inner" />

                                                <div className="px-6 space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 flex-1 items-center justify-end rounded bg-pink-100/90 px-3 text-right font-mono text-xs italic text-neutral-700 shadow-inner">
                                                            <span className="mr-auto text-[10px] not-italic text-neutral-500">
                                                                Firma autorizada
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[9px] font-bold tracking-wider text-pink-200 uppercase">
                                                                CVV
                                                            </span>
                                                            <div className="flex h-9 min-w-[54px] items-center justify-center rounded-md border border-pink-300/50 bg-white px-2 font-mono text-sm font-bold tracking-widest text-[#831843] shadow">
                                                                {cardCvv || '•••'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-xs">
                                                        <span className="text-[10px] font-medium tracking-wider text-pink-200 uppercase">
                                                            Fecha de expiración:
                                                        </span>
                                                        <span className="font-mono font-bold tracking-widest text-white">
                                                            {cardExpiry || 'MM/AA'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="px-6 flex items-center justify-between text-[9px] text-pink-200/75">
                                                    <span>Uso exclusivo demostrativo · THESYS</span>
                                                    <span className="font-mono uppercase">
                                                        {cardName ? cardName.slice(0, 18) : 'TITULAR'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerta si falta llenar algún campo */}
                                {cardError && (
                                    <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 flex items-start gap-2.5 animate-in fade-in duration-200">
                                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                        <span className="font-medium leading-relaxed">{cardError}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                            Nombre del titular <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={cardName}
                                            onFocus={() => setIsCardFlipped(false)}
                                            onChange={(e) => {
                                                setCardName(e.target.value);
                                                setIsCardFlipped(false);
                                                if (cardError) setCardError(null);
                                            }}
                                            placeholder="Nombre como aparece en la tarjeta"
                                            maxLength={32}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground">
                                            Número de tarjeta (16 dígitos) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                            <Input
                                                value={cardNumber}
                                                onFocus={() => setIsCardFlipped(false)}
                                                onChange={(e) => handleCardNumberChange(e.target.value)}
                                                placeholder="•••• •••• •••• ••••"
                                                inputMode="numeric"
                                                maxLength={19}
                                                className="pl-9 font-mono bg-background"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground">
                                                Fecha de expiración <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={cardExpiry}
                                                onFocus={() => setIsCardFlipped(true)}
                                                onChange={(e) => handleCardExpiryChange(e.target.value)}
                                                placeholder="MM/AA"
                                                inputMode="numeric"
                                                maxLength={5}
                                                className="font-mono bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground">
                                                Código de seguridad (CVV) <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={cardCvv}
                                                onFocus={() => setIsCardFlipped(true)}
                                                onChange={(e) => handleCardCvvChange(e.target.value)}
                                                placeholder="•••"
                                                inputMode="numeric"
                                                maxLength={4}
                                                className="font-mono bg-background"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[11px] text-muted-foreground text-center mt-4">
                                    Esta demostración simula el cargo bancario y genera tu comprobante oficial en PDF sin realizar cobros reales.
                                </p>

                                <Button
                                    type="button"
                                    onClick={handleSimulateCardPayment}
                                    disabled={simulationModal !== 'none'}
                                    className="w-full bg-[#10B981] hover:bg-[#0ea371] text-white font-bold h-11 mt-2 gap-2 cursor-pointer"
                                >
                                    Pagar · {formatCurrency(montoActual)}
                                </Button>
                            </div>
                        ) : (
                            /* ─── VISTA PAGO EN PERSONA (FOLIO) ─── */
                            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <h2 className="font-bold text-foreground">Ficha de pago para ventanilla</h2>
                                    <span className="text-xs text-muted-foreground">
                                        Imprime este folio y preséntalo en caja
                                    </span>
                                </div>

                                {!folioGenerated ? (
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 bg-muted/10 rounded-lg border border-dashed border-border">
                                        <div className="p-4 bg-muted rounded-full">
                                            <Building2 className="size-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Aún no has generado tu folio</p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                                Al hacer clic en el botón de abajo, el sistema generará tu ficha con referencia única que podrás imprimir y pagar en ventanilla.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={handleGenerateFolio}
                                            disabled={isGenerating}
                                            className="bg-[#2D2D2D] hover:bg-[#2D2D2D]/90 text-white font-bold h-11 gap-2 mt-4 cursor-pointer"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    Generando folio...
                                                </>
                                            ) : (
                                                <>
                                                    <Printer className="size-4" />
                                                    Generar folio de pago
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                                        {/* Código de barras simulado */}
                                        <div className="border-2 border-dashed border-border p-6 rounded-xl flex flex-col items-center justify-center bg-muted/20">
                                            <div className="flex gap-1 h-16 items-end mb-4">
                                                {[4, 2, 6, 1, 8, 3, 5, 2, 7, 4, 2, 8, 5, 3, 6, 2, 9, 4, 1, 7, 5, 3, 8, 6].map(
                                                    (h, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-1.5 bg-foreground rounded-t-xs"
                                                            style={{ height: `${h * 10}%` }}
                                                        />
                                                    )
                                                )}
                                            </div>
                                            <p className="font-mono text-xl font-bold tracking-widest text-foreground">
                                                {referenciaSugerida}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Línea de captura / Referencia bancaria
                                            </p>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between border-b border-border pb-2">
                                                <span className="text-muted-foreground">Sustentante:</span>
                                                <span className="font-semibold text-foreground">{alumno.nombre_completo}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border pb-2">
                                                <span className="text-muted-foreground">Concepto:</span>
                                                <span className="font-semibold text-foreground">{conceptoActual}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border pb-2">
                                                <span className="text-muted-foreground">Fecha límite de pago:</span>
                                                <span className="font-semibold text-foreground">{fechaLimite}</span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <span className="text-muted-foreground font-bold">Total a pagar:</span>
                                                <span className="font-bold text-lg text-[#10B981]">
                                                    {formatCurrency(montoActual)} MXN
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-muted-foreground text-center">
                                            Puedes imprimir esta ficha minimalista o simular el pago directo en ventanilla bancaria.
                                        </p>

                                        {/* BOTONES LADO A LADO */}
                                        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border">
                                            <Button
                                                type="button"
                                                onClick={handlePrintFolio}
                                                disabled={simulationModal !== 'none'}
                                                variant="outline"
                                                className="flex-1 border-border text-foreground hover:bg-accent/40 font-bold h-11 gap-2 cursor-pointer"
                                            >
                                                <Printer className="size-4" />
                                                Imprimir Ficha
                                            </Button>

                                            <Button
                                                type="button"
                                                onClick={handleSimulateCashPayment}
                                                disabled={simulationModal !== 'none'}
                                                className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white font-bold h-11 gap-2 cursor-pointer"
                                            >
                                                <CheckCircle2 className="size-4" />
                                                Simular Pago
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: RESUMEN DEL PAGO */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden sticky top-6">
                        <div className="border-b border-border bg-muted/30 px-6 py-4">
                            <h2 className="font-bold text-foreground">Resumen del pago</h2>
                            <p className="text-xs text-muted-foreground mt-1">Arancel institucional · MXN</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Concepto</span>
                                <span className="text-sm font-semibold text-foreground text-right">
                                    {conceptoActual}
                                </span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Sustentante</span>
                                <span className="text-sm font-medium text-foreground text-right">
                                    {alumno.nombre_completo}
                                </span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Matrícula</span>
                                <span className="text-sm font-mono font-medium text-foreground">
                                    {alumno.matricula}
                                </span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Tesis</span>
                                <span className="text-xs font-medium text-foreground text-right max-w-[210px] leading-snug">
                                    {alumno.tesis_titulo}
                                </span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Referencia</span>
                                <span className="font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded text-xs">
                                    {referenciaBase}
                                </span>
                            </div>

                            <div className="border-t border-border pt-4 mt-4 flex justify-between items-end">
                                <span className="text-sm font-bold text-foreground">Total a pagar</span>
                                <span className="text-2xl font-bold text-[#10B981]">
                                    {formatCurrency(montoActual)}
                                </span>
                            </div>
                        </div>

                        <div className="bg-muted/30 px-6 py-3 border-t border-border">
                            <p className="text-[10px] text-center text-muted-foreground leading-tight">
                                Al confirmar se generará el archivo <b>{referenciaSugerida}.pdf</b>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════════
                MODAL 1: SIMULACIÓN DE PROCESAMIENTO (CON GATITO CAJERO ANIMADO)
               ═══════════════════════════════════════════════════════════════════════════ */}
            {(simulationModal === 'processing-card' || simulationModal === 'processing-cash') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 space-y-5">
                        {/* Ilustración animada de gatito cajero procesando el pago */}
                        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/15 via-pink-500/10 to-amber-500/15 border border-emerald-500/20">
                            {/* Monedas flotando animadas */}
                            <div className="absolute -top-2 right-4 flex size-8 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-bold text-xs shadow-md animate-bounce">
                                $
                            </div>
                            <div
                                className="absolute top-4 -left-2 flex size-7 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 font-bold text-[10px] shadow-md animate-bounce"
                                style={{ animationDelay: '300ms' }}
                            >
                                ✓
                            </div>

                            {/* Gatito Cajero SVG animado */}
                            <svg
                                viewBox="0 0 120 120"
                                className="h-28 w-28 drop-shadow-md"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Orejitas */}
                                <polygon points="28,48 22,18 48,34" fill="#F472B6" stroke="#831843" strokeWidth="3" />
                                <polygon points="92,48 98,18 72,34" fill="#F472B6" stroke="#831843" strokeWidth="3" />
                                <polygon points="30,42 26,24 43,35" fill="#FBCFE8" />
                                <polygon points="90,42 94,24 77,35" fill="#FBCFE8" />

                                {/* Cabeza del gatito */}
                                <ellipse cx="60" cy="60" rx="36" ry="30" fill="#FDF2F8" stroke="#831843" strokeWidth="3" />

                                {/* Gorrita de banquero */}
                                <path d="M40 34 Q60 22 80 34 Z" fill="#10B981" stroke="#065F46" strokeWidth="2.5" />
                                <rect x="36" y="32" width="48" height="5" rx="2.5" fill="#047857" />

                                {/* Ojitos brillantes */}
                                <circle cx="46" cy="56" r="4.5" fill="#1F2937" />
                                <circle cx="74" cy="56" r="4.5" fill="#1F2937" />
                                <circle cx="47.5" cy="54.5" r="1.5" fill="#FFFFFF" />
                                <circle cx="75.5" cy="54.5" r="1.5" fill="#FFFFFF" />

                                {/* Mejillas sonrojadas */}
                                <ellipse cx="36" cy="63" rx="5" ry="3" fill="#F472B6" opacity="0.6" />
                                <ellipse cx="84" cy="63" rx="5" ry="3" fill="#F472B6" opacity="0.6" />

                                {/* Nariz y boquita feliz */}
                                <polygon points="57,61 63,61 60,65" fill="#DB2777" />
                                <path
                                    d="M52 67 Q56 72 60 67 Q64 72 68 67"
                                    stroke="#831843"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    fill="none"
                                />

                                {/* Mostrador y tarjeta deslizándose */}
                                <rect x="18" y="88" width="84" height="18" rx="6" fill="#10B981" stroke="#065F46" strokeWidth="2.5" />
                                <rect
                                    x="44"
                                    y="78"
                                    width="32"
                                    height="20"
                                    rx="4"
                                    fill="#BE185D"
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    className="animate-pulse"
                                />
                                {/* Patitas trabajando */}
                                <circle
                                    cx="38"
                                    cy="88"
                                    r="7"
                                    fill="#FDF2F8"
                                    stroke="#831843"
                                    strokeWidth="2.5"
                                    className="animate-bounce"
                                />
                                <circle
                                    cx="82"
                                    cy="88"
                                    r="7"
                                    fill="#FDF2F8"
                                    stroke="#831843"
                                    strokeWidth="2.5"
                                    className="animate-bounce"
                                    style={{ animationDelay: '200ms' }}
                                />
                            </svg>
                        </div>

                        {simulationModal === 'processing-card' ? (
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-foreground">
                                    Procesando tu pago con tarjeta...
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Nuestro cajero está autorizando la transacción, timbrando tu sello digital y guardando tu comprobante <b>{referenciaSugerida}.pdf</b>.
                                </p>
                                <div className="pt-3">
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div className="h-full w-full origin-left animate-pulse rounded-full bg-gradient-to-r from-[#be185d] via-[#10B981] to-[#10B981]" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    Simulación de conciliación bancaria (24 hrs)
                                </span>
                                <h3 className="text-lg font-bold text-foreground">
                                    Esperando notificación del banco...
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    En ventanilla el banco tarda hasta 24 horas en notificar. Simulando recepción y timbrado en{' '}
                                    <b className="text-[#10B981] text-sm">{cashCountdown}s</b>...
                                </p>
                                <div className="pt-2">
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-[#10B981] transition-all duration-1000 ease-linear"
                                            style={{ width: `${((6 - cashCountdown) / 5) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                MODAL 2: ¡FELICIDADES! PAGO REALIZADO CON OPCIÓN DE DESCARGAR PDF O HECHO
               ═══════════════════════════════════════════════════════════════════════════ */}
            {simulationModal === 'success' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-300">
                        {/* Encabezado festivo */}
                        <div className="bg-gradient-to-br from-[#10B981] to-[#059669] p-6 text-center text-white relative overflow-hidden">
                            <Sparkles className="absolute top-4 left-6 size-6 text-emerald-200/60 animate-pulse" />
                            <Sparkles className="absolute bottom-4 right-6 size-6 text-emerald-200/60 animate-pulse" />

                            <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs shadow-inner">
                                <CheckCircle2 className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-extrabold tracking-tight">
                                ¡Felicidades! Pago Realizado
                            </h2>
                            <p className="text-xs text-emerald-50 mt-1">
                                Tu comprobante ha sido generado y enviado a revisión administrativa
                            </p>
                        </div>

                        {/* Cuerpo con detalles del archivo generado */}
                        <div className="p-6 space-y-4">
                            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2.5 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Concepto:</span>
                                    <span className="font-bold text-foreground text-right">{conceptoActual}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Monto cubierto:</span>
                                    <span className="font-bold text-[#10B981]">{formatCurrency(montoActual)} MXN</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-muted-foreground">Estado actual:</span>
                                    <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-sky-900/40 dark:text-sky-300">
                                        En revisión
                                    </span>
                                </div>
                            </div>

                            {/* Tarjeta del archivo PDF generado en Supabase */}
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#10B981] text-white">
                                    <FileText className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold font-mono text-foreground truncate">
                                        {nombreArchivoFinal}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground">
                                        Comprobante oficial con sello digital
                                    </p>
                                </div>
                            </div>

                            {/* Botones de Acción: Descargar Archivo o Hecho */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                {pago?.id_pago && (
                                    <Button
                                        asChild
                                        variant="outline"
                                        className="flex-1 border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 font-bold h-11 gap-2"
                                    >
                                        <a
                                            href={
                                                pago.url_descarga ||
                                                `/alumno/pagos/${pago.id_pago}/documento?download=1`
                                            }
                                            download={nombreArchivoFinal}
                                        >
                                            <Download className="size-4" />
                                            Descargar PDF
                                        </a>
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    onClick={() => router.visit('/alumno/pagos')}
                                    className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white font-bold h-11 gap-2 cursor-pointer"
                                >
                                    <Check className="size-4" />
                                    Hecho
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════
                MODAL 3: FORMATO MINIMALISTA E INSTITUCIONAL PARA IMPRIMIR FICHA DE PAGO
               ═══════════════════════════════════════════════════════════════════════════ */}
            {showPrintModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-border bg-white text-zinc-900 shadow-2xl animate-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:border-none">
                        {/* Barra superior fija (no se imprime) */}
                        <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-5 py-3 print:hidden">
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                                Vista previa de Ficha de Ventanilla
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowPrintModal(false)}
                                className="rounded-full p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Contenido minimalista de la ficha (con scroll interno en pantallas pequeñas) */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 print:overflow-visible">
                            {/* Encabezado minimalista */}
                            <div className="flex items-start justify-between border-b-2 border-[#10B981] pb-3">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-zinc-900">
                                        Universidad Autónoma de Chiapas
                                    </h3>
                                    <p className="text-[11px] text-zinc-500 mt-0.5">
                                        Sistema Integral THESYS · Ficha de Depósito Referenciado
                                    </p>
                                </div>
                                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 shrink-0">
                                    CLAVE: {claveActual}
                                </span>
                            </div>

                            {/* Datos del Alumno y Concepto */}
                            <div className="grid grid-cols-2 gap-3 text-xs bg-zinc-50 p-3.5 rounded-xl border border-zinc-200">
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                        Sustentante
                                    </span>
                                    <span className="font-bold text-zinc-900 mt-0.5 block">
                                        {alumno.nombre_completo}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                        Matrícula
                                    </span>
                                    <span className="font-mono font-bold text-zinc-900 mt-0.5 block">
                                        {alumno.matricula}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                        Programa Académico
                                    </span>
                                    <span className="font-medium text-zinc-800 mt-0.5 block">
                                        {alumno.carrera}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                        Fecha de Emisión
                                    </span>
                                    <span className="font-medium text-zinc-800 mt-0.5 block">{fechaEmision}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                                        Vigencia de Pago
                                    </span>
                                    <span className="font-bold text-zinc-900 mt-0.5 block">{fechaLimite}</span>
                                </div>
                            </div>

                            {/* Desglose y Total */}
                            <div className="rounded-xl border border-zinc-200 p-3.5 space-y-2">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold uppercase text-zinc-500">Concepto de Pago</span>
                                    <span className="font-bold uppercase text-zinc-500">Importe</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-100 pt-2 text-sm gap-2">
                                    <span className="font-semibold text-zinc-900">{conceptoActual}</span>
                                    <span className="font-extrabold text-base sm:text-lg text-[#10B981] shrink-0">
                                        {formatCurrency(montoActual)} MXN
                                    </span>
                                </div>
                            </div>

                            {/* Línea de Captura y Código de Barras */}
                            <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50/70 p-4 text-center space-y-2">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                    Referencia Bancaria / Línea de Captura
                                </p>
                                <p className="font-mono text-base sm:text-lg font-extrabold tracking-widest text-zinc-900">
                                    {referenciaSugerida}
                                </p>
                                <div className="flex justify-center gap-1 h-10 items-end pt-1">
                                    {[5, 3, 7, 2, 8, 4, 6, 3, 9, 5, 2, 8, 6, 4, 7, 3, 9, 5, 2, 7, 6, 4, 8, 5].map(
                                        (h, i) => (
                                            <div
                                                key={i}
                                                className="w-1 bg-zinc-900"
                                                style={{ height: `${h * 10}%` }}
                                            />
                                        )
                                    )}
                                </div>
                            </div>

                            <p className="text-[10px] text-center text-zinc-400 leading-relaxed">
                                Presenta esta ficha en ventanilla bancaria autorizada o caja universitaria. Conserva tu comprobante original para cualquier aclaración.
                            </p>
                        </div>

                        {/* Botones fijos en la parte inferior del modal */}
                        <div className="flex shrink-0 gap-3 border-t border-zinc-200 bg-zinc-50 px-5 py-3.5 print:hidden">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPrintModal(false)}
                                className="flex-1 border-zinc-300 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                            >
                                Cerrar
                            </Button>
                            <Button
                                type="button"
                                onClick={() => window.print()}
                                className="flex-1 bg-[#2D2D2D] hover:bg-[#2D2D2D]/90 text-white font-bold gap-2 cursor-pointer"
                            >
                                <Printer className="size-4" />
                                Imprimir ahora
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Breadcrumbs para la barra superior
CreatePago.layout = {
    breadcrumbs: [
        {
            title: 'Alumno',
            href: '/alumno/dashboard',
        },
        {
            title: 'Pagos',
            href: '/alumno/pagos',
        },
        {
            title: 'Nuevo Pago',
            href: '/alumno/pagos/create',
        },
    ],
};
