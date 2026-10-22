// Práctica 6 · Carta de control de una balanza — contenido de la práctica.
// Código PÚBLICO: datos de la comprobación intermedia, calculadora y carta interactiva.
// La clave y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;
  var NS = 'http://www.w3.org/2000/svg';
  var N0 = 20;

  var REGLAS = [
    ['1', 'Regla 1 · un punto más allá de 3s'],
    ['2', 'Regla 2 · nueve puntos seguidos del mismo lado de la media'],
    ['3', 'Regla 3 · seis puntos seguidos que aumentan o disminuyen']
  ];
  var CAUSAS = [
    ['operador', 'Mano de obra: error puntual de operación (pesa mal colocada, puerta abierta)'],
    ['maquina', 'Máquina: deriva, desgaste, nivelación o ajuste interno de la balanza'],
    ['material', 'Material: cambio, golpe o contaminación de la pesa de control'],
    ['ambiente', 'Medio ambiente: corrientes de aire, vibración o temperatura que cambia'],
    ['metodo', 'Método: el procedimiento de la comprobación no está definido'],
    ['medicion', 'Medición: error al leer o registrar el dato']
  ];
  var ACCION = [
    ['repetir', 'Repetir la comprobación hasta que salga bien'],
    ['detener', 'Detener el uso para resultados que se informen, repetir registrando todo e investigar la causa'],
    ['ignorar', 'Ignorarla si el siguiente punto vuelve a estar dentro de los límites'],
    ['recalcular', 'Recalcular los límites incluyendo los puntos nuevos']
  ];
  var FRECUENCIA = [
    ['aumentar', 'Aumentar la frecuencia (reducir el intervalo) hasta confirmar que el equipo está en control'],
    ['mantener', 'Mantener la frecuencia actual'],
    ['ampliar', 'Ampliar el intervalo porque la balanza es capaz']
  ];

  function num(t) { return Number(String(t).replace('+', '').replace('−', '-').replace(',', '.')); }
  function fmt(v, dec) {
    var t = Math.abs(v).toFixed(dec).replace('.', ',');
    return (v < 0 && Number(t.replace(',', '.')) !== 0 ? '−' : (v > 0 ? '+' : '')) + t;
  }
  function svg(tag, attrs, texto) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  function est(v) {
    var x = v.iniciales.map(num), n = x.length;
    var m = x.reduce(function (a, b) { return a + b; }, 0) / n;
    var s = Math.sqrt(x.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (n - 1));
    return { n: n, media: m, s: s };
  }

  function leerMarcas(h) {
    var t = h.estado.respuestas.B.marcas || '';
    var mapa = {};
    t.split(',').forEach(function (x) { var p = x.split(':'); if (p[0] && p[1]) mapa[p[0]] = p[1]; });
    return mapa;
  }
  function guardarMarcas(h, mapa) {
    h.estado.respuestas.B.marcas = Object.keys(mapa).sort(function (a, b) { return a - b; }).map(function (k) { return k + ':' + mapa[k]; }).join(',');
    h.guardar();
    h.actualizar();
  }

  // ---------------------------------------------------------------------------
  // Carta de control
  // ---------------------------------------------------------------------------

  function carta(v, h, alClic) {
    var st = est(v), marcas = leerMarcas(h);
    var todos = v.iniciales.concat(v.nuevos).map(num);
    var lim = [st.media - 3.6 * st.s, st.media + 3.6 * st.s];
    todos.forEach(function (x) { lim[0] = Math.min(lim[0], x); lim[1] = Math.max(lim[1], x); });
    var margen = (lim[1] - lim[0]) * 0.06;
    lim[0] -= margen; lim[1] += margen;
    var W = 980, H = 380, L = 64, R = 70, T = 20, B = 36;
    function X(i) { return L + (i + 0.5) * (W - L - R) / todos.length; }
    function Y(val) { return T + (lim[1] - val) / (lim[1] - lim[0]) * (H - T - B); }
    var g = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'grafico carta', role: 'img', 'aria-label': 'Carta de control de la pesa de 100 g' });
    // Zonas
    g.appendChild(svg('rect', { x: L, y: Y(st.media + 3 * st.s), width: W - L - R, height: Y(st.media - 3 * st.s) - Y(st.media + 3 * st.s), style: 'fill:var(--superficie-2)' }));
    g.appendChild(svg('rect', { x: L, y: Y(st.media + 2 * st.s), width: W - L - R, height: Y(st.media - 2 * st.s) - Y(st.media + 2 * st.s), style: 'fill:color-mix(in srgb, #10B981 7%, var(--superficie))' }));
    g.appendChild(svg('rect', { x: L, y: T, width: X(N0 - 0.5) - L, height: H - T - B, style: 'fill:color-mix(in srgb, #64748B 8%, transparent)' }));
    g.appendChild(svg('text', { x: (L + X(N0 - 0.5)) / 2, y: T + 14, 'text-anchor': 'middle', style: 'font-weight:700' }, 'Periodo base (20 datos)'));
    g.appendChild(svg('text', { x: (X(N0 - 0.5) + W - R) / 2, y: T + 14, 'text-anchor': 'middle', style: 'font-weight:700' }, 'Datos nuevos: haga clic en un punto para marcar una señal'));
    [[3, '#F43F5E', 'LCS'], [2, '#F59E0B', 'LAS'], [0, '#10B981', 'media'], [-2, '#F59E0B', 'LAI'], [-3, '#F43F5E', 'LCI']].forEach(function (l) {
      var y = Y(st.media + l[0] * st.s);
      g.appendChild(svg('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: l[1], 'stroke-width': l[0] === 0 ? 2 : 1.6, 'stroke-dasharray': Math.abs(l[0]) === 2 ? '6 5' : '' }));
      g.appendChild(svg('text', { x: W - R + 6, y: y + 4, style: 'fill:' + l[1] + ';font-weight:700' }, l[2]));
    });
    [lim[0], (lim[0] + lim[1]) / 2, lim[1]].forEach(function (val) {
      g.appendChild(svg('text', { x: L - 8, y: Y(val) + 4, 'text-anchor': 'end' }, fmt(val, 2)));
    });
    g.appendChild(svg('text', { x: 14, y: (T + H - B) / 2, transform: 'rotate(-90 14 ' + ((T + H - B) / 2) + ')', 'text-anchor': 'middle' }, 'Diferencia (mg)'));
    // Línea que une los puntos
    var d = todos.map(function (x, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(x); }).join(' ');
    g.appendChild(svg('path', { d: d, fill: 'none', style: 'stroke:var(--superficie-3)', 'stroke-width': 1.5 }));
    todos.forEach(function (x, i) {
      var numero = i + 1, nuevo = i >= N0, marca = marcas[String(numero)];
      var grupo = svg('g', { class: 'punto-carta' + (nuevo ? ' nuevo' : '') + (marca ? ' marcado' : ''), 'data-n': numero, tabindex: nuevo ? 0 : -1, role: nuevo ? 'button' : 'img',
        'aria-label': 'Punto ' + numero + ': ' + (nuevo ? v.nuevos[i - N0] : v.iniciales[i]) + ' mg' + (marca ? ', marcado con la regla ' + marca : '') });
      grupo.appendChild(svg('title', {}, 'Punto ' + numero + ': ' + (nuevo ? v.nuevos[i - N0] : v.iniciales[i]) + ' mg'));
      if (nuevo) grupo.appendChild(svg('circle', { cx: X(i), cy: Y(x), r: 14, fill: 'transparent', class: 'zona-clic' }));
      if (marca) grupo.appendChild(svg('circle', { cx: X(i), cy: Y(x), r: 11, fill: 'none', stroke: '#8B5CF6', 'stroke-width': 3, class: 'anillo-marca' }));
      grupo.appendChild(svg('circle', { cx: X(i), cy: Y(x), r: 5.5, fill: nuevo ? '#0EA5E9' : '#94A3B8', stroke: 'white', 'stroke-width': 1.5 }));
      if (marca) grupo.appendChild(svg('text', { x: X(i), y: Y(x) - 16, 'text-anchor': 'middle', style: 'fill:#8B5CF6;font-weight:800' }, 'R' + marca));
      if (i % 5 === 4 || i === 0) grupo.appendChild(svg('text', { x: X(i), y: H - 14, 'text-anchor': 'middle' }, String(numero)));
      g.appendChild(grupo);
    });
    g.addEventListener('click', function (e) {
      var p = e.target.closest('.punto-carta.nuevo');
      if (p) alClic(p.getAttribute('data-n'));
    });
    g.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var p = e.target.closest('.punto-carta.nuevo');
      if (p) { e.preventDefault(); alClic(p.getAttribute('data-n')); }
    });
    return g;
  }

  var dlgPunto = null;
  function crearDialogo(alGuardar) {
    if (dlgPunto) return dlgPunto;
    dlgPunto = crear('dialog', { clase: 'modal', id: 'dlg-senal', 'aria-labelledby': 'senal-titulo' });
    dlgPunto.innerHTML = '<form method="dialog"><div class="modal-cab"><span class="ico-tile chico" data-tono="violeta"><i data-icono="actividad"></i></span>' +
      '<h3 id="senal-titulo"></h3><button type="submit" value="cancelar" class="btn-icono" data-tip="Cerrar" aria-label="Cerrar"><i data-icono="x"></i></button></div>' +
      '<div class="modal-cuerpo"><p class="suave" id="senal-detalle"></p><div class="fichas" id="senal-reglas" role="radiogroup" aria-label="Regla de Nelson"></div></div>' +
      '<div class="modal-pie"><button type="submit" value="quitar" class="btn btn-peligro" id="senal-quitar"><i data-icono="papelera"></i> Quitar la marca</button>' +
      '<button type="submit" value="cancelar" class="btn">Cancelar</button><button type="submit" value="guardar" class="btn btn-primario"><i data-icono="check"></i> Marcar</button></div></form>';
    var fichas = dlgPunto.querySelector('#senal-reglas');
    REGLAS.forEach(function (r) {
      fichas.appendChild(crear('label', { clase: 'ficha', 'data-tono': 'violeta' }, [crear('input', { type: 'radio', name: 'senal-regla', value: r[0] }), crear('span', { texto: r[1] })]));
    });
    document.body.appendChild(dlgPunto);
    window.Iconos.pintar(dlgPunto);
    dlgPunto.querySelector('form').addEventListener('submit', function (e) {
      var accion = e.submitter ? e.submitter.value : 'cancelar';
      var elegido = dlgPunto.querySelector('input[name="senal-regla"]:checked');
      if (accion === 'guardar' && !elegido) { e.preventDefault(); C.toast('Elija la regla que se activa', 'aviso'); return; }
      alGuardar(dlgPunto.dataset.punto, accion, elegido ? elegido.value : '');
    });
    return dlgPunto;
  }

  window.Motor.iniciar({
    id: 'P6',
    titulo: 'Carta de control de una balanza',
    icono: 'actividad',
    etiqueta: 'Sesión 2 · Práctica 6',
    descripcion: 'Con la comprobación intermedia diaria de una balanza semimicro, calcule los límites de la carta de control, identifique las señales con las reglas de Nelson y decida qué hacer.',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · nota de 0,0 a 5,0'], ['libro', 'ISO/IEC 17025 6.4.10 · Nelson (1984)']],
    notaRegistro: 'Los datos y la ubicación de las señales cambian para cada estudiante.',
    comoFunciona: [
      'Con los 20 datos del periodo base, la calculadora da la media y la desviación estándar; calcule los límites de advertencia y de control.',
      'Revise si los límites caben dentro del EMP de la balanza.',
      'En la carta, haga clic en los puntos donde se activan las reglas de Nelson 1, 2 y 3.',
      'Proponga causas con las 6M, decida acciones y la frecuencia, y redacte el acta. Revise y envíe.'
    ],
    partes: [
      { id: 'A', titulo: 'Límites', nombre: 'A · Límites de la carta', icono: 'regla', tono: 'cielo', pts: 30, resumen: 'Media ± 2s y ± 3s; capacidad frente al EMP.' },
      { id: 'B', titulo: 'Señales', nombre: 'B · Señales (reglas de Nelson)', icono: 'actividad', tono: 'violeta', pts: 30, resumen: 'Marque en la carta dónde se activan las reglas 1, 2 y 3.' },
      { id: 'C', titulo: 'Causas', nombre: 'C · Causas y acciones', icono: 'buscar', tono: 'ambar', pts: 25, resumen: 'Causa 6M de cada señal, acción y frecuencia.' },
      { id: 'D', titulo: 'Acta', nombre: 'D · Acta de decisiones', icono: 'documento', tono: 'rosa', pts: 15, docente: true, resumen: 'Acta breve que califica el docente.' }
    ],
    varianteDemo: {
      emp: '1,0',
      iniciales: ['+0,12', '−0,05', '+0,21', '+0,03', '−0,14', '+0,08', '+0,17', '−0,02', '+0,05', '−0,09', '+0,11', '+0,00', '−0,07', '+0,15', '+0,06', '−0,11', '+0,09', '+0,02', '−0,04', '+0,10'],
      nuevos: ['+0,07', '−0,06', '+0,58', '−0,03', '+0,09', '+0,05', '−0,10', '+0,12', '+0,15', '+0,09', '+0,18', '+0,11', '+0,20', '+0,08', '+0,14', '+0,16', '−0,08', '+0,06', '−0,07',
        '−0,15', '−0,09', '−0,03', '+0,04', '+0,10', '+0,17', '−0,05', '+0,08', '−0,02', '+0,06', '−0,04']
    },
    respuestasVacias: function () { return { A: {}, B: { marcas: '' }, C: {}, D: { acta: '' } }; },

    pintar: {
      A: function (panel, h) {
        var v = h.estado.variante, st = est(v);
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'cielo' });
        cont.appendChild(h.encabezado('A', 'Balanza semimicro (d = 0,01 mg) · pesa de control de 100 g, clase E2 · se grafica la diferencia indicación − valor de la pesa.'));
        var rejilla = crear('div', { clase: 'rejilla-datos' });
        v.iniciales.forEach(function (x, i) { rejilla.appendChild(crear('span', null, [crear('small', { texto: String(i + 1) }), x])); });
        cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:1' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('lista')]), crear('h3', { texto: 'Periodo base: 20 diferencias (mg)' })]), rejilla]));
        var salida = crear('div', { clase: 'calc-salida' }, [
          crear('div', null, [crear('small', { texto: 'n' }), crear('b', { texto: String(st.n) })]),
          crear('div', { 'data-tip': 'x̄ = Σxᵢ / n' }, [crear('small', { texto: 'Media x̄' }), crear('b', { texto: fmt(st.media, 3) + ' mg' })]),
          crear('div', { 'data-tip': 's = √[Σ(xᵢ − x̄)² / (n − 1)]' }, [crear('small', { texto: 'Desviación estándar s' }), crear('b', { texto: fmt(st.s, 3).replace('+', '') + ' mg' })]),
          crear('div', { 'data-tip': 'Para los límites de advertencia: media ± 2s' }, [crear('small', { texto: '2s' }), crear('b', { texto: fmt(2 * st.s, 3).replace('+', '') + ' mg' })]),
          crear('div', { 'data-tip': 'Para los límites de control: media ± 3s' }, [crear('small', { texto: '3s' }), crear('b', { texto: fmt(3 * st.s, 3).replace('+', '') + ' mg' })])
        ]);
        var boton = crear('button', { type: 'button', clase: 'btn btn-primario' }, [C.icono('rayo'), 'Calcular media, s, 2s y 3s']);
        boton.addEventListener('click', function () { salida.classList.remove('visible'); void salida.offsetWidth; salida.classList.add('visible'); C.toast('Estadísticos calculados', 'exito', 'rayo'); });
        cont.appendChild(crear('div', { clase: 'tarjeta calculadora aparecer', style: '--i:2' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('teclado')]), crear('div', null, [crear('h3', { texto: 'Calculadora' }), crear('span', { clase: 'suave peq', texto: 'Media y desviación estándar muestral (n − 1) del periodo base.' })])]),
          boton, salida]));
        cont.appendChild(h.ejercicio('regla', 'Límites de la carta', 24, ['Redondee a 0,01 mg. Se acepta ±1 en el último dígito.'], [
          h.respuesta('A', 'A1', 'LCS · límite de control superior (media + 3s)', 'mg', { placeholder: 'Con su signo' }),
          h.respuesta('A', 'A2', 'LAS · límite de advertencia superior (media + 2s)', 'mg', { placeholder: 'Con su signo' }),
          h.respuesta('A', 'A3', 'LAI · límite de advertencia inferior (media − 2s)', 'mg', { placeholder: 'Con su signo' }),
          h.respuesta('A', 'A4', 'LCI · límite de control inferior (media − 3s)', 'mg', { placeholder: 'Con su signo' })
        ], 3));
        cont.appendChild(h.ejercicio('insignia', 'Capacidad', 6, ['El EMP de la balanza a 100 g es ', h.dato('±' + v.emp + ' mg'), '. ¿Los límites de control (media ± 3s) quedan dentro de ese EMP?'],
          [h.seleccion('A', 'A5', '¿La balanza es capaz?', [['si', 'Sí: los límites caben dentro del EMP'], ['no', 'No: algún límite supera el EMP']], { columnas: 2 })], 4));
        panel.appendChild(cont);
      },
      B: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('B', 'Hay tres señales: una de cada regla. Marque un punto de cada señal y elija su regla. Cada marca en un punto sin señal resta 3 puntos.'));
        var lienzo = crear('div', { clase: 'lienzo-carta tabla-scroll' });
        var lista = crear('ul', { clase: 'lista-errores' });
        function pintar() {
          lienzo.textContent = '';
          lienzo.appendChild(carta(v, h, abrir));
          var marcas = leerMarcas(h);
          lista.textContent = '';
          var claves = Object.keys(marcas).sort(function (a, b) { return a - b; });
          if (!claves.length) lista.appendChild(crear('li', { clase: 'vacio' }, [C.icono('actividad'), crear('span', { texto: 'Aún no ha marcado señales. Haga clic en un punto azul de la carta.' })]));
          claves.forEach(function (k) {
            var quitar = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Quitar la marca', 'aria-label': 'Quitar la marca del punto ' + k }, [C.icono('papelera')]);
            quitar.addEventListener('click', function () { var m = leerMarcas(h); delete m[k]; guardarMarcas(h, m); pintar(); C.toast('Marca quitada', 'info', 'papelera'); });
            lista.appendChild(crear('li', { clase: 'error-item' }, [crear('span', { clase: 'valor-num', texto: 'R' + marcas[k] }),
              crear('div', null, [crear('b', { texto: 'Punto ' + k + ' · ' + v.nuevos[k - N0 - 1] + ' mg' }), crear('div', { clase: 'campo-nombre', texto: REGLAS[marcas[k] - 1][1] })]),
              crear('div', { clase: 'botones-item' }, [quitar])]));
          });
        }
        function abrir(n) {
          var d = crearDialogo(function (punto, accion, regla) {
            var m = leerMarcas(h);
            if (accion === 'guardar') { m[punto] = regla; C.toast('Señal marcada en el punto ' + punto, 'exito', 'actividad'); }
            else if (accion === 'quitar') { delete m[punto]; C.toast('Marca quitada', 'info', 'papelera'); }
            else return;
            guardarMarcas(h, m);
            pintar();
          });
          var marcas = leerMarcas(h);
          d.dataset.punto = n;
          d.querySelector('#senal-titulo').textContent = 'Punto ' + n;
          d.querySelector('#senal-detalle').textContent = 'Diferencia: ' + v.nuevos[n - N0 - 1] + ' mg. ¿Qué regla de Nelson se activa con este punto?';
          d.querySelectorAll('input[name="senal-regla"]').forEach(function (x) { x.checked = x.value === marcas[n]; });
          d.querySelector('#senal-quitar').hidden = !marcas[n];
          d.showModal();
        }
        pintar();
        cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:1' }, [lienzo,
          crear('div', { clase: 'leyenda-reglas' }, REGLAS.map(function (r) { return crear('span', null, [crear('b', { texto: 'R' + r[0] }), r[1].split('· ')[1]]); }))]));
        cont.appendChild(crear('div', { clase: 'tarjeta aparecer', style: '--i:2', 'data-tono': 'violeta' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('lista')]), crear('h3', { texto: 'Señales marcadas' })]), lista]));
        panel.appendChild(cont);
      },
      C: function (panel, h) {
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'ambar' });
        cont.appendChild(h.encabezado('C', 'Use el enfoque de las 6M para proponer la causa más probable de cada señal.'));
        [1, 2, 3].forEach(function (r) {
          cont.appendChild(h.ejercicio('buscar', 'C' + r + ' · Causa probable de la señal de la regla ' + r, 5, [REGLAS[r - 1][1] + '.'],
            [h.seleccion('C', 'C' + r, 'Causa más probable', CAUSAS, { columnas: 2 })], r));
        });
        cont.appendChild(h.ejercicio('alerta', 'C4 · Cuando una regla se activa', 5, null, [h.seleccion('C', 'C4', '¿Qué se hace?', ACCION, { columnas: 1 })], 4));
        cont.appendChild(h.ejercicio('calendario', 'C5 · Frecuencia de la comprobación intermedia', 5, null, [h.seleccion('C', 'C5', 'Decisión', FRECUENCIA, { columnas: 1 })], 5));
        panel.appendChild(cont);
      },
      D: function (panel, h) {
        panel.appendChild(crear('div', { clase: 'tarjeta', 'data-tono': 'rosa' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile' }, [C.icono('documento')]),
            crear('div', null, [crear('h2', { texto: 'Parte D · Acta de decisiones' }), crear('span', { clase: 'suave peq', texto: 'La califica el docente' })]), crear('span', { clase: 'pts', texto: '15 pts' })]),
          h.recuadro('Sus respuestas de las partes B y C', function (r) {
            var marcas = String(r.B.marcas || '').split(',').filter(function (x) { return x; }).map(function (m) {
              var p = m.split(':'); return 'punto ' + p[0] + ' (regla ' + p[1] + ')';
            });
            var corto = function (lista, valor) { return valor ? h.textoOpcion(lista, valor).split(':')[0] : ''; };
            return [['Señales marcadas', marcas.join(' · ')], ['C1 · Causa de la regla 1', corto(CAUSAS, r.C.C1)], ['C2 · Causa de la regla 2', corto(CAUSAS, r.C.C2)],
              ['C3 · Causa de la regla 3', corto(CAUSAS, r.C.C3)], ['C4 · Ante una señal', h.textoOpcion(ACCION, r.C.C4)], ['C5 · Frecuencia', h.textoOpcion(FRECUENCIA, r.C.C5)]];
          }),
          h.texto('D', 'acta', 'Acta breve: señales detectadas, causa probable, acciones (incluida la evaluación de los resultados emitidos, 7.10), decisión sobre la frecuencia y si conviene revisar los límites.',
            { max: 1500, minimo: 250, placeholder: 'Fecha: … Señales: … Acciones: …' })
        ]));
      }
    },

    avance: function (r, h) {
      var nA = h.llenos('A', ['A1', 'A2', 'A3', 'A4', 'A5']), nC = h.llenos('C', ['C1', 'C2', 'C3', 'C4', 'C5']);
      var nM = (r.B.marcas || '').split(',').filter(function (x) { return x; }).length;
      var nD = (r.D.acta || '').trim().length;
      var faltan = (5 - nA) + (5 - nC);
      return {
        fraccion: { A: nA / 5, B: Math.min(nM, 3) / 3, C: nC / 5, D: Math.min(1, nD / 250) },
        sub: { A: nA + ' de 5', B: nM + (nM === 1 ? ' marca' : ' marcas'), C: nC + ' de 5', D: nD + ' caracteres' },
        revision: [
          [nA === 5, 'regla', 'Parte A: ' + nA + ' de 5 respuestas', nA < 5 ? 'Hay límites o la capacidad sin responder.' : 'Completa.'],
          [nM >= 3, 'actividad', 'Parte B: ' + nM + (nM === 1 ? ' señal marcada' : ' señales marcadas'), nM < 3 ? 'Hay tres señales: una de cada regla.' : 'Recuerde: cada marca sin señal resta 3 puntos.'],
          [nC === 5, 'buscar', 'Parte C: ' + nC + ' de 5 respuestas', nC < 5 ? 'Hay preguntas sin responder.' : 'Completa.'],
          [nD >= 250, 'documento', 'Parte D: ' + nD + ' caracteres', nD < 250 ? 'Desarrolle el acta (al menos 250 caracteres).' : 'Completa.']
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas sin completar en las partes A y C.' : ''
      };
    },

    apoyo: function (cont) {
      cont.appendChild(crear('h3', null, [C.icono('regla'), 'Cómo construir los límites']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div>Con al menos 20 datos en condiciones estables: media y s. Advertencia: media ± 2s. Control: media ± 3s.</div>' +
        '<div>Compare ±3s con el EMP: si un límite lo supera, el equipo no es capaz para el uso.</div>' +
        '<div>Revise los límites tras calibraciones, ajustes o mantenimiento.</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('actividad'), 'Reglas de Nelson 1 a 3']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>Regla 1.</b> Un punto más allá de 3s respecto a la media: fuera de control.</div>' +
        '<div><b>Regla 2.</b> Nueve (o más) puntos seguidos del mismo lado de la media: sesgo prolongado.</div>' +
        '<div><b>Regla 3.</b> Seis (o más) puntos seguidos que aumentan o disminuyen: tendencia.</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('alerta'), 'Cuando una regla se activa']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html: '<div>Detener · repetir (registrando todo) · investigar con las 6M · corregir · evaluar el impacto (7.10) · registrar y revisar la frecuencia. Nunca «repetir hasta que salga bien».</div>' }));
    }
  });
})();
