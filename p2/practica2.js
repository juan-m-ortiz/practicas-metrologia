// Práctica 2 · Error, sesgo y precisión con datos reales — contenido de la práctica.
// Código PÚBLICO: muestra los datos del equipo asignado, calcula media y desviación
// estándar, y recoge las respuestas. La clave y la calificación están en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;
  var NS = 'http://www.w3.org/2000/svg';

  var CLASES = [['vp', 'Veraz y preciso'], ['sp', 'Preciso, pero no veraz'], ['vi', 'Veraz, pero no preciso'], ['si', 'Ni veraz ni preciso']];
  var ACCIONES = [
    ['usar', 'Usarlo sin cambios'],
    ['corregir', 'Corregir los resultados con el sesgo estimado'],
    ['ajustar', 'Ajustarlo y volver a calibrarlo'],
    ['mantenimiento', 'Mantenimiento o reparación y nueva calibración'],
    ['retirar', 'Retirarlo o reclasificarlo para usos menos exigentes']
  ];
  var COLORES = ['#F59E0B', '#8B5CF6', '#0EA5E9', '#EC4899'];
  var ITEMS = { A: ['A1', 'A2', 'A3'], B: ['B1', 'B2', 'B3', 'B4', 'B5'], C: ['C1', 'C2', 'C3'] };
  var OPC_A2 = [['si', 'Sí: E/x_ref × 100 en °C'], ['kelvin', 'Sí, pero siempre en kelvin'], ['escala', 'No: depende del cero de la escala']];
  var OPC_A3 = [['cv', 'Con el coeficiente de variación (%)'], ['s', 'Con la desviación estándar s en °C'], ['rango', 'Con el valor máximo medido']];
  var SI_NO = [['si', 'Sí cumple'], ['no', 'No cumple']];

  function num(t) { return Number(String(t).replace(/[\s ]/g, '').replace('−', '-').replace(',', '.')); }
  function fmt(v, dec) {
    var t = Math.abs(v).toFixed(dec).replace('.', ',');
    return (v < 0 && Number(t.replace(',', '.')) !== 0 ? '−' : '') + t;
  }
  function svg(tag, attrs, hijos) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (hijos || []).forEach(function (h) { n.appendChild(h); });
    return n;
  }

  /** Filas del recuadro «Sus resultados de la parte A». */
  function filasA(h, v, r) {
    var st = estadisticos(v), u = v.unidadE;
    var f = [['Media x̄ (calculadora)', fmt(st.media, v.dec + 2) + ' ' + v.unidad], ['Desviación estándar s', fmt(st.s, v.dec + 2) + ' ' + v.unidad],
      ['A1 · Error absoluto E', r.A.A1 ? r.A.A1 + ' ' + u : '']];
    if (v.conceptual) {
      f.push(['A2 · Error relativo en °C', h.textoOpcion(OPC_A2, r.A.A2)], ['A3 · Precisión', h.textoOpcion(OPC_A3, r.A.A3)]);
    } else {
      f.push(['A2 · Error relativo E%', r.A.A2 ? r.A.A2 + ' %' : ''], ['A3 · Coeficiente de variación', r.A.A3 ? r.A.A3 + ' %' : '']);
    }
    return f;
  }

  function estadisticos(v) {
    var x = v.datos.map(num);
    var n = x.length, media = x.reduce(function (a, b) { return a + b; }, 0) / n;
    var s = Math.sqrt(x.reduce(function (a, b) { return a + (b - media) * (b - media); }, 0) / (n - 1));
    return { x: x, n: n, media: media, s: s };
  }

  /** Gráfico de puntos: valores medidos, valor de referencia y (si se calculó) la media. */
  function graficoDatos(v, mostrarMedia) {
    var st = estadisticos(v), ref = num(v.ref);
    var min = Math.min.apply(null, st.x.concat([ref])), max = Math.max.apply(null, st.x.concat([ref]));
    var margen = (max - min) * 0.25 || Math.pow(10, -v.dec) * 5;
    min -= margen; max += margen;
    var W = 620, H = 230, L = 64, R = 18, T = 16, B = 34;
    function X(i) { return L + (i + 0.5) * (W - L - R) / st.n; }
    function Y(val) { return T + (max - val) / (max - min) * (H - T - B); }
    var g = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Gráfico de las diez mediciones frente al valor de referencia' });
    [0, 0.5, 1].forEach(function (k) {
      var val = min + (max - min) * k;
      g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(val), y2: Y(val), style: 'stroke:var(--borde)', 'stroke-width': 1 }));
      var t = svg('text', { x: L - 8, y: Y(val) + 4, 'text-anchor': 'end' }); t.textContent = fmt(val, v.dec); g.appendChild(t);
    });
    g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(ref), y2: Y(ref), stroke: '#10B981', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
    var tr = svg('text', { x: W - R, y: Y(ref) - 6, 'text-anchor': 'end', style: 'fill:#10B981;font-weight:700' }); tr.textContent = 'referencia'; g.appendChild(tr);
    if (mostrarMedia) {
      g.appendChild(svg('line', { x1: L, x2: W - R, y1: Y(st.media), y2: Y(st.media), stroke: '#8B5CF6', 'stroke-width': 2 }));
      var tm = svg('text', { x: L + 6, y: Y(st.media) - 6, style: 'fill:#8B5CF6;font-weight:700' }); tm.textContent = 'media'; g.appendChild(tm);
    }
    st.x.forEach(function (val, i) {
      g.appendChild(svg('circle', { cx: X(i), cy: Y(val), r: 6, fill: '#F59E0B', stroke: 'white', 'stroke-width': 2 }, [
        (function () { var t = svg('title'); t.textContent = 'Medición ' + (i + 1) + ': ' + v.datos[i] + ' ' + v.unidad; return t; })()]));
      var tx = svg('text', { x: X(i), y: H - 12, 'text-anchor': 'middle' }); tx.textContent = String(i + 1); g.appendChild(tx);
    });
    return g;
  }

  /** Diana con los seis impactos de un conjunto. */
  function diana(conjunto, color) {
    var g = svg('svg', { viewBox: '-1.1 -1.1 2.2 2.2', class: 'diana', role: 'img', 'aria-label': 'Diana del conjunto ' + conjunto.id });
    [1, 0.75, 0.5, 0.25].forEach(function (r, i) {
      g.appendChild(svg('circle', { cx: 0, cy: 0, r: r, style: 'fill:' + (i % 2 ? 'var(--superficie)' : 'var(--superficie-2)') + ';stroke:var(--superficie-3)', 'stroke-width': 0.012 }));
    });
    g.appendChild(svg('circle', { cx: 0, cy: 0, r: 0.07, fill: '#F43F5E' }));
    g.appendChild(svg('line', { x1: -1, x2: 1, y1: 0, y2: 0, style: 'stroke:var(--superficie-3)', 'stroke-width': 0.008 }));
    g.appendChild(svg('line', { y1: -1, y2: 1, x1: 0, x2: 0, style: 'stroke:var(--superficie-3)', 'stroke-width': 0.008 }));
    conjunto.puntos.forEach(function (p, i) {
      var c = svg('circle', { cx: p[0], cy: -p[1], r: 0.065, fill: color, stroke: 'white', 'stroke-width': 0.02, class: 'impacto', style: 'animation-delay:' + (i * 80) + 'ms' });
      g.appendChild(c);
    });
    return g;
  }

  var calculado = false;

  window.Motor.iniciar({
    id: 'P2',
    titulo: 'Error, sesgo y precisión con datos reales',
    icono: 'mira',
    etiqueta: 'Sesión 1 · Práctica 2',
    descripcion: 'Con los datos de verificación de un equipo del laboratorio, calcule el error, distinga veracidad de precisión y decida frente al error máximo permitido.',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · nota de 0,0 a 5,0'], ['libro', 'VIM 2.13 a 2.19 · ISO 8655']],
    notaRegistro: 'Se le asignará un equipo con datos propios, calculados a partir de su correo.',
    comoFunciona: [
      'Revise la ficha de su equipo y sus diez datos de verificación. La calculadora de la página obtiene la media y la desviación estándar.',
      'Calcule el error absoluto, el error relativo y el coeficiente de variación.',
      'Clasifique cuatro conjuntos de una diana y su propio equipo: ¿veraz?, ¿preciso?',
      'Decida frente al EMP, elija la acción y escriba su conclusión. Revise y envíe.'
    ],
    partes: [
      { id: 'A', titulo: 'Error', nombre: 'A · Error y dispersión', icono: 'regla', tono: 'ambar', pts: 30,
        resumen: 'Error absoluto, error relativo y coeficiente de variación de su equipo.' },
      { id: 'B', titulo: 'Diana', nombre: 'B · Veracidad y precisión', icono: 'diana', tono: 'violeta', pts: 25,
        resumen: 'Clasifique cuatro conjuntos de impactos y su propio equipo.' },
      { id: 'C', titulo: 'Decisión', nombre: 'C · Decisión frente al EMP', icono: 'insignia', tono: 'cielo', pts: 30,
        resumen: '¿Cumple el error sistemático y el aleatorio? ¿Qué acción toma?' },
      { id: 'D', titulo: 'Conclusión', nombre: 'D · Conclusión', icono: 'mensaje', tono: 'rosa', pts: 15, docente: true,
        resumen: 'Interpretación, decisión y acción en máximo cinco líneas.' }
    ],
    varianteDemo: {
      equipo: 'micropipeta', nombre: 'Micropipeta de 100 µL', icono: 'vaso', unidad: 'µL', unidadE: 'µL', dec: 2,
      metodo: 'Verificación gravimétrica (ISO 8655-6): diez volúmenes dispensados, calculados a partir de pesadas.',
      referencia: 'Volumen nominal: 100,00 µL', ref: '100,00', empTexto: 'Error sistemático ±0,8 µL · error aleatorio (s) ≤ 0,3 µL',
      fuenteEmp: 'ISO 8655-2, valores de referencia para 100 µL usados en el curso', conceptual: false, decA2: 2, decA3: 2,
      datos: ['99,12', '98,71', '99,40', '98,93', '99,02', '99,18', '98,86', '99,25', '98,97', '99,08'],
      diana: [
        { id: 1, puntos: [[0.02, 0.05], [-0.04, 0.01], [0.06, -0.03], [0.0, -0.06], [-0.05, 0.04], [0.03, 0.02]] },
        { id: 2, puntos: [[0.5, 0.42], [0.55, 0.38], [0.46, 0.47], [0.52, 0.5], [0.58, 0.43], [0.49, 0.36]] },
        { id: 3, puntos: [[0.3, -0.2], [-0.25, 0.28], [0.1, 0.35], [-0.32, -0.15], [0.22, 0.05], [-0.05, -0.33]] },
        { id: 4, puntos: [[-0.55, -0.1], [-0.2, -0.6], [-0.75, -0.45], [-0.4, -0.2], [-0.62, -0.7], [-0.3, -0.42]] }
      ]
    },
    respuestasVacias: function () { return { A: {}, B: {}, C: {}, D: { conclusion: '' } }; },

    pintar: {
      A: function (panel, h) {
        var v = h.estado.variante;
        var st = estadisticos(v);
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'ambar' });
        cont.appendChild(h.encabezado('A', 'Su equipo y sus datos son únicos. Use coma decimal.'));

        // Ficha del equipo
        cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:1' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile' }, [C.icono(v.icono)]),
            crear('div', null, [crear('h3', { texto: v.nombre }), crear('span', { clase: 'suave peq', texto: v.metodo })])]),
          crear('div', { clase: 'ficha-equipo' }, [
            crear('div', null, [crear('small', { texto: 'Referencia' }), crear('b', { texto: v.referencia.split(': ')[1] })]),
            crear('div', null, [crear('small', { texto: 'Error máximo permitido' }), crear('b', { texto: v.empTexto })]),
            crear('div', null, [crear('small', { texto: 'Fuente del criterio' }), crear('span', { texto: v.fuenteEmp })])
          ])
        ]));

        // Datos y gráfico
        var tabla = crear('table', { clase: 'tabla-datos' });
        tabla.appendChild(crear('thead', null, [crear('tr', null, [crear('th', { texto: 'Medición' }), crear('th', { texto: 'Valor (' + v.unidad + ')' })])]));
        var tb = crear('tbody');
        v.datos.forEach(function (d, i) { tb.appendChild(crear('tr', null, [crear('td', { texto: String(i + 1) }), crear('td', { clase: 'n', texto: d })])); });
        tabla.appendChild(tb);
        var lienzo = crear('div', { clase: 'lienzo-grafico' });
        lienzo.appendChild(graficoDatos(v, calculado));
        cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:2' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('lista')]), crear('h3', { texto: 'Datos de verificación' })]),
          crear('div', { clase: 'datos-grafico' }, [crear('div', { clase: 'tabla-scroll' }, [tabla]), lienzo])
        ]));

        // Calculadora
        var salida = crear('div', { clase: 'calc-salida' + (calculado ? ' visible' : '') }, [
          crear('div', { 'data-tip': 'Número de mediciones' }, [crear('small', { texto: 'n' }), crear('b', { texto: String(st.n) })]),
          crear('div', { 'data-tip': 'x̄ = Σxᵢ / n' }, [crear('small', { texto: 'Media x̄' }), crear('b', { texto: fmt(st.media, v.dec + 2) + ' ' + v.unidad })]),
          crear('div', { 'data-tip': 's = √[Σ(xᵢ − x̄)² / (n − 1)]' }, [crear('small', { texto: 'Desviación estándar s' }), crear('b', { texto: fmt(st.s, v.dec + 2) + ' ' + v.unidad })])
        ]);
        var boton = crear('button', { type: 'button', clase: 'btn btn-primario' }, [C.icono('rayo'), calculado ? 'Calcular de nuevo' : 'Calcular estadísticos']);
        boton.addEventListener('click', function () {
          calculado = true;
          salida.classList.remove('visible'); void salida.offsetWidth; salida.classList.add('visible');
          lienzo.textContent = '';
          lienzo.appendChild(graficoDatos(v, true));
          C.toast('Media y desviación estándar calculadas', 'exito', 'rayo');
        });
        cont.appendChild(crear('div', { clase: 'tarjeta calculadora aparecer', style: '--i:3' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('teclado')]),
            crear('div', null, [crear('h3', { texto: 'Calculadora estadística' }), crear('span', { clase: 'suave peq', texto: 'Media aritmética y desviación estándar muestral (n − 1) de sus diez datos.' })])]),
          boton, salida
        ]));

        // Preguntas
        var uE = v.unidadE;
        var preguntas = [h.respuesta('A', 'A1', 'A1 · Error absoluto E = x̄ − x_ref, redondeado a 0,01 ' + uE + (uE === 'mg' ? ' (1 g = 1000 mg)' : ''), uE, { placeholder: 'Con su signo' })];
        if (v.conceptual) {
          preguntas.push(h.seleccion('A', 'A2', 'A2 · ¿Conviene expresar el error relativo (%) de un termómetro en °C?', OPC_A2, { columnas: 3 }));
          preguntas.push(h.seleccion('A', 'A3', 'A3 · ¿Cómo se expresa mejor la precisión de este termómetro?', OPC_A3, { columnas: 3 }));
        } else {
          var p2 = v.decA2 === 3 ? '0,001' : '0,01';
          preguntas.push(h.respuesta('A', 'A2', 'A2 · Error relativo E% = E / x_ref × 100, redondeado a ' + p2 + ' %', '%', { placeholder: 'Con su signo' }));
          preguntas.push(h.respuesta('A', 'A3', 'A3 · Coeficiente de variación CV = s / x̄ × 100, redondeado a ' + (v.decA3 === 3 ? '0,001' : '0,01') + ' %', '%'));
        }
        cont.appendChild(h.ejercicio('regla', 'Sus cálculos', 30, ['Use la media y la desviación estándar de la calculadora. Se acepta una diferencia de ±1 en el último dígito pedido.'], preguntas, 4));
        panel.appendChild(cont);
      },

      B: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('B', 'Cada diana muestra seis impactos. El centro rojo es el valor de referencia.'));
        var rejilla = crear('div', { clase: 'rejilla-dianas' });
        v.diana.forEach(function (d, i) {
          rejilla.appendChild(crear('div', { clase: 'tarjeta tarjeta-diana aparecer', style: '--i:' + (i + 1) }, [
            crear('div', { clase: 'diana-cab' }, [crear('span', { clase: 'punto-color', style: 'background:' + COLORES[i] }), crear('b', { texto: 'Conjunto ' + d.id }), crear('span', { clase: 'pts', texto: '5 pts' })]),
            diana(d, COLORES[i]),
            h.seleccion('B', 'B' + d.id, '¿Cómo es este conjunto?', CLASES, { columnas: 2 })
          ]));
        });
        cont.appendChild(rejilla);
        cont.appendChild(h.ejercicio('mira', 'B5 · Su equipo', 5, ['Con sus resultados de la parte A y los EMP de la ficha (' + v.empTexto + '), ¿cómo clasifica su ', crear('b', { texto: v.nombre.toLowerCase() }), '?'],
          [h.recuadro('Sus resultados de la parte A', function (r) { return filasA(h, v, r); }), h.seleccion('B', 'B5', 'Su equipo es…', CLASES, { columnas: 2 })], 5));
        panel.appendChild(cont);
      },

      C: function (panel, h) {
        var v = h.estado.variante;
        var partes = v.empTexto.split(' · ');
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'cielo' });
        cont.appendChild(h.encabezado('C', 'Compare sus resultados con el error máximo permitido (EMP) de la ficha.'));
        cont.appendChild(h.recuadro('Sus resultados de la parte A', function (r) { return filasA(h, v, r); }));
        cont.appendChild(h.ejercicio('regla', 'C1 · Error sistemático', 10, ['Criterio: ', h.dato(partes[0]), '. ¿Su equipo cumple?'],
          [h.seleccion('C', 'C1', '¿Cumple el error sistemático?', SI_NO, { columnas: 2 })], 1));
        cont.appendChild(h.ejercicio('actividad', 'C2 · Error aleatorio', 10, ['Criterio: ', h.dato(partes[1]), '. ¿Su equipo cumple?'],
          [h.seleccion('C', 'C2', '¿Cumple el error aleatorio?', SI_NO, { columnas: 2 })], 2));
        cont.appendChild(h.ejercicio('insignia', 'C3 · Acción', 10, ['Según sus respuestas, ¿qué hace con el equipo? Elija la acción principal.'],
          [h.seleccion('C', 'C3', 'Acción', ACCIONES, { columnas: 1 })], 3));
        panel.appendChild(cont);
      },

      D: function (panel, h) {
        var v = h.estado.variante;
        panel.appendChild(crear('div', { clase: 'tarjeta', 'data-tono': 'rosa' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile' }, [C.icono('mensaje')]),
            crear('div', null, [crear('h2', { texto: 'Parte D · Conclusión' }), crear('span', { clase: 'suave peq', texto: 'La califica el docente' })]),
            crear('span', { clase: 'pts', texto: '15 pts' })]),
          h.recuadro('Sus respuestas anteriores', function (r) {
            return filasA(h, v, r).concat([['B5 · Su equipo es', h.textoOpcion(CLASES, r.B.B5)], ['C1 · Error sistemático', h.textoOpcion(SI_NO, r.C.C1)],
              ['C2 · Error aleatorio', h.textoOpcion(SI_NO, r.C.C2)], ['C3 · Acción', h.textoOpcion(ACCIONES, r.C.C3)]]);
          }),
          h.texto('D', 'conclusion', 'En máximo cinco líneas: ¿su equipo es veraz?, ¿es preciso?, ¿qué decide y por qué? Si no cumple, ¿qué haría con los resultados que ya se emitieron con él?',
            { max: 900, minimo: 200, alto: 160, placeholder: 'Mi equipo…' })
        ]));
      }
    },

    avance: function (r, h) {
      var nA = h.llenos('A', ITEMS.A), nB = h.llenos('B', ITEMS.B), nC = h.llenos('C', ITEMS.C);
      var nD = (r.D.conclusion || '').trim().length;
      var faltan = (3 - nA) + (5 - nB) + (3 - nC);
      return {
        fraccion: { A: nA / 3, B: nB / 5, C: nC / 3, D: Math.min(1, nD / 200) },
        sub: { A: nA + ' de 3', B: nB + ' de 5', C: nC + ' de 3', D: nD + ' caracteres' },
        revision: [
          [nA === 3, 'regla', 'Parte A: ' + nA + ' de 3 respuestas', nA < 3 ? 'Hay respuestas vacías.' : 'Completa.'],
          [nB === 5, 'diana', 'Parte B: ' + nB + ' de 5 clasificaciones', nB < 5 ? 'Clasifique las cuatro dianas y su equipo.' : 'Completa.'],
          [nC === 3, 'insignia', 'Parte C: ' + nC + ' de 3 decisiones', nC < 3 ? 'Hay decisiones sin responder.' : 'Completa.'],
          [nD >= 200, 'mensaje', 'Parte D: ' + nD + ' caracteres', nD < 200 ? 'Desarrolle su conclusión (al menos 200 caracteres).' : 'Completa.']
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas sin completar en las partes A a C.' : ''
      };
    },

    apoyo: function (cont) {
      cont.appendChild(crear('h3', null, [C.icono('regla'), 'Definiciones (VIM)']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>Error (2.16).</b> E = x − x<sub>ref</sub>. Tiene signo. Relativo: E/x<sub>ref</sub> × 100; no se usa en temperatura porque depende del cero de la escala.</div>' +
        '<div><b>Sesgo (2.18).</b> Valor estimado del error sistemático: la media menos la referencia. Se puede corregir.</div>' +
        '<div><b>Error aleatorio (2.19).</b> Varía de forma impredecible; se reduce promediando. Se describe con s.</div>' +
        '<div><b>Veracidad (2.14).</b> Cercanía de la media a la referencia. Opuesta al sesgo.</div>' +
        '<div><b>Precisión (2.15).</b> Cercanía entre mediciones repetidas. Se expresa con s, s² o CV.</div>' +
        '<div><b>Exactitud (2.13).</b> Veracidad + precisión. No se expresa con un número.</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('teclado'), 'Fórmulas']));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>Media</td><td>x̄ = Σxᵢ / n</td></tr><tr><td>Desviación estándar</td><td>s = √[Σ(xᵢ − x̄)² / (n − 1)]</td></tr>' +
        '<tr><td>Coeficiente de variación</td><td>CV = s / x̄ × 100</td></tr><tr><td>Error absoluto</td><td>E = x̄ − x<sub>ref</sub></td></tr>' +
        '<tr><td>Error relativo</td><td>E% = E / x<sub>ref</sub> × 100</td></tr>' }));
      cont.appendChild(crear('h3', null, [C.icono('insignia'), 'Acciones (ISO/IEC 17025)']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>Sesgo con buena precisión:</b> corregir con el error estimado o ajustar y recalibrar.</div>' +
        '<div><b>Dispersión excesiva:</b> no se corrige con un número; mantenimiento, reparación o retiro.</div>' +
        '<div><b>Si no cumple:</b> evaluar los resultados emitidos desde la última verificación conforme (6.4.9 y 7.10).</div>' }));
    }
  });
})();
