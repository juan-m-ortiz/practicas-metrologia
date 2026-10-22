// Práctica 1 · Cazadores de errores del SI — contenido de la práctica.
// Código PÚBLICO: el informe (con sus errores, que son el ejercicio) y los enunciados.
// La clave de respuestas y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;

  var REGLAS = [
    ['R1', 'Punto final o plural en el símbolo', '«kgs», «min.»'],
    ['R2', 'Mayúscula o minúscula incorrecta', '«Kg», «KHz», «pa»'],
    ['R3', 'Símbolo inventado o no reconocido', '«seg», «hr», «gr»'],
    ['R4', 'Prefijo mal escrito', '«uL», «mcg», «m m»'],
    ['R5', 'Mezcla de nombre y símbolo', '«kilogramo/m³»'],
    ['R6', 'Varias barras o producto mal escrito', '«Nm», varias «/»'],
    ['R7', 'Expresión ambigua (ppm, ppb)', '«25 ppm»'],
    ['R8', 'Espacio número–unidad, o º por °', '«25°C», «50%»'],
    ['R9', 'Separador decimal o falta el cero', '«0.374 mg», «,374 mg»'],
    ['R10', 'Agrupación de dígitos incorrecta', '«1.234.567»'],
    ['R11', 'Intervalo mal expresado', '«20 a 25 °C» sin paréntesis'],
    ['R12', 'Valor con incertidumbre mal escrito', 'sin paréntesis ni unidad común'],
    ['R13', 'Redondeo no acorde con la incertidumbre', 'U con cuatro cifras'],
    ['R14', 'Unidad no SI sin convertir (NIST SP 811)', 'psi sin su valor en kPa']
  ];

  var INFORME = [
    { titulo: '1. Recepción de la muestra', filas: [
      ['Matriz', 'Agua para consumo humano'],
      ['Punto de muestreo', 'Grifo de la red de distribución, PM-07'],
      ['Temperatura de la muestra al recibirla', { id: 'A01', v: '3ºC' }],
      ['Volumen recibido', { id: 'A02', v: '1 lt' }],
      ['Preservación', { id: 'A03', v: 'HNO₃ hasta pH < 2' }]
    ] },
    { titulo: '2. Condiciones ambientales durante el ensayo', filas: [
      ['Temperatura del laboratorio', { id: 'A04', v: '20-24 °C' }],
      ['Humedad relativa', { id: 'A05', v: '55 %' }],
      ['Presión atmosférica', { id: 'A06', v: '90,8 KPa' }]
    ] },
    { titulo: '3. Preparación y medición del plomo (GFAAS, 283,3 nm)', filas: [
      ['Volumen de muestra filtrada (0,45 µm)', { id: 'A07', v: '1.250 mL' }],
      ['Masa de muestra pesada', { id: 'A08', v: '50,0 grs.' }],
      ['Solución patrón de Pb (MRC)', { id: 'A09', v: '1000 mg/L' }],
      ['Alícuota inyectada en el horno de grafito', { id: 'A10', v: '20 uL' }],
      ['Temperatura de pirólisis', { id: 'A11', v: '850 °C' }],
      ['Flujo de argón', { id: 'A12', v: '0,25 L/min' }],
      ['Calentamiento previo de la lámpara', { id: 'A13', v: '30 mins' }],
      ['Temperatura de referencia del método', { id: 'A14', v: '293,15 °K' }]
    ] },
    { titulo: '4. Resultados', tabla: [
      ['Plomo (Pb) disuelto', { id: 'A15', v: '8,73421 ± 1,827 µg/L' }, ' (k = 2)', 'Absorción atómica con horno de grafito'],
      ['Límite de cuantificación (Pb)', { id: 'A16', v: '1,5 ppb' }, '', '—'],
      ['Conductividad a 25 °C', { id: 'A17', v: '452 µS/cm' }, '', 'Electrometría'],
      ['Dureza total (como CaCO₃)', { id: 'A18', v: '120 miligramos/L' }, '', 'Titulación con EDTA'],
      ['Cloro residual libre', { id: 'A19', v: ',8 mg/L' }, '', 'Colorimetría con DPD'],
      ['Hierro total', { id: 'A20', v: '0.12 mg/L' }, '', 'Fenantrolina'],
      ['Recuperación del MRC (control de calidad)', { id: 'A21', v: '98,5 %' }, '', '—']
    ] },
    { titulo: '5. Información suministrada por el cliente', filas: [
      ['Tasa de decaimiento del cloro en la red', { id: 'A22', v: '0,2 mg/L/h' }]
    ] }
  ];

  var ETIQUETAS = {}, VALORES = {}, ORDEN_A = [];
  INFORME.forEach(function (s) {
    (s.filas || s.tabla).forEach(function (f) {
      if (typeof f[1] === 'object') { ETIQUETAS[f[1].id] = f[0]; VALORES[f[1].id] = f[1].v; ORDEN_A.push(f[1].id); }
    });
  });
  var ITEMS_B = ['B1', 'B2', 'B3', 'B4U', 'B4y', 'B4expr'];
  var ITEMS_C = ['C1valor', 'C1U', 'C2valor', 'C2U', 'C3'];

  var ctx = null;              // ayudas del motor
  function respA() { return ctx.estado.respuestas.A; }
  function marcados() { return ORDEN_A.filter(function (id) { return respA()[id]; }); }
  function nombreRegla(id) {
    for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i][0] === id) return REGLAS[i][1];
    return '';
  }

  // ---------------------------------------------------------------------------
  // Parte A: informe con errores y editor
  // ---------------------------------------------------------------------------

  var panelA = null, informe = null, listaErrores = null, nErrores = null, editorCampo = null;

  function botonValor(campo) {
    var r = respA()[campo.id];
    var b = crear('button', { type: 'button', clase: 'valor' + (r ? ' marcado' : ''), 'data-campo': campo.id,
      'aria-label': ETIQUETAS[campo.id] + ': ' + campo.v + (r ? ' (marcado como error)' : ''),
      'data-tip': r ? 'Marcado: ' + r.regla + ' → ' + r.correccion + ' · clic para editar' : 'Clic para revisar este valor' },
    [crear('span', { texto: campo.v }), C.icono('buscar', 'lupa')]);
    if (r) b.appendChild(crear('span', { clase: 'valor-num', texto: String(marcados().indexOf(campo.id) + 1) }));
    return b;
  }

  function pintarInforme() {
    var ed = ctx.estado.edicion || C.edicion();   // fecha de referencia de la edición del curso
    informe.textContent = '';
    informe.appendChild(crear('div', { clase: 'doc-cab' }, [
      crear('div', { clase: 'doc-titulo' }, [
        crear('span', { clase: 'ico-tile', 'data-tono': 'esmeralda' }, [C.icono('matraz')]),
        crear('div', null, [crear('h2', { texto: 'Informe de resultados N.º IR-' + ed.fecha.slice(0, 4) + '-0815' }),
          crear('p', { texto: 'Laboratorio de aguas · Cliente: Acueducto municipal · Emitido el ' + C.fechaRelativa(-2, ed.fecha) })])
      ]),
      crear('span', { clase: 'sello' }, [C.icono('alerta'), 'Documento ficticio'])
    ]));
    var cuerpo = crear('div', { clase: 'doc-cuerpo' });
    INFORME.forEach(function (s) {
      var sec = crear('section', { clase: 'doc-seccion' }, [crear('h4', { texto: s.titulo })]);
      if (s.filas) {
        s.filas.forEach(function (f) {
          sec.appendChild(crear('div', { clase: 'doc-fila' }, [crear('span', { clase: 'etq', texto: f[0] }),
            crear('span', null, [typeof f[1] === 'object' ? botonValor(f[1]) : f[1]])]));
        });
      } else {
        var tabla = crear('table', { clase: 'doc-tabla' });
        tabla.appendChild(crear('thead', null, [crear('tr', null, [crear('th', { texto: 'Parámetro' }), crear('th', { texto: 'Resultado' }), crear('th', { texto: 'Método' })])]));
        var tb = crear('tbody');
        s.tabla.forEach(function (f) {
          tb.appendChild(crear('tr', null, [crear('td', { texto: f[0] }), crear('td', null, [botonValor(f[1]), f[2]]), crear('td', { texto: f[3] })]));
        });
        tabla.appendChild(tb);
        sec.appendChild(tabla);
      }
      cuerpo.appendChild(sec);
    });
    cuerpo.appendChild(crear('div', { clase: 'doc-pie' }, [C.icono('info'), crear('span', { texto:
      'Valor máximo aceptable de plomo en agua para consumo humano: 0,01 mg/L (Resolución 2115 de 2007). ' +
      'La incertidumbre expandida se declara con k = 2, para un nivel de confianza de aproximadamente 95 %.' })]));
    informe.appendChild(cuerpo);
  }

  function pintarListaErrores() {
    listaErrores.textContent = '';
    var ids = marcados();
    nErrores.textContent = ids.length;
    if (!ids.length) {
      listaErrores.appendChild(crear('li', { clase: 'vacio' }, [C.icono('buscar'),
        crear('span', { texto: 'Aún no ha marcado errores. Haga clic en un valor del informe para empezar.' })]));
      return;
    }
    ids.forEach(function (id, i) {
      var r = respA()[id];
      var editar = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Editar', 'aria-label': 'Editar ' + ETIQUETAS[id] }, [C.icono('lapiz')]);
      editar.addEventListener('click', function () { abrirEditor(id); });
      var quitar = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Quitar la marca', 'aria-label': 'Quitar la marca de ' + ETIQUETAS[id] }, [C.icono('papelera')]);
      quitar.addEventListener('click', function () { delete respA()[id]; refrescarA(); C.toast('Marca quitada', 'info', 'papelera'); });
      listaErrores.appendChild(crear('li', { clase: 'error-item', style: 'animation-delay:' + (i * 30) + 'ms' }, [
        crear('span', { clase: 'valor-num', texto: String(i + 1) }),
        crear('div', { style: 'min-width:0' }, [
          crear('div', { clase: 'campo-nombre', texto: ETIQUETAS[id] }),
          crear('div', { clase: 'cambio' }, [crear('span', { clase: 'antes', texto: VALORES[id] }), C.icono('flecha'),
            crear('span', { clase: 'despues', texto: r.correccion }),
            crear('span', { clase: 'regla-pill', texto: r.regla, 'data-tip': nombreRegla(r.regla) })])
        ]),
        crear('div', { clase: 'botones-item' }, [editar, quitar])
      ]));
    });
  }

  function refrescarA() {
    ctx.guardar();
    pintarInforme();
    pintarListaErrores();
    ctx.actualizar();
  }

  function crearEditor() {
    if (document.getElementById('editor')) return;
    var d = crear('dialog', { clase: 'modal', id: 'editor', 'aria-labelledby': 'editor-titulo' });
    d.innerHTML =
      '<form method="dialog" id="form-editor">' +
      '<div class="modal-cab"><span class="ico-tile chico" data-tono="ambar"><i data-icono="buscar"></i></span><h3 id="editor-titulo"></h3>' +
      '<button type="submit" value="cancelar" class="btn-icono" formnovalidate data-tip="Cerrar sin cambios" aria-label="Cerrar"><i data-icono="x"></i></button></div>' +
      '<div class="modal-cuerpo"><div class="original"><i data-icono="alerta"></i><span id="editor-original"></span></div>' +
      '<span class="campo" style="margin-bottom:8px"><span class="etq">¿Qué regla incumple?</span></span>' +
      '<div class="reglas-grid" id="editor-reglas" role="radiogroup" aria-label="Regla que incumple"></div>' +
      '<label class="campo" style="margin-bottom:0"><span class="etq">Versión corregida (valor y unidad)</span>' +
      '<span class="control"><span class="ico"><i data-icono="lapiz"></i></span><input type="text" id="editor-correccion" maxlength="120" autocomplete="off" spellcheck="false" placeholder="Ej.: 25 °C"></span></label>' +
      '<div id="editor-simbolos"></div>' +
      '<div class="aviso aviso-error" id="error-editor" role="alert" hidden><span class="ico"><i data-icono="alerta"></i></span><p></p></div></div>' +
      '<div class="modal-pie"><button type="submit" value="quitar" class="btn btn-peligro" id="editor-quitar"><i data-icono="papelera"></i> Quitar la marca</button>' +
      '<button type="submit" value="cancelar" class="btn" formnovalidate>Cancelar</button>' +
      '<button type="submit" value="guardar" class="btn btn-primario" id="editor-guardar"><i data-icono="check"></i> <span>Marcar como error</span></button></div></form>';
    document.body.appendChild(d);
    var grid = d.querySelector('#editor-reglas');
    REGLAS.forEach(function (r) {
      grid.appendChild(crear('label', { clase: 'regla-opcion', 'data-tip': 'Ejemplo incorrecto: ' + r[2] }, [
        crear('input', { type: 'radio', name: 'regla', value: r[0] }), crear('span', null, [crear('b', { texto: r[0] }), r[1]])]));
    });
    var form = d.querySelector('#form-editor');
    d.querySelector('#editor-simbolos').appendChild(C.barraSimbolos(form));
    C.recordarFoco(form);
    window.Iconos.pintar(d);

    form.addEventListener('submit', function (e) {
      var accion = e.submitter ? e.submitter.value : 'cancelar';
      if (accion === 'guardar') {
        var x = grid.querySelector('input:checked');
        var regla = x ? x.value : '';
        var correccion = d.querySelector('#editor-correccion').value.trim();
        if (!regla || !correccion) {
          e.preventDefault();
          var err = d.querySelector('#error-editor');
          err.querySelector('p').textContent = 'Elija la regla y escriba la versión corregida. Si duda de la regla, elija la más cercana.';
          err.hidden = false; err.classList.remove('sacudir'); void err.offsetWidth; err.classList.add('sacudir');
          return;
        }
        var nuevo = !respA()[editorCampo];
        respA()[editorCampo] = { regla: regla, correccion: correccion };
        C.toast(nuevo ? 'Error marcado: ' + VALORES[editorCampo] : 'Cambios guardados', 'exito', nuevo ? 'buscar' : 'check');
      } else if (accion === 'quitar') {
        delete respA()[editorCampo];
        C.toast('Marca quitada', 'info', 'papelera');
      } else {
        return;
      }
      refrescarA();
    });
    d.addEventListener('close', function () {
      var b = document.querySelector('[data-campo="' + editorCampo + '"]');
      if (b) b.focus({ preventScroll: true });
    });
  }

  function abrirEditor(id) {
    editorCampo = id;
    var r = respA()[id];
    var d = document.getElementById('editor');
    d.querySelector('#editor-titulo').textContent = ETIQUETAS[id];
    d.querySelector('#editor-original').textContent = VALORES[id];
    d.querySelectorAll('#editor-reglas input').forEach(function (x) { x.checked = !!r && x.value === r.regla; });
    d.querySelector('#editor-correccion').value = r ? r.correccion : '';
    d.querySelector('#editor-quitar').hidden = !r;
    d.querySelector('#editor-guardar span').textContent = r ? 'Guardar cambios' : 'Marcar como error';
    d.querySelector('#error-editor').hidden = true;
    d.showModal();
    (d.querySelector('#editor-reglas input:checked') || d.querySelector('#editor-reglas input')).focus();
  }

  // ---------------------------------------------------------------------------
  // Definición de la práctica
  // ---------------------------------------------------------------------------

  ctx = window.Motor.iniciar({
    id: 'P1',
    titulo: 'Cazadores de errores del SI',
    icono: 'buscar',
    etiqueta: 'Sesión 1 · Práctica 1',
    descripcion: 'Detecte y corrija errores de escritura, redondeo y conversión de unidades en un informe de resultados del laboratorio del caso conductor: plomo en agua para consumo humano.',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · nota de 0,0 a 5,0'], ['libro', 'Folleto SI · ISO 80000-1 · NIST SP 811 · GUM']],
    notaRegistro: 'Sus valores de redondeo y conversión se calculan a partir de su correo.',
    comoFunciona: [
      'Revise el informe y haga clic en cada valor que esté mal escrito. Elija la regla que incumple y escriba la corrección.',
      'Resuelva los ejercicios de redondeo y conversión con sus propios valores.',
      'Escriba su reflexión sobre el error más riesgoso.',
      'Revise su avance y envíe. Guarde el código de consulta que recibirá.'
    ],
    pie: 'Informe ficticio con fines didácticos',
    partes: [
      { id: 'A', titulo: 'Informe', nombre: 'A · Informe con errores', icono: 'buscar', tono: 'ambar', pts: 45,
        resumen: 'Marque los valores mal escritos, cite la regla incumplida y escriba la corrección.' },
      { id: 'B', titulo: 'Redondeo', nombre: 'B · Redondeo', icono: 'redondeo', tono: 'violeta', pts: 20,
        resumen: 'Intervalos de redondeo, empates y cifras según la incertidumbre.' },
      { id: 'C', titulo: 'Conversión', nombre: 'C · Conversión', icono: 'convertir', tono: 'cielo', pts: 20,
        resumen: 'Unidades no SI con los factores de la NIST SP 811.' },
      { id: 'D', titulo: 'Reflexión', nombre: 'D · Reflexión', icono: 'mensaje', tono: 'rosa', pts: 15, docente: true,
        resumen: 'El error más riesgoso ante un cliente o un evaluador.' }
    ],
    varianteDemo: {
      B1: { valor: '7,2412', intervalo: '0,01' }, B2: { valor: '4,505', intervalo: '0,01' }, B3: { valor: '71,548', dosEtapas: '71,6' },
      B4: { magnitud: 'concentración másica de nitratos (NO₃⁻) en agua', unidad: 'mg/L', y: '21,018 78', U: '0,5708' },
      C1: { p: '15,3', U: '0,5' }, C2: { t: '115,0', U: '0,6' }, C3: { v: '6,0' }
    },
    respuestasVacias: function () { return { A: {}, B: {}, C: {}, D: { reflexion: '' } }; },

    pintar: {
      A: function (panel, h) {
        ctx = h;
        crearEditor();
        informe = crear('article', { clase: 'tarjeta documento', 'aria-label': 'Informe de resultados con errores' });
        listaErrores = crear('ul', { clase: 'lista-errores' });
        nErrores = crear('b', { texto: '0' });
        panel.appendChild(crear('div', { clase: 'rejilla-a' }, [informe, crear('aside', { clase: 'lateral' }, [
          crear('div', { clase: 'tarjeta', 'data-tono': 'ambar' }, [
            crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('lista')]), crear('h3', { texto: 'Tabla de errores' }),
              crear('span', { clase: 'contador-errores', style: 'margin-left:auto', 'data-tip': 'Valores que ha marcado como error' }, [nErrores, crear('span', { clase: 'suave peq', texto: 'marcados' })])]),
            crear('p', { clase: 'suave peq', html: 'El informe tiene <b>alrededor de 15 errores</b>. Cada uno vale 3 puntos (detección, regla y corrección); marcar un valor correcto resta 1 punto.' }),
            listaErrores
          ])
        ])]));
        informe.addEventListener('click', function (e) {
          var b = e.target.closest('[data-campo]');
          if (b) abrirEditor(b.getAttribute('data-campo'));
        });
        panelA = panel;
        pintarInforme();
        pintarListaErrores();
      },
      B: function (panel, h) {
        var v = h.estado.variante, dato = h.dato, r = h.respuesta;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('B', 'Escriba solo el número, con coma decimal. Sus valores son únicos.'));
        cont.appendChild(h.ejercicio('regla', 'B1 · Intervalo de redondeo', 4, ['Redondee ', dato(v.B1.valor), ' con un intervalo de redondeo de ', dato(v.B1.intervalo), '.'],
          [r('B', 'B1', 'Valor redondeado', '')], 1));
        cont.appendChild(h.ejercicio('diana', 'B2 · Empate', 4, ['Redondee ', dato(v.B2.valor), ' con un intervalo de ', dato(v.B2.intervalo),
          '. Aplique la regla preferente de ISO 80000-1 para los empates.'], [r('B', 'B2', 'Valor redondeado', '')], 2));
        cont.appendChild(h.ejercicio('rayo', 'B3 · ¿Una o dos etapas?', 4, ['Un analista redondeó ', dato(v.B3.valor), ' primero a 0,01 y después a 0,1, y reportó ',
          dato(v.B3.dosEtapas), '. ¿Cuál es el valor correcto redondeado a 0,1?'], [r('B', 'B3', 'Valor correcto', '')], 3));
        cont.appendChild(h.ejercicio('destellos', 'B4 · Resultado con incertidumbre (GUM 7.2.6)', 8, ['Para la ', v.B4.magnitud, ', la hoja de cálculo arroja y = ',
          dato(v.B4.y + ' ' + v.B4.unidad), ' y U = ', dato(v.B4.U + ' ' + v.B4.unidad), ' (k = 2).'], [
          r('B', 'B4U', 'a) U con dos cifras significativas', v.B4.unidad),
          r('B', 'B4y', 'b) y redondeado a la misma posición decimal que U', v.B4.unidad),
          r('B', 'B4expr', 'c) Resultado como se escribiría en el informe', '', { ancha: true, placeholder: 'Ej.: (12,3 ± 0,4) mg/L' }),
          h.barraSimbolos(cont)
        ], 4));
        h.recordarFoco(cont);
        panel.appendChild(cont);
      },
      C: function (panel, h) {
        var v = h.estado.variante, dato = h.dato, r = h.respuesta;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'cielo' });
        cont.appendChild(h.encabezado('C', 'Use los factores de la NIST SP 811 del material de apoyo y redondee solo el resultado final.'));
        cont.appendChild(h.ejercicio('manometro', 'C1 · Presión del autoclave', 7, ['El manómetro del autoclave indica ', dato(v.C1.p + ' psi'),
          ' con una incertidumbre expandida U = ', dato(v.C1.U + ' psi'),
          ' (k = 2). Exprese ambos en kilopascales: U con dos cifras significativas y el valor redondeado a la misma posición decimal.'],
          [r('C', 'C1valor', 'a) Valor', 'kPa'), r('C', 'C1U', 'b) U', 'kPa')], 1));
        cont.appendChild(h.ejercicio('termometro', 'C2 · Termómetro de la incubadora', 8, ['Un termómetro de incubadora calibrado en grados Fahrenheit indica ',
          dato(v.C2.t + ' °F'), ' con U = ', dato(v.C2.U + ' °F'),
          ' (k = 2). Exprese ambos en grados Celsius: U con dos cifras significativas y la temperatura redondeada a la misma posición decimal.'],
          [r('C', 'C2valor', 'a) Temperatura', '°C'), r('C', 'C2U', 'b) U', '°C')], 2));
        cont.appendChild(h.ejercicio('vaso', 'C3 · Bidón de reactivo', 5, ['Un bidón de reactivo importado indica una capacidad de ', dato(v.C3.v + ' gal'),
          ' (galones de EE. UU.). Exprese la capacidad en litros, redondeada a 0,01 L.'], [r('C', 'C3', 'Capacidad', 'L')], 3));
        panel.appendChild(cont);
      },
      D: function (panel, h) {
        panel.appendChild(crear('div', { clase: 'tarjeta', 'data-tono': 'rosa' }, [
          crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile' }, [C.icono('mensaje')]),
            crear('div', null, [crear('h2', { texto: 'Parte D · Reflexión' }), crear('span', { clase: 'suave peq', texto: 'La califica el docente' })]),
            crear('span', { clase: 'pts', texto: '15 pts' })]),
          h.texto('D', 'reflexion', 'Elija uno de los errores que encontró en el informe. ¿Qué impacto tendría ante el cliente o en una evaluación de ONAC, y por qué lo considera el más riesgoso?',
            { placeholder: 'Escriba su análisis en 5 a 10 líneas…' })
        ]));
      }
    },

    avance: function (r, h) {
      var nA = ORDEN_A.filter(function (id) { return r.A[id]; }).length;
      var nB = h.llenos('B', ITEMS_B), nC = h.llenos('C', ITEMS_C);
      var nD = (r.D.reflexion || '').trim().length;
      var faltan = (ITEMS_B.length - nB) + (ITEMS_C.length - nC);
      return {
        fraccion: { A: Math.min(nA, 15) / 15, B: nB / ITEMS_B.length, C: nC / ITEMS_C.length, D: Math.min(1, nD / 150) },
        sub: { A: nA + (nA === 1 ? ' marcado' : ' marcados'), B: nB + ' de ' + ITEMS_B.length, C: nC + ' de ' + ITEMS_C.length, D: nD + ' caracteres' },
        revision: [
          [nA >= 10, 'buscar', 'Parte A: ' + nA + (nA === 1 ? ' valor marcado' : ' valores marcados'), 'El informe tiene alrededor de 15 errores. Marcar un valor correcto resta 1 punto.'],
          [nB === ITEMS_B.length, 'redondeo', 'Parte B: ' + nB + ' de ' + ITEMS_B.length + ' respuestas', nB < ITEMS_B.length ? 'Hay respuestas vacías.' : 'Completa.'],
          [nC === ITEMS_C.length, 'convertir', 'Parte C: ' + nC + ' de ' + ITEMS_C.length + ' respuestas', nC < ITEMS_C.length ? 'Hay respuestas vacías.' : 'Completa.'],
          [nD >= 150, 'mensaje', 'Parte D: ' + nD + ' caracteres', nD < 150 ? 'Desarrolle un poco más su reflexión (al menos 150 caracteres).' : 'Completa.']
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas vacías en las partes B y C.' : ''
      };
    },

    apoyo: function (cont) {
      var reglas = crear('div', { clase: 'reglas-apoyo' });
      REGLAS.forEach(function (r) {
        reglas.appendChild(crear('div', null, [crear('b', { texto: r[0] }), crear('span', null, [r[1], crear('small', { texto: 'Ej. incorrecto: ' + r[2] })])]));
      });
      cont.appendChild(crear('h3', null, [C.icono('regla'), 'Reglas de escritura']));
      cont.appendChild(reglas);
      cont.appendChild(crear('h3', null, [C.icono('redondeo'), 'Redondeo']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>Intervalo de redondeo.</b> Se reemplaza el número por el múltiplo entero más cercano del intervalo (ISO 80000-1, anexo B).</div>' +
        '<div><b>Empates.</b> Regla A (preferente): se elige el número par. Regla B: el de mayor magnitud.</div>' +
        '<div><b>Una sola etapa.</b> Se redondea directamente desde el valor original, nunca por pasos.</div>' +
        '<div><b>Con incertidumbre.</b> U con dos cifras significativas; el resultado a la misma posición decimal (GUM 7.2.6).</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('convertir'), 'Factores de conversión (NIST SP 811)']));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>1 in</td><td>25,4 mm (exacto)</td></tr><tr><td>1 lb</td><td>0,453 592 37 kg (exacto)</td></tr>' +
        '<tr><td>1 psi</td><td>6,894 757 kPa</td></tr><tr><td>1 bar</td><td>100 kPa (exacto)</td></tr>' +
        '<tr><td>1 mmHg</td><td>133,322 4 Pa</td></tr><tr><td>1 cal (termoquímica)</td><td>4,184 J (exacto)</td></tr>' +
        '<tr><td>1 gal (EE. UU.)</td><td>3,785 412 L</td></tr><tr><td>t/°F → t/°C</td><td>(t/°F − 32)/1,8</td></tr>' }));
    }
  });
})();
