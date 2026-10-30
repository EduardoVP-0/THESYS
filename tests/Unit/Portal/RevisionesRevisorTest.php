<?php

use App\Support\Portal\RevisionesRevisor;

describe('RevisionesRevisor', function () {
    it('declara los 3 estados válidos del dictamen de un revisor', function () {
        expect(RevisionesRevisor::ESTADOS_VALIDOS)->toBe([
            'Pendiente',
            'Con cambios',
            'Aprobado',
        ]);
    });

    it('entrega los valores limpios para reiniciar el dictamen de los revisores', function () {
        $valores = RevisionesRevisor::valoresPendientes();

        expect($valores)->toBe([
            'estado_revision' => 'Pendiente',
            'comentarios_revision' => null,
            'fecha_revision' => null,
        ]);
    });

    it('sin estados registrados el dictamen global está en revisión', function () {
        expect(RevisionesRevisor::estadoGlobal([]))->toBe('En revisión');
    });

    it('con los 2 revisores pendientes el dictamen global está en revisión', function () {
        expect(RevisionesRevisor::estadoGlobal(['Pendiente', 'Pendiente']))->toBe('En revisión');
    });

    it('con un revisor aprobado y otro pendiente el dictamen global sigue en revisión', function () {
        expect(RevisionesRevisor::estadoGlobal(['Aprobado', 'Pendiente']))->toBe('En revisión');
    });

    it('con algún revisor de con cambios el dictamen global es con cambios', function () {
        expect(RevisionesRevisor::estadoGlobal(['Aprobado', 'Con cambios']))->toBe('Con cambios');
        expect(RevisionesRevisor::estadoGlobal(['Con cambios', 'Con cambios']))->toBe('Con cambios');
    });

    it('con ambos revisores aprobados el dictamen global es aprobado', function () {
        expect(RevisionesRevisor::estadoGlobal(['Aprobado', 'Aprobado']))->toBe('Aprobado');
    });

    it('los estados no reconocidos no aprueban el dictamen global', function () {
        expect(RevisionesRevisor::estadoGlobal(['Estado raro', 'Otro']))->toBe('En revisión');
    });

    it('mapea el estado crudo del revisor a su etiqueta visual', function () {
        expect(RevisionesRevisor::etiqueta('Aprobado'))->toBe('Aprobado');
        expect(RevisionesRevisor::etiqueta('Con cambios'))->toBe('Con cambios');
        expect(RevisionesRevisor::etiqueta('Pendiente'))->toBe('En revisión');
        expect(RevisionesRevisor::etiqueta('inventado'))->toBe('En revisión');
    });

    it('valida si un texto corresponde a un estado guardable', function () {
        expect(RevisionesRevisor::esEstadoValido('Aprobado'))->toBeTrue();
        expect(RevisionesRevisor::esEstadoValido('Con cambios'))->toBeTrue();
        expect(RevisionesRevisor::esEstadoValido('Pendiente'))->toBeTrue();
        expect(RevisionesRevisor::esEstadoValido('Aprobada'))->toBeFalse();
        expect(RevisionesRevisor::esEstadoValido(''))->toBeFalse();
        expect(RevisionesRevisor::esEstadoValido(null))->toBeFalse();
    });
})->group('portal');
