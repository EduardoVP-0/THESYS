import { useSyncExternalStore } from 'react';

export type AccentColor = 'blue' | 'violet' | 'emerald' | 'rose';

export type AccentOption = {
    value: AccentColor;
    label: string;
    /** Color mostrado en el selector y aplicado a --accent (null = valor original del tema) */
    swatch: string;
    override: string | null;
};

export const ACCENT_OPTIONS: AccentOption[] = [
    { value: 'blue', label: 'Azul', swatch: '#b8d4e3', override: null },
    { value: 'violet', label: 'Violeta', swatch: '#c9b8f0', override: '#c9b8f0' },
    { value: 'emerald', label: 'Esmeralda', swatch: '#a7e3c9', override: '#a7e3c9' },
    { value: 'rose', label: 'Rosa', swatch: '#f4b8c8', override: '#f4b8c8' },
];

const STORAGE_KEY = 'accent-color';
const listeners = new Set<() => void>();
let currentAccent: AccentColor = 'blue';

const isAccentColor = (value: string | null): value is AccentColor =>
    ACCENT_OPTIONS.some((option) => option.value === value);

const applyAccent = (accent: AccentColor): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const option = ACCENT_OPTIONS.find((item) => item.value === accent);

    if (option?.override) {
        document.documentElement.style.setProperty('--accent', option.override);
    } else {
        document.documentElement.style.removeProperty('--accent');
    }
};

export function initializeAccentColor(): void {
    if (typeof window === 'undefined') {
        return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);

    currentAccent = isAccentColor(stored) ? stored : 'blue';
    applyAccent(currentAccent);
}

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

export function useAccentColor() {
    const accent = useSyncExternalStore(
        subscribe,
        () => currentAccent,
        () => 'blue' as AccentColor,
    );

    const updateAccent = (next: AccentColor): void => {
        currentAccent = next;
        localStorage.setItem(STORAGE_KEY, next);
        applyAccent(next);
        listeners.forEach((listener) => listener());
    };

    return { accent, updateAccent } as const;
}
