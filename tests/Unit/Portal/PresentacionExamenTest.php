<?php

use App\Support\Portal\PresentacionExamen;
use Carbon\CarbonImmutable;

describe('PresentacionExamen', function () {
    it('presenta la fecha con día de la semana y mes en español', function () {
        expect(PresentacionExamen::fechaLarga('2026-05-15'))->toBe('Viernes 15 de mayo de 2026');
        expect(PresentacionExamen::fechaLarga('2026-01-01'))->toBe('Jueves 1 de enero de 2026');
        expect(PresentacionExamen::fechaLarga(CarbonImmutable::parse('2026-12-25')))
            ->toBe('Viernes 25 de diciembre de 2026');
    });

    it('presenta la fecha sin día de la semana', function () {
        expect(PresentacionExamen::fechaSinDia('2026-10-30'))->toBe('30 de octubre de 2026');
        expect(PresentacionExamen::fechaSinDia(CarbonImmutable::parse('2026-01-01')))
            ->toBe('1 de enero de 2026');
    });

    it('recorta la hora al formato de 24 horas sin segundos', function () {
        expect(PresentacionExamen::hora('09:30:00'))->toBe('09:30');
        expect(PresentacionExamen::hora('14:05'))->toBe('14:05');
        expect(PresentacionExamen::hora(' 08:00:00 '))->toBe('08:00');
    });

    it('agrega el sufijo de horas para mostrar la hora del examen', function () {
        expect(PresentacionExamen::horaLarga('10:00:00'))->toBe('10:00 hrs');
    });

    it('calcula los días restantes con signo negativo cuando la fecha pasó', function () {
        $hoy = CarbonImmutable::today();

        expect(PresentacionExamen::diasRestantes($hoy))->toBe(0);
        expect(PresentacionExamen::diasRestantes($hoy->addDays(12)))->toBe(12);
        expect(PresentacionExamen::diasRestantes($hoy->subDays(3)))->toBe(-3);
    });

    it('clasifica el resultado final para los badges de color', function () {
        expect(PresentacionExamen::claveResultado('Aprobado'))->toBe('aprobado');
        expect(PresentacionExamen::claveResultado('Aprobado con observaciones'))->toBe('observaciones');
        expect(PresentacionExamen::claveResultado('Rechazado'))->toBe('rechazado');
        expect(PresentacionExamen::claveResultado('Pendiente'))->toBe('otro');
        expect(PresentacionExamen::claveResultado(null))->toBeNull();
        expect(PresentacionExamen::claveResultado('   '))->toBeNull();
    });

    it('clasifica el estado del examen para los badges de color', function () {
        expect(PresentacionExamen::claveEstado('Programado'))->toBe('programado');
        expect(PresentacionExamen::claveEstado('Realizado'))->toBe('realizado');
        expect(PresentacionExamen::claveEstado('Cancelado'))->toBe('cancelado');
        expect(PresentacionExamen::claveEstado(null))->toBe('programado');
    });
});
