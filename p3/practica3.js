// Práctica 3 · Arme y audite la cadena de trazabilidad — contenido de la práctica.
// Código PÚBLICO: cadena para ordenar y evidencias ficticias para auditar.
// La clave y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;

  var CADENA = {
    si: ['SI', 'Definición de las unidades (kilogramo, mol, metro cúbico)', 'destellos'],
    inm: ['Instituto nacional de metrología', 'Patrones primarios y pureza certificada (CIPM MRA)', 'birrete'],
    acred: ['Productor de MR y laboratorio de calibración acreditados', 'MRC de Pb y calibración de balanza y micropipetas', 'insignia'],
    trabajo: ['Laboratorio', 'Patrones de trabajo de Pb preparados por dilución con equipos calibrados', 'matraz'],
    curva: ['Espectrómetro de absorción atómica', 'Curva de calibración diaria', 'actividad']
  };
  var VIAS = [
    ['8.1.1', '8.1.1 · INM con el servicio en el CIPM MRA (CMC en la KCDB)'],
    ['8.1.2', '8.1.2 · Laboratorio acreditado, servicio en el alcance y certificado con marca'],
    ['8.1.3', '8.1.3 · INM fuera del CIPM MRA con comparaciones (incluye el INM de Colombia)'],
    ['8.1.4', '8.1.4 · Laboratorio no acreditado con evidencias del Anexo A'],
    ['8.2.1', '8.2.1 · MRC producido por un INM con servicio en la KCDB'],
    ['8.2.2', '8.2.2 · MRC de un productor acreditado (ISO 17034)'],
    ['no', 'Con esta evidencia no se demuestra la trazabilidad']
  ];
  var HALLAZGOS = [
    ['ninguno', 'Sin hallazgo'],
    ['simbolo', 'Certificado sin símbolo ni referencia a la acreditación (CEA-3.0-02 nota 6; ILAC P8)'],
    ['alcance', 'El alcance acreditado no cubre el intervalo de uso (CEA-3.0-02 8.1.2; ISO/IEC 17025 6.5.1)'],
    ['pmr', 'MRC de un productor no acreditado sin evidencia de idoneidad (CEA-3.0-02 8.2; ISO/IEC 17025 6.6)'],
    ['alterna', 'Vía alterna sin la evidencia exigida (CEA-3.0-02 8.1.3 y 8.1.4)'],
    ['vencido', 'Calibración vencida según el programa del laboratorio (ISO/IEC 17025 6.4.7)']
  ];
  var DICTAMEN = [
    ['D1', '¿Puede el laboratorio declarar hoy que el resultado (8,7 ± 1,8) µg/L es trazable al SI?',
      [['si', 'Sí: todos los equipos tienen certificado'], ['simrc', 'Sí: el MRC trae un valor certificado'], ['no', 'No: hay eslabones sin evidencia de trazabilidad']]],
    ['D2', '¿Qué condición del Anexo A.2.1 de la ISO/IEC 17025 no se cumple con el MRC de plomo?',
      [['a', 'a) Mensurando especificado'], ['c', 'c) Incertidumbre evaluada en cada paso'], ['e', 'e) Competencia demostrada de quien interviene en la cadena']]],
    ['D3', '¿Qué acción corrige el eslabón del MRC?',
      [['recal', 'Calibrar de nuevo el espectrómetro con el mismo MRC'],
        ['mrc', 'Usar un MRC de un productor acreditado ISO 17034 o de un INM; o demostrar su idoneidad y evaluar al productor como proveedor (6.6)'],
        ['nada', 'Ninguna: basta con que el certificado diga «trazable al SI»']]]
  ];

  // ---------------------------------------------------------------------------
  // Cadena ordenable (ratón, dedo o teclado)
  // ---------------------------------------------------------------------------

  function ordenActual(h) {
    var o = h.estado.respuestas.A.orden;
    return o ? o.split(',') : h.estado.variante.cadenaInicial.slice();
  }

  function pintarCadena(lista, h) {
    lista.textContent = '';
    var orden = ordenActual(h);
    orden.forEach(function (id, i) {
      var e = CADENA[id];
      var subir = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Subir', 'aria-label': 'Subir ' + e[0] }, [C.icono('flechaIzq', 'rot-arriba')]);
      var bajar = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Bajar', 'aria-label': 'Bajar ' + e[0] }, [C.icono('flechaIzq', 'rot-abajo')]);
      subir.disabled = i === 0;
      bajar.disabled = i === orden.length - 1;
      subir.addEventListener('click', function () { mover(h, lista, i, i - 1); });
      bajar.addEventListener('click', function () { mover(h, lista, i, i + 1); });
      lista.appendChild(crear('li', { clase: 'eslabon', 'data-id': id }, [
        crear('span', { clase: 'asa', 'data-tip': 'Arrastre para ordenar', 'aria-hidden': 'true' }, [crear('i'), crear('i'), crear('i')]),
        crear('span', { clase: 'eslabon-pos', texto: String(i + 1) }),
        crear('span', { clase: 'ico-tile chico' }, [C.icono(e[2])]),
        crear('div', { clase: 'eslabon-texto' }, [crear('b', { texto: e[0] }), crear('span', { texto: e[1] })]),
        crear('div', { clase: 'eslabon-botones' }, [subir, bajar])
      ]));
    });
  }

  function guardarOrden(h, lista) {
    h.estado.respuestas.A.orden = Array.prototype.map.call(lista.children, function (li) { return li.getAttribute('data-id'); }).join(',');
    h.guardar();
    h.actualizar();
  }

  function mover(h, lista, de, a) {
    var orden = ordenActual(h);
    var x = orden.splice(de, 1)[0];
    orden.splice(a, 0, x);
    h.estado.respuestas.A.orden = orden.join(',');
    h.guardar();
    h.actualizar();
    pintarCadena(lista, h);
    var li = lista.children[a];
    if (li) { li.classList.add('movido'); var b = li.querySelectorAll('.btn-icono')[a < de ? 0 : 1]; if (b && !b.disabled) b.focus(); }
  }

  function hacerOrdenable(lista, h) {
    var activo = null, y0 = 0;
    lista.addEventListener('pointerdown', function (e) {
      var asa = e.target.closest('.asa');
      if (!asa) return;
      activo = asa.closest('.eslabon');
      activo.setPointerCapture(e.pointerId);
      activo.classList.add('arrastrando');
      y0 = e.clientY;
      e.preventDefault();
    });
    lista.addEventListener('pointermove', function (e) {
      if (!activo) return;
      var antes = activo.offsetTop;
      var destino = null;
      var hermanos = Array.prototype.slice.call(lista.children);
      for (var i = 0; i < hermanos.length; i++) {
        if (hermanos[i] === activo) continue;
        var r = hermanos[i].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { destino = hermanos[i]; break; }
      }
      if (destino !== activo.nextElementSibling && destino !== activo) {
        lista.insertBefore(activo, destino);
        y0 += activo.offsetTop - antes;
      }
      activo.style.transform = 'translateY(' + (e.clientY - y0) + 'px)';
    });
    function soltar() {
      if (!activo) return;
      activo.style.transform = '';
      activo.classList.remove('arrastrando');
      activo = null;
      guardarOrden(h, lista);
      pintarCadena(lista, h);
    }
    lista.addEventListener('pointerup', soltar);
    lista.addEventListener('pointercancel', soltar);
  }

  // ---------------------------------------------------------------------------
  // Evidencias
  // ---------------------------------------------------------------------------

  function filaDato(etq, valor, icono) {
    return crear('div', null, [crear('small', { texto: etq }), crear('span', null, [icono ? C.icono(icono) : null, valor])]);
  }

  function tarjetaEvidencia(e, compacta) {
    var esKcdb = /KCDB/.test(e.alcance);
    var marca = e.simbolo
      ? crear('span', { clase: 'sello-acred' }, [C.icono('insignia'), 'Marca de acreditación · ' + e.codigo + ' (ficticio)'])
      : crear('span', { clase: 'sello-acred ausente' }, [C.icono('prohibido'), 'Sin símbolo ni referencia a la acreditación']);
    var cuerpo = [
      crear('div', { clase: 'ficha-equipo' }, [
        filaDato('Emisor', e.emisor),
        filaDato('Intervalo de uso en el laboratorio', e.uso),
        filaDato(/MRC/.test(e.titulo) ? 'Valor certificado' : 'Calibrado', e.calibrado),
        filaDato('Fecha de calibración o certificación', e.fecha)
      ]),
      e.resultado ? crear('p', { clase: 'suave peq', texto: 'Resultado: ' + e.resultado }) : null,
      /MRC|INM/.test(e.tipo) && !e.simbolo ? null : marca,
      crear('div', { clase: 'extracto' + (esKcdb ? ' kcdb' : '') }, [
        crear('span', { clase: 'extracto-etq' }, [C.icono(esKcdb ? 'buscar' : 'lista'), esKcdb ? 'Consulta en la KCDB (simulada)' : 'Directorio de acreditados (simulado)']),
        crear('span', { texto: e.alcance })
      ])
    ];
    var cab = crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono(e.icono)]),
      crear('div', null, [crear('h3', { texto: e.id + ' · ' + e.titulo }), crear('span', { clase: 'suave peq', texto: e.tipo })])]);
    if (compacta) {
      return crear('details', { clase: 'evidencia-plegable' }, [crear('summary', null, [C.icono('ojo'), 'Ver la evidencia']), crear('div', null, cuerpo)]);
    }
    return crear('div', null, [cab].concat(cuerpo));
  }

  window.Motor.iniciar({
    id: 'P3',
    titulo: 'Arme y audite la cadena de trazabilidad',
    icono: 'cadena',
    etiqueta: 'Sesión 1 · Práctica 3',
    descripcion: 'Ordene la cadena de trazabilidad del resultado de plomo, identifique la vía del CEA-3.0-02 de cada evidencia y actúe como auditor: ¿la cadena está completa?',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · calificación automática'], ['libro', 'ISO/IEC 17025 6.5 y Anexo A · CEA-3.0-02 · ILAC P10']],
    notaRegistro: 'Las fallas de las evidencias cambian para cada estudiante.',
    comoFunciona: [
      'Arrastre los eslabones para ordenar la cadena desde el SI hasta el equipo que da el resultado.',
      'Revise las seis evidencias del laboratorio con los extractos simulados de la KCDB y del directorio de acreditados.',
      'Para cada evidencia, elija su vía de trazabilidad y el hallazgo de auditoría.',
      'Emita su dictamen, revise su avance y envíe.'
    ],
    pie: 'Evidencias ficticias con fines didácticos',
    partes: [
      { id: 'A', titulo: 'Cadena', nombre: 'A · Arme la cadena', icono: 'cadena', tono: 'cielo', pts: 25, resumen: 'Ordene los eslabones desde el SI hasta el equipo de medición.' },
      { id: 'B', titulo: 'Vías', nombre: 'B · Vías del CEA-3.0-02', icono: 'insignia', tono: 'violeta', pts: 30, resumen: '¿Cómo demuestra trazabilidad cada evidencia?' },
      { id: 'C', titulo: 'Hallazgos', nombre: 'C · Hallazgos de auditoría', icono: 'buscar', tono: 'ambar', pts: 30, resumen: '¿Qué requisito incumple cada evidencia, si alguno?' },
      { id: 'D', titulo: 'Dictamen', nombre: 'D · Dictamen del auditor', icono: 'medalla', tono: 'rosa', pts: 15, resumen: '¿La cadena está completa? ¿Qué debe corregirse?' }
    ],
    varianteDemo: {
      cadenaInicial: ['curva', 'acred', 'si', 'trabajo', 'inm'],
      evidencias: [
        { id: 'E1', titulo: 'Balanza analítica · 220 g, d = 0,1 mg', icono: 'medalla', tipo: 'Certificado de calibración CC-' + C.fechaRelativa(-226).slice(0, 4) + '-0312', emisor: 'Laboratorio de Calibración Andina S. A. S.', acreditado: true, codigo: '15-LAC-901', simbolo: true, uso: '0,05 g a 100 g', calibrado: '0 g a 220 g (10 puntos)', alcance: 'Masa · balanzas de funcionamiento no automático, 0 g a 1 000 g · CMC 0,05 mg', fecha: C.fechaRelativa(-226), resultado: 'Error máximo encontrado +0,2 mg; U = 0,08 mg (k = 2)' },
        { id: 'E2', titulo: 'Micropipeta 100 µL a 1 000 µL', icono: 'vaso', tipo: 'Certificado de calibración CC-' + C.fechaRelativa(-203).slice(0, 4) + '-0458', emisor: 'Laboratorio de Calibración Andina S. A. S.', acreditado: true, codigo: '15-LAC-901', simbolo: false, uso: '100 µL a 1 000 µL', calibrado: '100 µL, 500 µL y 1 000 µL (ISO 8655-6)', alcance: 'Volumen · instrumentos volumétricos de pistón, 10 µL a 10 mL · CMC 0,10 %', fecha: C.fechaRelativa(-203), resultado: 'Error sistemático −0,3 µL a 100 µL; U = 0,15 µL (k = 2)' },
        { id: 'E3', titulo: 'Termómetro digital de la nevera de patrones', icono: 'termometro', tipo: 'Certificado de calibración CC-' + C.fechaRelativa(-246).slice(0, 4) + '-0611', emisor: 'Laboratorio de Calibración Andina S. A. S.', acreditado: true, codigo: '15-LAC-901', simbolo: true, uso: '2 °C a 8 °C', calibrado: '0 °C, 5 °C y 10 °C (comparación en baño)', alcance: 'Temperatura · termómetros digitales, 20 °C a 150 °C · CMC 0,05 °C', fecha: C.fechaRelativa(-246), resultado: 'Corrección máxima +0,2 °C; U = 0,10 °C (k = 2)' },
        { id: 'E4', titulo: 'MRC de plomo, 1 000 mg/L en HNO₃ 2 %', icono: 'matraz', tipo: 'Certificado de MRC lote PB-' + C.fechaRelativa(-280).slice(2, 4) + '11', emisor: 'Química Patrón Ltda.', acreditado: false, codigo: '', simbolo: false, uso: 'Preparación de patrones de 0 µg/L a 20 µg/L', calibrado: 'Valor certificado (1 000 ± 3) mg/L, k = 2; «trazable al SI» según el productor', alcance: 'No figura en el directorio de productores de MR acreditados (ISO 17034)', fecha: C.fechaRelativa(-280), resultado: '' },
        { id: 'E5', titulo: 'Juego de pesas de control clase E2 (1 mg a 200 g)', icono: 'insignia', tipo: 'Certificado de calibración del INM de Colombia', emisor: 'Instituto Nacional de Metrología de Colombia', acreditado: false, codigo: '', simbolo: false, uso: 'Comprobaciones intermedias de la balanza', calibrado: 'Masa convencional de cada pesa con su U', alcance: 'KCDB (simulado): sin CMC publicada para este servicio; el INM participa en comparaciones clave y suplementarias del SIM', fecha: C.fechaRelativa(-336), resultado: 'Desviaciones dentro de la clase E2' },
        { id: 'E6', titulo: 'MRC de elementos traza en agua (control de veracidad)', icono: 'vaso', tipo: 'Certificado de MRC de un instituto nacional de metrología', emisor: 'Instituto nacional de metrología (extranjero)', acreditado: false, codigo: '', simbolo: false, uso: 'Control de veracidad del método completo', calibrado: 'Pb: (19,6 ± 0,4) µg/L, k = 2', alcance: 'KCDB (simulado): servicio de MRC de elementos traza en agua publicado como CMC del INM', fecha: C.fechaRelativa(-412), resultado: '' }
      ]
    },
    respuestasVacias: function () { return { A: { orden: '' }, B: {}, C: {}, D: {} }; },

    pintar: {
      A: function (panel, h) {
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'cielo' });
        cont.appendChild(h.encabezado('A', 'Arrastre cada eslabón por su asa (o use las flechas). Arriba va la referencia de menor incertidumbre.'));
        var lista = crear('ol', { clase: 'cadena-lista', 'aria-label': 'Eslabones de la cadena de trazabilidad' });
        pintarCadena(lista, h);
        hacerOrdenable(lista, h);
        cont.appendChild(crear('div', { clase: 'tarjeta cadena-tarjeta aparecer', style: '--i:1' }, [
          crear('div', { clase: 'cadena-extremo arriba' }, [C.icono('destellos'), 'Menor incertidumbre']),
          lista,
          crear('div', { clase: 'eslabon fijo' }, [crear('span', { clase: 'eslabon-pos', texto: '★' }), crear('span', { clase: 'ico-tile chico', 'data-tono': 'esmeralda' }, [C.icono('checkCirculo')]),
            crear('div', { clase: 'eslabon-texto' }, [crear('b', { texto: 'Resultado del ensayo' }), crear('span', { texto: 'Plomo disuelto: (8,7 ± 1,8) µg/L, k = 2' })])]),
          crear('div', { clase: 'cadena-extremo abajo' }, [C.icono('alerta'), 'Mayor incertidumbre: cada eslabón aporta la suya'])
        ]));
        panel.appendChild(cont);
      },
      B: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('B', 'Revise cada evidencia y su extracto simulado. Escalera del CEA-3.0-02: primero 8.1.1 u 8.1.2; las vías alternas solo con evidencia.'));
        v.evidencias.forEach(function (e, i) {
          cont.appendChild(crear('div', { clase: 'tarjeta evidencia aparecer', style: '--i:' + (i + 1) }, [
            tarjetaEvidencia(e, false),
            h.seleccion('B', 'B' + (i + 1), 'Vía de trazabilidad que demuestra esta evidencia', VIAS, { columnas: 1 })
          ]));
        });
        panel.appendChild(cont);
      },
      C: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'ambar' });
        cont.appendChild(h.encabezado('C', 'Actúe como evaluador: ¿qué hallazgo deja cada evidencia? Puede abrir de nuevo cada evidencia.'));
        v.evidencias.forEach(function (e, i) {
          cont.appendChild(h.ejercicio(e.icono, e.id + ' · ' + e.titulo, 5, null, [tarjetaEvidencia(e, true),
            h.seleccion('C', 'C' + (i + 1), 'Hallazgo', HALLAZGOS, { columnas: 1 })], i + 1));
        });
        panel.appendChild(cont);
      },
      D: function (panel, h) {
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'rosa' });
        cont.appendChild(h.encabezado('D', 'Con todo lo anterior, emita su dictamen de auditor.'));
        var v = h.estado.variante;
        cont.appendChild(h.recuadro('Sus respuestas de las partes B y C', function (r) {
          return v.evidencias.map(function (e, i) {
            var via = r.B['B' + (i + 1)], hallazgo = r.C['C' + (i + 1)];
            var textoVia = !via ? '—' : (via === 'no' ? 'no demuestra trazabilidad' : via);
            var textoHallazgo = hallazgo ? h.textoOpcion(HALLAZGOS, hallazgo).split(' (')[0] : '—';
            return [e.id + ' · ' + e.titulo, (via || hallazgo) ? 'Vía: ' + textoVia + ' · Hallazgo: ' + textoHallazgo : ''];
          });
        }));
        DICTAMEN.forEach(function (d, i) {
          cont.appendChild(h.ejercicio(['medalla', 'lista', 'rayo'][i], d[0], 5, [d[1]], [h.seleccion('D', d[0], 'Su respuesta', d[2], { columnas: 1 })], i + 1));
        });
        panel.appendChild(cont);
      }
    },

    avance: function (r, h) {
      var ordenado = !!r.A.orden;
      var nB = h.llenos('B', ['B1', 'B2', 'B3', 'B4', 'B5', 'B6']), nC = h.llenos('C', ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);
      var nD = h.llenos('D', ['D1', 'D2', 'D3']);
      var faltan = (ordenado ? 0 : 1) + (6 - nB) + (6 - nC) + (3 - nD);
      return {
        fraccion: { A: ordenado ? 1 : 0, B: nB / 6, C: nC / 6, D: nD / 3 },
        sub: { A: ordenado ? 'Ordenada' : 'Sin ordenar', B: nB + ' de 6', C: nC + ' de 6', D: nD + ' de 3' },
        revision: [
          [ordenado, 'cadena', 'Parte A: ' + (ordenado ? 'cadena ordenada' : 'aún no ha movido los eslabones'), ordenado ? 'Revise que el orden sea el definitivo.' : 'La cadena empieza desordenada.'],
          [nB === 6, 'insignia', 'Parte B: ' + nB + ' de 6 vías', nB < 6 ? 'Hay evidencias sin vía.' : 'Completa.'],
          [nC === 6, 'buscar', 'Parte C: ' + nC + ' de 6 hallazgos', nC < 6 ? 'Hay evidencias sin hallazgo elegido (incluido «Sin hallazgo»).' : 'Completa.'],
          [nD === 3, 'medalla', 'Parte D: ' + nD + ' de 3 respuestas', nD < 3 ? 'Complete el dictamen.' : 'Completa.']
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas sin completar.' : ''
      };
    },

    apoyo: function (cont) {
      cont.appendChild(crear('h3', null, [C.icono('cadena'), 'Anexo A.2.1 · Cinco condiciones']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>a)</b> Mensurando especificado.</div><div><b>b)</b> Cadena ininterrumpida y documentada de calibraciones hasta referencias apropiadas.</div>' +
        '<div><b>c)</b> Incertidumbre evaluada en cada paso.</div><div><b>d)</b> Métodos apropiados y registros de cada paso.</div>' +
        '<div><b>e)</b> Competencia demostrada de cada laboratorio de la cadena (p. ej., acreditación).</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('insignia'), 'CEA-3.0-02 · Vías']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>8.1.1</b> INM con el servicio cubierto por el CIPM MRA: verifique la CMC en la KCDB.</div>' +
        '<div><b>8.1.2</b> Laboratorio acreditado (firmante ILAC/IAAC): certificado con marca o referencia a la acreditación y servicio dentro del alcance.</div>' +
        '<div><b>8.1.3</b> INM fuera del CIPM MRA con comparaciones en la KCDB; la nota 7 incluye al INM de Colombia.</div>' +
        '<div><b>8.1.4</b> Laboratorio no acreditado: evidencias del Anexo A. Las vías alternas son el último recurso.</div>' +
        '<div><b>8.2</b> MRC: de un INM (8.2.1), de un PMR acreditado ISO 17034 (8.2.2) o cubierto por el JCTLM (8.2.3). Si el PMR no está acreditado, demuestre su idoneidad y evalúelo como proveedor (6.6).</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('alerta'), 'Hallazgos frecuentes']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div>Certificado sin símbolo de acreditación o servicio fuera del alcance.</div><div>El intervalo calibrado no cubre el intervalo de uso.</div>' +
        '<div>MRC vencidos o de productores sin evidencia de competencia.</div><div>Vías alternas sin la evidencia exigida.</div>' }));
    }
  });
})();
