import type { JuryFormData, JurySlotKey } from './types';

export interface JurySlotDefinition {
    key: JurySlotKey;
    cargo: string;
    fieldLabel: string;
}

export const JURY_SLOTS: JurySlotDefinition[] = [
    {
        key: 'presidente',
        cargo: 'Presidente',
        fieldLabel: 'Presidente del jurado',
    },
    {
        key: 'secretario',
        cargo: 'Secretario',
        fieldLabel: 'Secretario del jurado',
    },
    {
        key: 'vocal',
        cargo: 'Vocal',
        fieldLabel: 'Vocal del jurado',
    },
    {
        key: 'suplente_1',
        cargo: 'Suplente 1',
        fieldLabel: 'Primer suplente',
    },
    {
        key: 'suplente_2',
        cargo: 'Suplente 2',
        fieldLabel: 'Segundo suplente',
    },
];

export const EMPTY_JURY_FORM: JuryFormData = {
    id_proyecto: '',
    presidente: '',
    secretario: '',
    vocal: '',
    suplente_1: '',
    suplente_2: '',
};
