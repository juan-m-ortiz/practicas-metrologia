// Práctica 5 · Intervalos con el método escalera y el algoritmo de Bare — contenido.
// Código PÚBLICO: historiales «as found» de cinco equipos y formularios.
// La clave y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;
  var NS = 'http://www.w3.org/2000/svg';
  var ESTADOS = [['A', 'A'], ['B', 'B'], ['C', 'C'], ['D', 'D'], ['E', 'E']];
  var TIPS = { A: 'A · dentro de la banda (≤ 0,8·EMP)', B: 'B · fuera de la banda, dentro del EMP', C: 'C · entre 1 y 2 veces el EMP', D: 'D · entre 2 y 4 veces el EMP', E: 'E · entre 4 y 6 veces el EMP' };

  var FACTOR = { A: 1.25, B: 0.75, C: 0.5, D: 0.5, E: 0.5 };
  var MULT = { A: 1.0, B: 0.8, C: 0.6, D: 0.4, E: 0.3 };

  function num(t) { return Number(String(t).replace(/[+\s]/g, '').replace('−', '-').replace(',', '.')); }
  function coma(x, d) { return x.toFixed(d).replace('.', ','); }
  function comaCorta(x) { return String(Math.round(x * 100) / 100).replace('.', ','); }

  /** Línea de cálculo guiado: se repinta con cada cambio de respuesta. */
  function guia(h, calcular) {
    var nodo = crear('div', { clase: 'guia-calculo' });
    h.observar(function (r) {
      var res = calcular(r);
      nodo.textContent = '';
      nodo.classList.toggle('pendiente', !!res.pendiente);
      nodo.appendChild(C.icono(res.pendiente ? 'info' : 'rayo'));
      (res.partes || [res.pendiente]).forEach(function (p) { nodo.appendChild(typeof p === 'string' ? document.createTextNode(p) : p); });
    });
    return nodo;
  }

  function svg(tag, attrs, texto) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (texto !== undefined) n.textContent = texto;
    return n;
  }

  /** Barras de |error| por año con la banda de seguridad y el EMP. */
  function grafico(e, anios) {
    var emp = num(e.emp), banda = num(e.banda);
    var vals = e.errores.map(function (x) { return Math.abs(num(x)); });
    var tope = Math.max(emp, Math.max.apply(null, vals)) * 1.18;
    var W = 300, H = 170, L = 8, R = 70, T = 12, B = 26;
    function Y(v) { return T + (1 - v / tope) * (H - T - B); }
    var g = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico', role: 'img', 'aria-label': 'Errores encontrados frente a la banda de seguridad y el EMP' });
    var ancho = (W - L - R) / vals.length;
    vals.forEach(function (v, i) {
      var x = L + i * ancho + ancho * 0.2;
      var r = svg('rect', { x: x, y: Y(v), width: ancho * 0.6, height: Math.max(1, Y(0) - Y(v)), rx: 6, fill: '#EC4899', 'fill-opacity': 0.85, class: 'barra-hist' });
      r.appendChild(svg('title', {}, anios[i] + ': ' + e.errores[i] + ' ' + e.unidad));
      g.appendChild(r);
      g.appendChild(svg('text', { x: x + ancho * 0.3, y: H - 8, 'text-anchor': 'middle' }, anios[i]));
      g.appendChild(svg('text', { x: x + ancho * 0.3, y: Y(v) - 4, 'text-anchor': 'middle', style: 'font-weight:700;fill:var(--texto-2)' }, e.errores[i]));
    });
    g.appendChild(svg('line', { x1: L, x2: W - R + 4, y1: Y(banda), y2: Y(banda), stroke: '#F59E0B', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
    g.appendChild(svg('text', { x: W - R + 8, y: Y(banda) + 4, style: 'fill:#F59E0B;font-weight:700' }, 'banda'));
    [2, 4, 6].forEach(function (m) {
      if (m * emp >= tope) return;
      g.appendChild(svg('line', { x1: L, x2: W - R + 4, y1: Y(m * emp), y2: Y(m * emp), stroke: '#94A3B8', 'stroke-width': 1.5, 'stroke-dasharray': '2 4' }));
      g.appendChild(svg('text', { x: W - R + 8, y: Y(m * emp) + 4, style: 'fill:var(--suave);font-weight:700' }, m + '·EMP'));
    });
    g.appendChild(svg('line', { x1: L, x2: W - R + 4, y1: Y(emp), y2: Y(emp), stroke: '#F43F5E', 'stroke-width': 2 }));
    g.appendChild(svg('text', { x: W - R + 8, y: Y(emp) + 4, style: 'fill:#F43F5E;font-weight:700' }, 'EMP'));
    g.appendChild(svg('line', { x1: L, x2: W - R + 4, y1: Y(0), y2: Y(0), style: 'stroke:var(--borde)' }));
    return g;
  }

  function historial(e, anios) {
    var tabla = crear('table', { clase: 'tabla-datos' });
    tabla.appendChild(crear('thead', null, [crear('tr', null, [crear('th', { texto: 'Calibración' }), crear('th', { texto: 'Error as found (' + e.unidad + ')' })])]));
    var tb = crear('tbody');
    e.errores.forEach(function (x, i) { tb.appendChild(crear('tr', null, [crear('td', { texto: anios[i] }), crear('td', { clase: 'n', texto: x })])); });
    tabla.appendChild(tb);
    return crear('div', { clase: 'historial' }, [
      crear('div', null, [tabla, crear('p', { clase: 'suave peq', style: 'margin:8px 0 0', texto: 'EMP ±' + e.emp + ' ' + e.unidad + ' · banda de seguridad ±' + e.banda + ' ' + e.unidad })]),
      grafico(e, anios)
    ]);
  }

  function cab(e, n) {
    return crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono(e.icono)]), crear('h3', { texto: 'Equipo ' + n + ' · ' + e.nombre })]);
  }

  window.Motor.iniciar({
    id: 'P5',
    titulo: 'Intervalos con el método escalera y el algoritmo de Bare',
    icono: 'calendario',
    etiqueta: 'Sesión 2 · Práctica 5',
    descripcion: 'Con el historial «as found» de cinco equipos, clasifique cada calibración, aplique el método escalera y el algoritmo de Bare, y proponga un intervalo justificado.',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · nota de 0,0 a 5,0'], ['libro', 'OIML D 10 / ILAC G24 · Bare (2006)']],
    notaRegistro: 'Los historiales cambian para cada estudiante.',
    comoFunciona: [
      'Clasifique el estado (A a E) de cada error encontrado frente a la banda de seguridad y al EMP.',
      'Aplique el método escalera paso a paso desde un intervalo inicial de 12 meses.',
      'Aplique el algoritmo de Bare con el intervalo actual de 12 meses.',
      'Proponga el intervalo final de cada equipo y justifíquelo. Revise y envíe.'
    ],
    partes: [
      { id: 'A', titulo: 'Estados', nombre: 'A · Estados del as found', icono: 'lista', tono: 'ambar', pts: 30, resumen: 'Clasifique 15 calibraciones de A a E.' },
      { id: 'B', titulo: 'Escalera', nombre: 'B · Método escalera', icono: 'actividad', tono: 'cielo', pts: 30, resumen: 'Intervalo tras cada calibración, desde 12 meses.' },
      { id: 'C', titulo: 'Bare', nombre: 'C · Algoritmo de Bare', icono: 'rayo', tono: 'violeta', pts: 20, resumen: 'NI = CI · (0,8·X + 0,2·Y + 0,1·Z).' },
      { id: 'D', titulo: 'Decisión', nombre: 'D · Intervalo final', icono: 'calendario', tono: 'rosa', pts: 20, resumen: 'Intervalo por equipo y justificación técnica.' }
    ],
    varianteDemo: { anios: (function () { var y = Number(C.fechaRelativa(-120).slice(0, 4)); return [String(y - 2), String(y - 1), String(y)]; })(), equipos: [
      { clave: 'termometro', nombre: 'Termómetro de incubadora T-01', icono: 'termometro', unidad: '°C', dec: 2, emp: '0,50', banda: '0,40', errores: ['+0,25', '−0,15', '−0,35'] },
      { clave: 'balanza', nombre: 'Balanza analítica B-02', icono: 'medalla', unidad: 'mg', dec: 2, emp: '1,00', banda: '0,80', errores: ['−0,05', '−0,91', '+2,30'] },
      { clave: 'micropipeta', nombre: 'Micropipeta de 100 µL M-07', icono: 'vaso', unidad: 'µL', dec: 2, emp: '0,80', banda: '0,64', errores: ['+0,31', '+0,52', '+0,73'] },
      { clave: 'termohigrometro', nombre: 'Termohigrómetro H-03 (humedad relativa)', icono: 'nube', unidad: '%', dec: 1, emp: '5,0', banda: '4,0', errores: ['+1,2', '−2,0', '+0,8'] },
      { clave: 'manometro', nombre: 'Manómetro del autoclave P-01', icono: 'manometro', unidad: 'kPa', dec: 1, emp: '3,0', banda: '2,4', errores: ['+0,6', '+3,9', '−1,1'] }
    ] },
    respuestasVacias: function () { return { A: {}, B: {}, C: {}, D: { justificacion: '' } }; },

    pintar: {
      A: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'ambar' });
        cont.appendChild(h.encabezado('A', 'A: |e| ≤ banda (0,8·EMP) · B: banda < |e| ≤ EMP · C: hasta 2·EMP · D: hasta 4·EMP · E: hasta 6·EMP.'));
        v.equipos.forEach(function (e, i) {
          var fichas = v.anios.map(function (a, k) {
            return h.seleccion('A', 'A' + (i + 1) + (k + 1), 'Estado en ' + a + ' (error ' + e.errores[k] + ' ' + e.unidad + ')',
              ESTADOS.map(function (s) { return [s[0], s[1], TIPS[s[0]]]; }), {});
          });
          cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:' + (i + 1) }, [cab(e, i + 1), historial(e, v.anios)].concat(fichas)));
        });
        panel.appendChild(cont);
      },
      B: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'cielo' });
        cont.appendChild(h.encabezado('B', 'Reglas: A → ×1,25 · B → ×0,75 · C, D o E → ×0,5. Redondee al mes entero (empates al par) y limite entre 3 y 24 meses. Intervalo inicial: 12 meses. La guía de cada paso usa su estado de la parte A y su intervalo del paso anterior.'));
        v.equipos.forEach(function (e, i) {
          var n = i + 1, filas = [];
          v.anios.forEach(function (a, k) {
            filas.push(guia(h, function (r) {
              var st = r.A['A' + n + (k + 1)];
              if (!st) return { pendiente: 'Asigne en la parte A el estado de ' + a + '.' };
              var previo = k === 0 ? 12 : num(r.B['B' + n + k]);
              if (k > 0 && !(previo > 0)) return { pendiente: 'Escriba primero el intervalo tras la calibración de ' + v.anios[k - 1] + '.' };
              return { partes: ['Estado ' + st + ' (parte A) · ', crear('b', { texto: comaCorta(previo) + ' × ' + comaCorta(FACTOR[st]) + ' = ' + coma(previo * FACTOR[st], 2) }), ' meses sin redondear'] };
            }));
            filas.push(h.respuesta('B', 'B' + n + (k + 1), 'Intervalo tras la calibración de ' + a, 'meses', { placeholder: 'Mes entero' }));
          });
          cont.appendChild(h.ejercicio(e.icono, 'Equipo ' + n + ' · ' + e.nombre, 6,
            ['Errores: ', e.errores.map(function (x, k) { return v.anios[k] + ' ' + x + ' ' + e.unidad; }).join(' · '), ' (EMP ±' + e.emp + ' ' + e.unidad + ').'],
            filas, n));
        });
        panel.appendChild(cont);
      },
      C: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('C', 'NI = 12 · (0,8·X + 0,2·Y + 0,1·Z). X: última (' + v.anios[2] + '), Y: penúltima (' + v.anios[1] + '), Z: antepenúltima (' + v.anios[0] + '). Multiplicadores: A 1,0 · B 0,8 · C 0,6 · D 0,4 · E 0,3. La calculadora usa los estados que usted asignó en la parte A; usted redondea al mes entero (empates al par) y limita entre 3 y 24 meses.'));
        v.equipos.forEach(function (e, i) {
          var n = i + 1;
          var calc = guia(h, function (r) {
            var st = [1, 2, 3].map(function (k) { return r.A['A' + n + k]; });
            var faltan = v.anios.filter(function (a, k) { return !st[k]; });
            if (faltan.length) return { pendiente: 'Asigne en la parte A el estado de ' + faltan.join(', ') + '.' };
            var ni = 12 * (0.8 * MULT[st[2]] + 0.2 * MULT[st[1]] + 0.1 * MULT[st[0]]);
            return { partes: ['X = ' + st[2] + ' → ' + coma(MULT[st[2]], 1) + ' · Y = ' + st[1] + ' → ' + coma(MULT[st[1]], 1) + ' · Z = ' + st[0] + ' → ' + coma(MULT[st[0]], 1) + ' · ',
              crear('b', { texto: 'NI = 12 · (0,8·' + coma(MULT[st[2]], 1) + ' + 0,2·' + coma(MULT[st[1]], 1) + ' + 0,1·' + coma(MULT[st[0]], 1) + ') = ' + coma(ni, 2) }), ' meses sin redondear'] };
          });
          cont.appendChild(h.ejercicio('rayo', 'Equipo ' + n + ' · ' + e.nombre, 4, null,
            [calc, h.respuesta('C', 'C' + n, 'Nuevo intervalo (Bare)', 'meses', { placeholder: 'Mes entero' })], n));
        });
        panel.appendChild(cont);
      },
      D: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'rosa' });
        cont.appendChild(h.encabezado('D', 'Proponga el intervalo final de cada equipo, entre lo que indican ambos métodos. La justificación la califica el docente.'));
        cont.appendChild(h.recuadro('Sus resultados de las partes B y C', function (r) {
          return v.equipos.map(function (e, i) {
            var esc = r.B['B' + (i + 1) + '3'], bare = r.C['C' + (i + 1)];
            return ['Equipo ' + (i + 1) + ' · ' + e.nombre, (esc || bare) ? 'escalera ' + (esc || '—') + ' meses · Bare ' + (bare || '—') + ' meses' : ''];
          });
        }));
        cont.appendChild(h.ejercicio('calendario', 'Intervalos finales', 10, ['Se acepta cualquier valor entre su resultado de la escalera y su resultado de Bare.'],
          v.equipos.map(function (e, i) { return h.respuesta('D', 'D' + (i + 1), 'Equipo ' + (i + 1) + ' · ' + e.nombre, 'meses', { placeholder: 'Mes entero' }); }), 1));
        cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:2' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('mensaje')]), crear('h3', { texto: 'D6 · Justificación técnica' }), crear('span', { clase: 'pts', style: 'margin-left:auto', texto: '10 pts' })]),
          h.texto('D', 'justificacion', '¿Qué método es más adecuado para cada tipo de equipo y por qué? Considere el riesgo, el uso y el historial; mencione mínimos y máximos, la revisión técnica y qué hacer con los equipos que se encontraron fuera del EMP.',
            { max: 1200, minimo: 250, placeholder: 'Para el termómetro…' })
        ]));
        panel.appendChild(cont);
      }
    },

    avance: function (r, h) {
      var idsA = [], idsB = [], idsC = [], idsD = [];
      for (var i = 1; i <= 5; i++) { for (var k = 1; k <= 3; k++) { idsA.push('A' + i + k); idsB.push('B' + i + k); } idsC.push('C' + i); idsD.push('D' + i); }
      var nA = h.llenos('A', idsA), nB = h.llenos('B', idsB), nC = h.llenos('C', idsC), nD = h.llenos('D', idsD);
      var nJ = (r.D.justificacion || '').trim().length;
      var faltan = (15 - nA) + (15 - nB) + (5 - nC) + (5 - nD);
      return {
        fraccion: { A: nA / 15, B: nB / 15, C: nC / 5, D: (nD / 5) * 0.5 + Math.min(1, nJ / 250) * 0.5 },
        sub: { A: nA + ' de 15', B: nB + ' de 15', C: nC + ' de 5', D: nD + ' de 5 · ' + nJ + ' caracteres' },
        revision: [
          [nA === 15, 'lista', 'Parte A: ' + nA + ' de 15 estados', nA < 15 ? 'Hay calibraciones sin estado.' : 'Completa.'],
          [nB === 15, 'actividad', 'Parte B: ' + nB + ' de 15 intervalos', nB < 15 ? 'Hay pasos de la escalera vacíos.' : 'Completa.'],
          [nC === 5, 'rayo', 'Parte C: ' + nC + ' de 5 intervalos de Bare', nC < 5 ? 'Hay equipos sin Bare.' : 'Completa.'],
          [nD === 5 && nJ >= 250, 'calendario', 'Parte D: ' + nD + ' de 5 intervalos · ' + nJ + ' caracteres', nJ < 250 ? 'Desarrolle la justificación (al menos 250 caracteres).' : (nD < 5 ? 'Faltan intervalos finales.' : 'Completa.')]
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas sin completar.' : ''
      };
    },

    apoyo: function (cont) {
      cont.appendChild(crear('h3', null, [C.icono('actividad'), 'Método escalera (OIML D 10, 6.2)']));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>A · dentro de la banda</td><td>× 1,25</td></tr><tr><td>B · entre banda y EMP</td><td>× 0,75</td></tr>' +
        '<tr><td>C, D o E · fuera del EMP</td><td>× 0,5 y evaluar el impacto (7.10)</td></tr><tr><td>Límites</td><td>3 a 24 meses</td></tr>' }));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html: '<div>Las partes B, C y D se califican con los estados que usted asignó en la parte A: un error de clasificación se descuenta una sola vez.</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('rayo'), 'Algoritmo de Bare (2006)']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html: '<div>NI = CI · (W₁·X + W₂·Y + W₃·Z) con W₁ = 0,8 (última), W₂ = 0,2 (penúltima), W₃ = 0,1 (antepenúltima). Suman 1,1: un historial impecable amplía el intervalo un 10 %.</div>' }));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>A · dentro de la banda</td><td>1,0</td></tr><tr><td>B · fuera de la banda, dentro del EMP</td><td>0,8</td></tr>' +
        '<tr><td>C · 1× a 2× EMP</td><td>0,6</td></tr><tr><td>D · 2× a 4× EMP</td><td>0,4</td></tr><tr><td>E · 4× a 6× EMP</td><td>0,3</td></tr>' }));
      cont.appendChild(crear('h3', null, [C.icono('calendario'), 'Ejemplo (diapositiva 55)']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html: '<div>T-02: A (antepenúltima), B (penúltima), D (última). NI = 12 · (0,8·0,4 + 0,2·0,8 + 0,1·1,0) = 6,96 ≈ 7 meses.</div>' +
        '<div>Redondeo al mes entero; en empates, al par (regla A de ISO 80000-1): 3,5 → 4 y 6,5 → 6.</div>' }));
    }
  });
})();
