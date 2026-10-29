import { Head, Link } from '@inertiajs/react';
import { 
ArrowLeft, 
CreditCard, 
Building2, 
ShieldAlert, 
Check, 
Printer, 
Loader2, 
CheckCircle2} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function CreatePago() {
    // Estado para controlar qué método está seleccionado ('card' o 'cash')
    const [method, setMethod] = useState<'card' | 'cash'>('card');
    
    // Estados para la generación del folio (Pago en persona)
    const [folioGenerated, setFolioGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isProcessingCash, setIsProcessingCash] = useState(false);

    // Estado para la simulación de pago con tarjeta
    const [isProcessingCard, setIsProcessingCard] = useState(false);

    // Estados para la tarjeta interactiva 3D
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    // Formatear número de tarjeta en bloques de 4 dígitos
    const handleCardNumberChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
        const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
        setIsCardFlipped(false);
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
    };

    // Formatear código de seguridad CVV
    const handleCardCvvChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
        setCardCvv(digitsOnly);
        setIsCardFlipped(true);
    };

    // Función para simular la generación del folio
    const handleGenerateFolio = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            setFolioGenerated(true);
        }, 1500);
    };

    // Función para simular la impresión del folio
    const handlePrintFolio = () => {
        setIsPrinting(true);
        setTimeout(() => {
            setIsPrinting(false);
            alert('Simulación: La ficha de pago se ha enviado a la impresora.');
        }, 1500);
    };

    // Función para simular el pago con tarjeta
    const handleSimulateCardPayment = () => {
        setIsProcessingCard(true);
        setTimeout(() => {
            setIsProcessingCard(false);
            alert('Simulación completada: El pago ha sido procesado correctamente.');
        }, 1500);
    };

    // Función para simular el pago en persona (ventanilla)
    const handleSimulateCashPayment = () => {
        setIsProcessingCash(true);
        setTimeout(() => {
            setIsProcessingCash(false);
            alert('Simulación completada: El folio ha sido marcado como pagado en ventanilla.');
        }, 1500);
    };

    // Si cambia de método, reseteamos los estados
    const handleMethodChange = (newMethod: 'card' | 'cash') => {
        setMethod(newMethod);
        if (newMethod === 'card') {
            setFolioGenerated(false);
            setIsPrinting(false);
            setIsProcessingCash(false);
        } else {
            setIsProcessingCard(false);
        }
    };

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
                                Completa la vista previa del pago de la tarifa de Revisión de tesis
                            </p>
                        </div>
                    </div>
                </div>

                {/* AVISO DE DEMO */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200 flex gap-3">
                    <ShieldAlert className="size-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Solo demostración — no es un pago real</p>
                        <p className="mt-1">El folio de ejemplo no se puede usar en un banco, tienda o caja universitaria.</p>
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
                                <div className={`p-2 rounded-lg ${method === 'card' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-muted text-muted-foreground'}`}>
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
                                <div className={`p-2 rounded-lg ${method === 'cash' ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-muted text-muted-foreground'}`}>
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-foreground">Pago en persona</p>
                                    <p className="text-xs text-muted-foreground mt-1">Generar un folio de ejemplo para imprimir</p>
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
                            /* ─── VISTA PREVIA TARJETA ─── */
                            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <h2 className="font-bold text-foreground">Pago con tarjeta</h2>
                                    <span className="text-xs text-muted-foreground">Vista previa del formulario habitual</span>
                                </div>

                                                                <div className="flex flex-wrap gap-2">
                                    {/* Visa */}
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[10px] font-bold italic text-blue-800">VISA</div>
                                    
                                    {/* Mastercard */}
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center">
                                        <div className="flex -space-x-1">
                                            <div className="size-4 rounded-full bg-red-500 opacity-80" />
                                            <div className="size-4 rounded-full bg-yellow-500 opacity-80" />
                                        </div>
                                    </div>
                                    
                                    {/* AMEX */}
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[10px] font-bold text-blue-500">AMEX</div>
                                    
                                    {/* Santander */}
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[9px] font-bold text-red-600 tracking-tighter">SANT</div>
                                    
                                    {/* PayPal */}
                                    <div className="h-8 w-12 rounded border border-border bg-white flex items-center justify-center text-[10px] font-bold italic text-[#003087]">PayPal</div>
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
                                                {/* Brillos decorativos de fondo */}
                                                <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-pink-400/20 blur-2xl" />
                                                <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-rose-300/15 blur-2xl" />

                                                {/* Fila superior: Chip y Logo */}
                                                <div className="relative z-10 flex items-center justify-between">
                                                    {/* Chip metálico */}
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

                                                    {/* Marca / Contactless */}
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

                                                {/* Número de tarjeta */}
                                                <div className="relative z-10 my-auto pt-2">
                                                    <p className="font-mono text-lg sm:text-xl font-bold tracking-[0.18em] text-white drop-shadow">
                                                        {cardNumber || '•••• •••• •••• ••••'}
                                                    </p>
                                                </div>

                                                {/* Fila inferior: Nombre del titular y Expiración */}
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
                                                {/* Banda magnética negra */}
                                                <div className="mt-1 h-11 w-full bg-neutral-950/90 shadow-inner" />

                                                {/* Banda de firma, Fecha de expiración y CVV */}
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

                                                    {/* Fecha de expiración visible también al reverso */}
                                                    <div className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-1.5 text-xs">
                                                        <span className="text-[10px] font-medium tracking-wider text-pink-200 uppercase">
                                                            Fecha de expiración:
                                                        </span>
                                                        <span className="font-mono font-bold tracking-widest text-white">
                                                            {cardExpiry || 'MM/AA'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Pie trasero */}
                                                <div className="px-6 flex items-center justify-between text-[9px] text-pink-200/75">
                                                    <span>Uso exclusivo demostrativo · THESYS</span>
                                                    <span className="font-mono uppercase">{cardName ? cardName.slice(0, 18) : 'TITULAR'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground">Nombre del titular</label>
                                        <Input
                                            value={cardName}
                                            onFocus={() => setIsCardFlipped(false)}
                                            onChange={(e) => {
                                                setCardName(e.target.value);
                                                setIsCardFlipped(false);
                                            }}
                                            placeholder="Nombre como aparece en la tarjeta"
                                            maxLength={32}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground">Número de tarjeta</label>
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
                                            <label className="text-xs font-semibold text-muted-foreground">Fecha de expiración</label>
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
                                            <label className="text-xs font-semibold text-muted-foreground">Código de seguridad</label>
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
                                    Estos cuadros son una vista previa visual, no campos de formulario. Esta demostración nunca solicita ni almacena información real de tarjetas.
                                </p>

                                <Button 
                                    onClick={handleSimulateCardPayment}
                                    disabled={isProcessingCard}
                                    className="w-full bg-[#10B981] hover:bg-[#0ea371] text-white font-bold h-11 mt-2 gap-2"
                                >
                                    {isProcessingCard ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Procesando pago...
                                        </>
                                    ) : (
                                        'Pagar · $1,250.00'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            /* ─── VISTA PREVIA PAGO EN PERSONA (FOLIO) ─── */
                            <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between border-b border-border pb-4">
                                    <h2 className="font-bold text-foreground">Ficha de pago para ventanilla</h2>
                                    <span className="text-xs text-muted-foreground">Imprime este folio y preséntalo en caja</span>
                                </div>

                                {!folioGenerated ? (
                                    /* Estado 1: Aún no se ha generado el folio */
                                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4 bg-muted/10 rounded-lg border border-dashed border-border">
                                        <div className="p-4 bg-muted rounded-full">
                                            <Building2 className="size-8 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground">Aún no has generado tu folio</p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                                                Al hacer clic en el botón de abajo, el sistema generará una referencia única que podrás imprimir y pagar en ventanilla.
                                            </p>
                                        </div>
                                        <Button 
                                            onClick={handleGenerateFolio}
                                            disabled={isGenerating}
                                            className="bg-[#2D2D2D] hover:bg-[#2D2D2D]/90 text-white font-bold h-11 gap-2 mt-4"
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
                                    /* Estado 2: Folio ya generado */
                                    <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                                        {/* Código de barras simulado */}
                                        <div className="border-2 border-dashed border-border p-6 rounded-lg flex flex-col items-center justify-center bg-muted/20">
                                            <div className="flex gap-1 h-16 items-end mb-4">
                                                {[4, 2, 6, 1, 8, 3, 5, 2, 7, 4, 2, 8, 5, 3, 6, 2, 9, 4, 1, 7].map((h, i) => (
                                                    <div key={i} className="w-1.5 bg-foreground" style={{ height: `${h * 10}%` }} />
                                                ))}
                                            </div>
                                            <p className="font-mono text-xl font-bold tracking-widest text-foreground">UNACH-REV-2026-083</p>
                                            <p className="text-xs text-muted-foreground mt-2">Folio de referencia</p>
                                        </div>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between border-b border-border pb-2">
                                                <span className="text-muted-foreground">Concepto:</span>
                                                <span className="font-semibold text-foreground">Revisión de tesis</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border pb-2">
                                                <span className="text-muted-foreground">Fecha límite de pago:</span>
                                                <span className="font-semibold text-foreground">05 Oct 2026</span>
                                            </div>
                                            <div className="flex justify-between pt-2">
                                                <span className="text-muted-foreground font-bold">Total a pagar:</span>
                                                <span className="font-bold text-lg text-[#10B981]">$1,250.00 MXN</span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-muted-foreground text-center">
                                            Puedes pagar este folio en bancos, tiendas de conveniencia o en la caja de la universidad.
                                        </p>

                                        {/* BOTONES LADO A LADO */}
                                        <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-border">
                                            <Button 
                                                onClick={handlePrintFolio}
                                                disabled={isPrinting || isProcessingCash}
                                                variant="outline"
                                                className="flex-1 border-border text-foreground hover:bg-accent/40 font-bold h-11 gap-2"
                                            >
                                                {isPrinting ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        Imprimiendo...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Printer className="size-4" />
                                                        Imprimir Ficha
                                                    </>
                                                )}
                                            </Button>
                                            
                                            <Button 
                                                onClick={handleSimulateCashPayment}
                                                disabled={isPrinting || isProcessingCash}
                                                className="flex-1 bg-[#10B981] hover:bg-[#0ea371] text-white font-bold h-11 gap-2"
                                            >
                                                {isProcessingCash ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        Procesando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="size-4" />
                                                        Simular Pago
                                                    </>
                                                )}
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
                            <p className="text-xs text-muted-foreground mt-1">Cuota de ejemplo · MXN</p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Concepto</span>
                                <span className="text-sm font-semibold text-foreground text-right">Revisión de tesis</span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Tesis</span>
                                <span className="text-sm font-medium text-foreground text-right max-w-[200px] leading-tight">Inclusión digital en comunidades rurales</span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Fecha límite</span>
                                <span className="text-sm font-medium text-foreground">05 Oct 2026</span>
                            </div>
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-sm text-muted-foreground">Referencia</span>
                                <span className="text-sm font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded text-xs">UNACH-REV-2026-083</span>
                            </div>

                            <div className="border-t border-border pt-4 mt-4 flex justify-between items-end">
                                <span className="text-sm font-bold text-foreground">Total a pagar</span>
                                <span className="text-2xl font-bold text-[#10B981]">$1,250.00</span>
                            </div>
                        </div>

                        <div className="bg-muted/30 px-6 py-3 border-t border-border">
                            <p className="text-[10px] text-center text-muted-foreground leading-tight">
                                Este monto y referencia son solo datos de ejemplo.
                            </p>
                        </div>
                    </div>

                </div>
            </div>
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
