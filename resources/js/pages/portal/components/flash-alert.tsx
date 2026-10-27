import { usePage } from '@inertiajs/react';
import { CheckCircle2, XCircle } from 'lucide-react';

type FlashProps = {
    flash?: {
        success?: string | null;
        error?: string | null;
    };
};

export function FlashAlert() {
    const { flash } = usePage<FlashProps>().props;

    if (!flash?.success && !flash?.error) {
        return null;
    }

    if (flash.success) {
        return (
            <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                <span>{flash.success}</span>
            </div>
        );
    }

    return (
        <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
        >
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{flash.error}</span>
        </div>
    );
}
