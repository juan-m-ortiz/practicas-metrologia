// Práctica 4 · Confirmación metrológica de los equipos del caso — contenido.
// Código PÚBLICO: matriz de equipos con requisitos (CMR) y datos del certificado (CME).
// La clave y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;

  var DECISIONES = [['apto', 'Apto'], ['correccion', 'Apto con corrección'], ['noapto', 'No apto']];
  var TUR = [['alta', 'TUR ≥ 4:1 · adecuado'], ['media', 'TUR entre 3:1 y 4:1 · aceptable'], ['baja', 'TUR < 3:1 · riesgo alto']];
  var REGISTRO = [
    ['D2', 'Estado que se registra y se rotula en el equipo', [['apto', 'Apto para uso'], ['limitado', 'Apto con restricciones, sin más acciones'], ['fuera', 'Fuera de servicio: no usar hasta nueva confirmación']]],
    ['D3', 'Acción inmediata', [['corregir', 'Seguir usándolo y corregir las lecturas'], ['ajustar', 'Ajuste, mantenimiento o reparación y nueva calibración'],
      ['reclasificar', 'Reclasificarlo para usos menos exigentes, con su nuevo EMP'], ['nada', 'Esperar a la próxima calibración programada']]],
    ['D4', 'Numerales de la ISO/IEC 17025 que aplican', [['6413', 'Solo 6.4.13 (hoja de vida)'], ['6497', '6.4.9 (equipo fuera de servicio) y 7.10 (trabajo no conforme)'], ['77', '7.7 (aseguramiento de la validez)']]],
    ['D5', 'Antes de volver a usarlo', [['mismo', 'Basta con el certificado actual'], ['reconfirmar', 'Recalibrar y repetir la confirmación metrológica'], ['limpiar', 'Basta con limpiarlo']]]
  ];

  function chips(e) {
    return crear('div', { clase: 'ficha-equipo' }, [
      crear('div', null, [crear('small', { texto: 'Uso previsto' }), crear('span', { texto: e.uso })]),
      crear('div', null, [crear('small', { texto: 'EMP requerido (CMR)' }), crear('b', { texto: e.emp + ' ' + e.unidad })]),
      crear('div', null, [crear('small', { texto: 'Certificado (CME)' }), crear('b', { texto: 'E = ' + e.E + ' ' + e.unidad + ' · U = ' + e.U + ' ' + e.unidad + ' (k = 2)' })]),
      crear('div', null, [crear('small', { texto: '¿Admite corregir lecturas?' }), crear('span', null, [C.icono(e.corregible ? 'check' : 'x'), e.corregible ? 'Sí' : 'No: entrega o contiene un volumen'])])
    ]);
  }

  function cabEquipo(e, n) {
    return crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono(e.icono)]),
      crear('div', null, [crear('h3', { texto: 'Equipo ' + n + ' · ' + e.nombre }), crear('span', { clase: 'suave peq', texto: e.punto + ' · ' + e.fuente })])]);
  }

  window.Motor.iniciar({
    id: 'P4',
    titulo: 'Confirmación metrológica de los equipos del caso',
    icono: 'insignia',
    etiqueta: 'Sesión 2 · Práctica 4',
    descripcion: 'Decida si cada equipo del laboratorio del caso es apto para su uso previsto, comparando lo que el método exige (CMR) con lo que informa su certificado (CME).',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · calificación automática'], ['libro', 'ISO 10012 · ISO/IEC 17025 6.4 · ILAC G8']],
    notaRegistro: 'Los datos de los certificados cambian para cada estudiante.',
    comoFunciona: [
      'Para cada equipo, compare el EMP que exige el método con el error (E) y la incertidumbre (U) del certificado.',
      'Calcule |E| + U y decida: apto, apto con corrección o no apto.',
      'Juzgue al proveedor de calibración con la TUR = EMP / U.',
      'Diligencie el registro para la hoja de vida del equipo no apto. Revise y envíe.'
    ],
    partes: [
      { id: 'A', titulo: 'Criterio', nombre: 'A · Criterio |E| + U', icono: 'regla', tono: 'cielo', pts: 25, resumen: 'Sume el error y la incertidumbre de cada certificado.' },
      { id: 'B', titulo: 'Decisión', nombre: 'B · Decisión de confirmación', icono: 'insignia', tono: 'esmeralda', pts: 30, resumen: 'Apto, apto con corrección o no apto.' },
      { id: 'C', titulo: 'TUR', nombre: 'C · Proveedor: TUR', icono: 'manometro', tono: 'violeta', pts: 20, resumen: '¿La incertidumbre de la calibración es suficiente frente al EMP?' },
      { id: 'D', titulo: 'Registro', nombre: 'D · Registro para la hoja de vida', icono: 'documento', tono: 'rosa', pts: 25, resumen: 'Estado, acción y numerales del equipo no apto (6.4.13).' }
    ],
    varianteDemo: { equipos: [
      { clave: 'balanza', nombre: 'Balanza analítica', icono: 'medalla', unidad: 'mg', uso: 'Pesadas de 0,1 g a 100 g para preparar patrones', punto: 'Carga de 100 g', fuente: 'Requisito del método para pesar patrones', emp: '±0,50', E: '+0,21', U: '0,08', dec: 2, corregible: true },
      { clave: 'micropipeta', nombre: 'Micropipeta de volumen variable (100 µL)', icono: 'vaso', unidad: 'µL', uso: 'Diluciones de patrones a 100 µL', punto: 'Volumen de 100 µL (ISO 8655-6)', fuente: 'ISO 8655-2, error sistemático de referencia', emp: '±0,80', E: '−0,98', U: '0,15', dec: 2, corregible: false },
      { clave: 'termometro', nombre: 'Termómetro digital de la nevera', icono: 'termometro', unidad: '°C', uso: 'Control de la nevera de patrones, 2 °C a 8 °C', punto: 'Punto de 5 °C', fuente: 'Criterio interno para la conservación de patrones', emp: '±0,50', E: '+0,62', U: '0,10', dec: 2, corregible: true },
      { clave: 'matraz', nombre: 'Matraz aforado de 100 mL clase A', icono: 'matraz', unidad: 'mL', uso: 'Preparación de patrones de trabajo', punto: 'Volumen nominal de 100 mL', fuente: 'ISO 1042, tolerancia clase A', emp: '±0,100', E: '−0,071', U: '0,021', dec: 3, corregible: false },
      { clave: 'termohigrometro', nombre: 'Termohigrómetro del laboratorio (humedad relativa)', icono: 'nube', unidad: '%', uso: 'Registro de la humedad relativa, (30 a 70) %', punto: 'Humedad relativa de 50 % (error en puntos porcentuales)', fuente: 'Criterio interno de condiciones ambientales', emp: '±5,0', E: '+1,2', U: '1,6', dec: 1, corregible: true }
    ] },
    respuestasVacias: function () { return { A: {}, B: {}, C: {}, D: { observacion: '' } }; },

    pintar: {
      A: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'cielo' });
        cont.appendChild(h.encabezado('A', 'Use los valores tal como aparecen en el certificado. Se acepta ±1 en el último dígito.'));
        v.equipos.forEach(function (e, i) {
          cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:' + (i + 1) }, [cabEquipo(e, i + 1), chips(e),
            h.respuesta('A', 'A' + (i + 1), '|E| + U', e.unidad, { placeholder: 'Con ' + e.dec + ' decimales' })]));
        });
        panel.appendChild(cont);
      },
      B: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'esmeralda' });
        cont.appendChild(h.encabezado('B', 'Regla: apto si |E| + U ≤ EMP. Apto con corrección si |E| + U > EMP, pero U ≤ EMP y el equipo admite corregir lecturas. No apto en los demás casos.'));
        cont.appendChild(crear('div', { clase: 'regla-decision aparecer' }, [
          crear('div', { clase: 'zona ok' }, [C.icono('checkCirculo'), crear('b', { texto: 'Apto' }), crear('span', { texto: '|E| + U ≤ EMP' })]),
          crear('div', { clase: 'zona corr' }, [C.icono('lapiz'), crear('b', { texto: 'Apto con corrección' }), crear('span', { texto: '|E| + U > EMP · U ≤ EMP · admite corregir' })]),
          crear('div', { clase: 'zona no' }, [C.icono('xCirculo'), crear('b', { texto: 'No apto' }), crear('span', { texto: 'Los demás casos' })])
        ]));
        v.equipos.forEach(function (e, i) {
          cont.appendChild(h.ejercicio(e.icono, 'Equipo ' + (i + 1) + ' · ' + e.nombre, 6,
            ['EMP ', h.dato(e.emp + ' ' + e.unidad), ' · E = ', h.dato(e.E + ' ' + e.unidad), ' · U = ', h.dato(e.U + ' ' + e.unidad),
              ' · ', e.corregible ? 'admite corregir lecturas' : 'no admite corregir lecturas'],
            [h.seleccion('B', 'B' + (i + 1), 'Decisión', DECISIONES, { columnas: 3 })], i + 1));
        });
        panel.appendChild(cont);
      },
      C: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('C', 'TUR = EMP / U. Práctica común: 4:1 (ANSI/NCSL Z540.3); 3:1 como mínimo razonable; por debajo, use banda de guarda.'));
        v.equipos.forEach(function (e, i) {
          cont.appendChild(h.ejercicio('manometro', 'Equipo ' + (i + 1) + ' · ' + e.nombre, 4, ['EMP ', h.dato(e.emp + ' ' + e.unidad), ' · U = ', h.dato(e.U + ' ' + e.unidad)],
            [h.seleccion('C', 'C' + (i + 1), 'Relación tolerancia/incertidumbre', TUR, { columnas: 3 })], i + 1));
        });
        panel.appendChild(cont);
      },
      D: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'rosa' });
        cont.appendChild(h.encabezado('D', 'Registro para la hoja de vida (6.4.13) del equipo que resultó no apto. Si hay más de uno, elija cualquiera.'));
        var hoja = crear('div', { clase: 'tarjeta hoja-vida aparecer', style: '--i:1' }, [
          crear('div', { clase: 'hoja-vida-cab' }, [C.icono('documento'), crear('b', { texto: 'HOJA DE VIDA · REGISTRO DE CONFIRMACIÓN METROLÓGICA' }), crear('span', { texto: 'Laboratorio de aguas (ficticio)' })]),
          h.seleccion('D', 'D1', 'D1 · Equipo', v.equipos.map(function (e, i) { return [e.clave, 'Equipo ' + (i + 1) + ' · ' + e.nombre]; }), { columnas: 1 })
        ]);
        REGISTRO.forEach(function (r) { hoja.appendChild(h.seleccion('D', r[0], r[0] + ' · ' + r[1], r[2], { columnas: 1 })); });
        hoja.appendChild(h.texto('D', 'observacion', 'D6 · Observación para la hoja de vida (opcional, sin nota)', { max: 600, minimo: 60, alto: 110, placeholder: 'Ej.: se rotula y se informa al responsable técnico…' }));
        cont.appendChild(hoja);
        panel.appendChild(cont);
      }
    },

    avance: function (r, h) {
      var ids = ['1', '2', '3', '4', '5'];
      var nA = h.llenos('A', ids.map(function (n) { return 'A' + n; })), nB = h.llenos('B', ids.map(function (n) { return 'B' + n; }));
      var nC = h.llenos('C', ids.map(function (n) { return 'C' + n; })), nD = h.llenos('D', ['D1', 'D2', 'D3', 'D4', 'D5']);
      var faltan = (5 - nA) + (5 - nB) + (5 - nC) + (5 - nD);
      return {
        fraccion: { A: nA / 5, B: nB / 5, C: nC / 5, D: nD / 5 },
        sub: { A: nA + ' de 5', B: nB + ' de 5', C: nC + ' de 5', D: nD + ' de 5' },
        revision: [
          [nA === 5, 'regla', 'Parte A: ' + nA + ' de 5 cálculos', nA < 5 ? 'Hay cálculos vacíos.' : 'Completa.'],
          [nB === 5, 'insignia', 'Parte B: ' + nB + ' de 5 decisiones', nB < 5 ? 'Hay equipos sin decisión.' : 'Completa.'],
          [nC === 5, 'manometro', 'Parte C: ' + nC + ' de 5 TUR', nC < 5 ? 'Hay equipos sin TUR.' : 'Completa.'],
          [nD === 5, 'documento', 'Parte D: ' + nD + ' de 5 campos del registro', nD < 5 ? 'Complete el registro.' : 'Completa.']
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas sin completar.' : ''
      };
    },

    apoyo: function (cont) {
      cont.appendChild(crear('h3', null, [C.icono('insignia'), 'Confirmación metrológica (ISO 10012)']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div>Conjunto de operaciones para asegurar que el equipo es conforme con los requisitos de su uso previsto. No se logra hasta demostrar y documentar la adecuación.</div>' +
        '<div><b>CMR:</b> características metrológicas requeridas por el proceso (EMP, incertidumbre objetivo, intervalo).</div>' +
        '<div><b>CME:</b> características metrológicas del equipo (lo que informa el certificado).</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('regla'), 'Regla de decisión del curso']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>Apto:</b> |E| + U ≤ EMP (equivale a una banda de guarda igual a U).</div>' +
        '<div><b>Apto con corrección:</b> |E| + U > EMP, pero U ≤ EMP y el equipo admite corregir sus lecturas; la corrección se aplica y se actualiza en hojas de cálculo y software (6.4.11).</div>' +
        '<div><b>No apto:</b> en los demás casos. Retirar y rotular (6.4.9), evaluar el impacto (7.10), ajustar o reparar y reconfirmar, o reclasificar.</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('manometro'), 'TUR']));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>≥ 4:1</td><td>Práctica común (ANSI/NCSL Z540.3)</td></tr><tr><td>≈ 3:1</td><td>Mínimo razonable</td></tr><tr><td>&lt; 3:1</td><td>Riesgo alto: banda de guarda</td></tr>' }));
      cont.appendChild(crear('h3', null, [C.icono('documento'), 'Hoja de vida (6.4.13)']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html: '<div>Identificación, verificación de requisitos, ubicación, calibraciones y ajustes con su criterio de aceptación y próxima fecha, MR, mantenimiento, daños y reparaciones.</div>' }));
    }
  });
})();
