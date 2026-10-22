// Práctica 7 · Revisión de un certificado de calibración — contenido.
// Código PÚBLICO: certificado ficticio, hoja de vida, extracto del alcance y los 10 + 1 pasos.
// La clave y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;

  var PASOS = [
    ['A1', 'Paso 1 · ¿Respalda la trazabilidad?', '¿Lleva la marca de acreditación? ¿El servicio está en el alcance? ¿Declara la trazabilidad?',
      [['ok', 'Conforme: marca de acreditación, servicio en el alcance y declaración de trazabilidad'], ['sinmarca', 'No lleva marca ni referencia a la acreditación'], ['sindecl', 'No declara cómo los resultados son trazables (7.8.4.1 c)']]],
    ['A2', 'Paso 2 · ¿Corresponde al instrumento?', 'Compare fabricante, modelo y número de serie con la hoja de vida.',
      [['ok', 'Conforme: identifica sin duda al instrumento de la hoja de vida'], ['serie', 'El número de serie no coincide con la hoja de vida'], ['modelo', 'No indica el fabricante ni el modelo']]],
    ['A3', 'Paso 3 · Fecha de calibración', 'Hay tres fechas: recepción, calibración y emisión. El programa del laboratorio es de 12 meses.',
      [['ok', 'Conforme: la calibración está vigente según el programa'], ['vencida', 'Desde la fecha de calibración ya se superó el intervalo del programa'], ['emision', 'El intervalo debe contarse desde la fecha de emisión, no desde la de calibración']]],
    ['A4', 'Paso 4 · Alcance', 'Acreditado ⊇ calibrado ⊇ uso. Compare el alcance, los puntos calibrados y el intervalo de uso.',
      [['ok', 'Conforme: lo acreditado cubre lo calibrado y lo calibrado cubre el uso'], ['uso', 'Parte del intervalo de uso queda fuera de los puntos calibrados'], ['acred', 'Parte de lo calibrado queda fuera del alcance acreditado']]],
    ['A5', 'Paso 5 · Método de calibración', '¿Declara el método? ¿Es adecuado para el instrumento?',
      [['ok', 'Conforme: declara el método de calibración'], ['metodo', 'No declara el método de calibración']]],
    ['A6', 'Paso 6 · Condiciones de calibración', '¿Informa las condiciones en que se calibró?',
      [['ok', 'Conforme: informa las condiciones de la calibración'], ['condiciones', 'No informa las condiciones de la calibración (7.8.4.1 b)']]],
    ['A7', 'Paso 7 · Notas y observaciones', 'Lea todas las notas: ¿hay algo que el laboratorio no debería incluir?',
      [['ok', 'Conforme: las notas no contienen nada objetable'], ['intervalo', 'Recomienda un intervalo de calibración sin acuerdo con el cliente (7.8.4.3)']]],
    ['A8', 'Paso 8 · Resultados: error, as found y as left', 'Si hubo ajuste, deben aparecer los resultados antes (as found) y después (as left).',
      [['ok', 'Conforme: informa los errores (y el as found y el as left si hubo ajuste)'], ['asfound', 'Se ajustó, pero no informa los resultados antes del ajuste (as found)']]],
    ['A9', 'Paso 9 · Incertidumbre y CMC', '¿Declara k y el nivel de confianza? ¿La U es al menos la CMC del alcance?',
      [['ok', 'Conforme: U con su factor k y no menor que la CMC'], ['cmc', 'La U declarada es menor que la CMC del alcance acreditado']]],
    ['A10', 'Paso 10 · Declaración de conformidad', 'Si declara conformidad, ¿indica la especificación y la regla de decisión?',
      [['ok', 'Conforme: no la incluye, o la incluye con la especificación y la regla de decisión'], ['regla', 'Declara «cumple» sin indicar la especificación ni la regla de decisión (7.8.6)']]]
  ];
  var ESTRATEGIAS = [['usar', 'Usar la indicación sin corregir'], ['corregir', 'Corregir con el error del certificado'],
    ['ajustar', 'Ajustar el instrumento y usarlo con el estado as left'], ['nousar', 'No usarlo hasta resolver la causa (ajuste, reparación o una calibración válida y suficiente)']];
  var TRATAMIENTOS = [['rect', 'u = EMP/√3 (distribución rectangular)'], ['norm', 'u = U/k (distribución normal), más la deriva si aplica'],
    ['nuevo', 'La U del nuevo certificado, después de ajustar, reparar o recalibrar'], ['nada', 'No se incluye en el presupuesto de incertidumbre']];
  var DECISIONES = [['apto', 'Apto'], ['correccion', 'Apto con corrección'], ['noapto', 'No apto'], ['noconfirmar', 'No se puede confirmar con este certificado']];
  var INTERVALOS = [['ampliar', 'Ampliar el intervalo (escalera: ×1,25)'], ['mantener', 'Mantener el intervalo sin cambios'], ['reducir', 'Reducir el intervalo (escalera: ×0,75)'],
    ['mitad', 'Reducir el intervalo a la mitad (×0,5) y evaluar los resultados emitidos desde la calibración anterior'],
    ['aplazar', 'Aplazar la decisión: primero resolver los hallazgos críticos o la información que falta']];
  var ICONOS = { termometro: 'termometro', balanza: 'medalla', micropipeta: 'vaso' };

  function fecha(iso) {
    var p = String(iso).split('-');
    var meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return Number(p[2]) + ' de ' + meses[Number(p[1]) - 1] + ' de ' + p[0];
  }

  function fila(etq, valor) {
    return crear('div', { clase: 'doc-fila' }, [crear('span', { clase: 'etq', texto: etq }), crear('b', { texto: valor })]);
  }

  function seccion(titulo, hijos) {
    return crear('div', { clase: 'doc-seccion' }, [crear('h4', { texto: titulo })].concat(hijos));
  }

  function certificado(v) {
    var c = v.certificado;
    var cab = crear('div', { clase: 'doc-cab' }, [
      crear('div', { clase: 'doc-titulo' }, [crear('span', { clase: 'ico-tile' }, [C.icono('certificado')]),
        crear('div', null, [crear('h2', { texto: 'CERTIFICADO DE CALIBRACIÓN' }), crear('p', { texto: 'N.º ' + c.numero + ' · ' + c.laboratorio + ' (ficticio)' })])]),
      c.marca ? crear('span', { clase: 'sello-acred', 'data-tip': 'Símbolo de acreditación ONAC (simulado)' }, [C.icono('escudo'), 'ONAC · ISO/IEC 17025 · ' + c.codigo]) : null
    ]);
    var cuerpo = crear('div', { clase: 'doc-cuerpo' }, [
      seccion('Cliente e instrumento', [fila('Cliente', c.cliente), fila('Instrumento', c.instrumento), fila('Fabricante', c.fabricante),
        fila('Modelo', c.modelo), fila('Número de serie', c.serie)]),
      seccion('Fechas', [fila('Recepción del instrumento', fecha(c.recepcion)), fila('Calibración', fecha(c.calibracion)), fila('Emisión del certificado', fecha(c.emision))])
    ]);
    if (c.metodo) cuerpo.appendChild(seccion('Método de calibración', [crear('p', { clase: 'cert-texto', texto: c.metodo })]));
    if (c.condiciones) cuerpo.appendChild(seccion('Condiciones de calibración', [crear('p', { clase: 'cert-texto', texto: c.condiciones })]));
    if (c.trazabilidad) cuerpo.appendChild(seccion('Trazabilidad metrológica', [crear('p', { clase: 'cert-texto', texto: c.trazabilidad })]));

    var u = c.unidad;
    var cabTabla = ['Punto de calibración'].concat(c.columnas === 2 ? ['Error antes del ajuste (as found), ' + u, 'Error después del ajuste (as left), ' + u] : ['Error, ' + u])
      .concat(['U (k = ' + c.k + '), ' + u]);
    var tabla = crear('table', { clase: 'tabla-datos cert-tabla' }, [
      crear('thead', null, [crear('tr', null, cabTabla.map(function (t, i) { return crear('th', { clase: i ? 'n' : null, texto: t }); }))]),
      crear('tbody', null, c.puntos.map(function (p) {
        var celdas = [crear('td', { texto: p.punto })];
        if (c.columnas === 2) celdas.push(crear('td', { clase: 'n', texto: p.errorFound }));
        celdas.push(crear('td', { clase: 'n', texto: p.error }), crear('td', { clase: 'n', texto: p.U }));
        return crear('tr', null, celdas);
      }))
    ]);
    cuerpo.appendChild(seccion('Resultados', [crear('div', { clase: 'tabla-desliza' }, [tabla]),
      crear('p', { clase: 'cert-texto peq', texto: 'Error E = indicación del instrumento − valor de referencia. U es la incertidumbre expandida con k = ' + c.k +
        ', que corresponde a un nivel de confianza de aproximadamente 95 % (GUM).' })]));
    if (c.conformidad) cuerpo.appendChild(seccion('Declaración de conformidad', [crear('p', { clase: 'cert-conformidad', texto: c.conformidad })]));
    cuerpo.appendChild(seccion('Notas', [crear('ul', { clase: 'cert-notas' }, c.notas.map(function (n) { return crear('li', { texto: n }); }))]));
    cuerpo.appendChild(crear('div', { clase: 'cert-firma' }, [
      crear('div', null, [crear('small', { texto: 'Calibró' }), crear('b', { texto: 'Técnico de calibración' })]),
      crear('div', null, [crear('small', { texto: 'Aprobó' }), crear('b', { texto: 'Director técnico' })])
    ]));
    cuerpo.appendChild(crear('div', { clase: 'doc-pie' }, [C.icono('info'),
      crear('span', { texto: 'Documento ficticio para fines académicos. Laboratorio, código de acreditación y números son inventados.' })]));
    return crear('article', { clase: 'tarjeta documento certificado aparecer', 'aria-label': 'Certificado de calibración' }, [cab, cuerpo]);
  }

  function hojaVida(v) {
    var h = v.hojaVida;
    return crear('div', { clase: 'tarjeta hoja-vida aparecer', style: '--i:1' }, [
      crear('div', { clase: 'hoja-vida-cab' }, [C.icono('documento'), crear('b', { texto: 'HOJA DE VIDA DEL EQUIPO · ' + h.codigo }), crear('span', { texto: 'Laboratorio de Aguas del Oriente (ficticio)' })]),
      fila('Instrumento', h.instrumento), fila('Fabricante y modelo', h.fabricante + ' · ' + h.modelo), fila('Número de serie', h.serie),
      fila('Ubicación', h.ubicacion), fila('Intervalo de uso', h.uso), fila('Punto de uso crítico', h.puntoUso),
      fila('EMP requerido por el método (CMR)', h.emp), fila('¿Admite corregir lecturas?', h.corregible ? 'Sí' : 'No: entrega un volumen'),
      fila('Programa de calibración', 'Cada ' + h.programa), fila('Fecha de esta revisión', fecha(h.revision))
    ]);
  }

  function alcance(v) {
    var a = v.alcance;
    return crear('div', { clase: 'tarjeta aparecer', style: '--i:2' }, [
      crear('div', { clase: 'extracto' }, [
        crear('span', { clase: 'extracto-etq' }, [C.icono('buscar'), 'CONSULTA DEL ALCANCE ACREDITADO EN ONAC (SIMULADA)']),
        crear('span', null, [crear('b', { texto: a.laboratorio }), ' · código ' + a.codigo + ' · acreditación ', crear('b', { texto: a.estado.toLowerCase() })]),
        crear('span', { texto: 'Servicio: ' + a.servicio }),
        crear('span', null, ['Intervalo acreditado: ', crear('b', { texto: a.intervalo }), ' · CMC: ', crear('b', { texto: a.cmc })])
      ])
    ]);
  }

  function evidencias(v, abiertas) {
    var d = crear('details', { clase: 'evidencia-plegable tarjeta' }, [crear('summary', null, [C.icono('ojo'), 'Ver el certificado, la hoja de vida y el alcance']),
      certificado(v), hojaVida(v), alcance(v)]);
    if (abiertas) d.open = true;
    return d;
  }

  window.Motor.iniciar({
    id: 'P7',
    titulo: 'Revisión de un certificado de calibración',
    icono: 'certificado',
    etiqueta: 'Sesión 2 · Práctica 7',
    descripcion: 'Aplique la lista de chequeo de 10 + 1 pasos a un certificado de calibración, lea sus resultados y decida si el equipo queda confirmado para su uso.',
    meta: [['usuario', 'Trabajo individual'], ['medalla', '100 puntos · calificación automática'], ['libro', 'ISO/IEC 17025 7.8 · CEA-3.0-02 · ILAC G8']],
    notaRegistro: 'Cada estudiante recibe un certificado distinto, con hallazgos distintos.',
    comoFunciona: [
      'Lea el certificado junto con la hoja de vida del equipo y la consulta del alcance acreditado.',
      'Recorra los 10 pasos de la lista de chequeo y elija la situación que encuentra en cada uno.',
      'Lea los resultados en el punto de uso: valor corregido, u = U/k y |E| + U frente al EMP.',
      'Decida cómo usar la información (paso +1), si el equipo queda confirmado y qué hacer con el intervalo. Revise y envíe.'
    ],
    partes: [
      { id: 'A', titulo: 'Chequeo', nombre: 'A · Lista de chequeo de 10 pasos', icono: 'lista', tono: 'cielo', pts: 40, resumen: 'Un hallazgo (o «conforme») por paso.' },
      { id: 'B', titulo: 'Resultados', nombre: 'B · Lectura de resultados', icono: 'regla', tono: 'violeta', pts: 25, resumen: 'Valor corregido, u = U/k y |E| + U.' },
      { id: 'C', titulo: 'Paso +1', nombre: 'C · Cómo usar la información', icono: 'convertir', tono: 'esmeralda', pts: 20, resumen: 'Estrategia y tratamiento de la incertidumbre.' },
      { id: 'D', titulo: 'Decisión', nombre: 'D · Confirmación e intervalo', icono: 'insignia', tono: 'coral', pts: 15, resumen: 'Decisión de confirmación y siguiente intervalo.' }
    ],
    varianteDemo: {
      instrumento: 'termometro', unidad: '°C',
      certificado: { numero: 'MI-2826-77', laboratorio: 'Metrología Integral S. A. S.', codigo: '16-LAC-042', marca: true,
        trazabilidad: 'Los resultados son trazables al Sistema Internacional de Unidades (SI) mediante patrones calibrados por institutos nacionales de metrología y laboratorios acreditados.',
        cliente: 'Laboratorio de Aguas del Oriente (ficticio)', instrumento: 'Termómetro digital', fabricante: 'TermoLab', modelo: 'TD-210', serie: 'SN-237523',
        recepcion: '2026-08-12', calibracion: '2026-08-15', emision: '2026-08-21', metodo: '', condiciones: '', unidad: '°C', columnas: 2, k: 2,
        puntos: [{ punto: '30,0 °C', error: '+0,05', U: '0,69', errorFound: '+0,01' }, { punto: '37,0 °C', error: '+0,16', U: '0,77', errorFound: '+0,86' },
          { punto: '45,0 °C', error: '−0,12', U: '0,88', errorFound: '−0,11' }],
        conformidad: '', notas: ['El sensor se sumergió 10 cm y se dejó estabilizar 10 min en cada punto.', 'Se realizó ajuste del instrumento durante el servicio.',
          'Se recomienda recalibrar el instrumento en 12 meses.', 'Este certificado no podrá reproducirse parcialmente sin autorización escrita del laboratorio.'] },
      alcance: { laboratorio: 'Metrología Integral S. A. S.', codigo: '16-LAC-042', servicio: 'Termómetros de indicación digital, por comparación',
        intervalo: '−30 °C a 150 °C', cmc: '0,05 °C', estado: 'Vigente' },
      hojaVida: { codigo: 'TD-INC-02', instrumento: 'Termómetro digital', fabricante: 'TermoLab', modelo: 'TD-210', serie: 'SN-237523',
        ubicacion: 'Incubadora de cultivos INC-02', uso: '30 °C a 40 °C', puntoUso: '37,0 °C', emp: '±0,50 °C', corregible: true, programa: '12 meses', revision: '2026-10-22' },
      textoB1: 'En la incubadora, el termómetro indica 37,1 °C. ¿Cuál es la temperatura corregida?', unidadB1: '°C'
    },
    respuestasVacias: function () { return { A: {}, B: {}, C: {}, D: {} }; },

    pintar: {
      A: function (panel, h) {
        var v = h.estado.variante;
        panel.appendChild(h.encabezado('A', 'Lea el certificado, la hoja de vida y el alcance; luego, en la lista de chequeo, elija la situación que encuentra en cada paso. Un paso sin hallazgos es «conforme».'));
        var pasos = crear('div', { clase: 'pasos-chequeo' });
        PASOS.forEach(function (p, i) {
          pasos.appendChild(crear('div', { clase: 'paso-chequeo' }, [
            crear('div', { clase: 'paso-guia' }, [crear('span', { clase: 'paso-n', texto: String(i + 1) }), crear('span', { texto: p[2] })]),
            h.seleccion('A', p[0], p[1], p[3], { columnas: 1 })
          ]));
        });
        panel.appendChild(crear('div', { clase: 'rejilla-a rejilla-cert' }, [
          crear('div', { clase: 'pila-docs' }, [certificado(v), hojaVida(v), alcance(v)]),
          crear('aside', { clase: 'lateral tarjeta', 'aria-label': 'Lista de chequeo' }, [
            crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile chico' }, [C.icono('lista')]),
              crear('div', null, [crear('h3', { texto: 'Lista de chequeo' }), crear('span', { clase: 'suave peq', texto: '4 puntos por paso' })])]),
            pasos
          ])
        ]));
      },
      B: function (panel, h) {
        var v = h.estado.variante, hv = v.hojaVida;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'violeta' });
        cont.appendChild(h.encabezado('B', 'Trabaje en el punto de uso crítico (' + hv.puntoUso + ') con los valores que declara el certificado; si hubo ajuste, use el estado as left. Se acepta ±1 en el último dígito.'));
        cont.appendChild(evidencias(v));
        cont.appendChild(h.ejercicio(ICONOS[v.instrumento] || 'regla', 'B1 · Valor corregido', 9, [v.textoB1],
          [h.respuesta('B', 'B1', 'Valor corregido', v.unidadB1)], 1));
        cont.appendChild(h.ejercicio('regla', 'B2 · Incertidumbre estándar', 8, ['Calcule u = U/k en el punto de uso (', h.dato(hv.puntoUso), ').'],
          [h.respuesta('B', 'B2', 'u', v.unidad, { placeholder: 'Con un decimal más que U' })], 2));
        cont.appendChild(h.ejercicio('insignia', 'B3 · ¿|E| + U ≤ EMP?', 8, ['EMP requerido: ', h.dato(hv.emp), '. Use el error y la U del punto de uso.'],
          [h.seleccion('B', 'B3', 'Respuesta', [['si', 'Sí'], ['no', 'No']], { columnas: 2 })], 3));
        panel.appendChild(cont);
      },
      C: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'esmeralda' });
        cont.appendChild(h.encabezado('C', 'Paso +1 (diapositiva 83): decida cómo usará la información del certificado y cómo entra en su presupuesto de incertidumbre.'));
        cont.appendChild(evidencias(v));
        cont.appendChild(h.ejercicio('convertir', 'C1 · Estrategia', 10, ['Con todo lo revisado (hallazgos y resultados), ¿cómo usará el instrumento en el punto de uso?'],
          [h.seleccion('C', 'C1', 'Estrategia', ESTRATEGIAS, { columnas: 1 })], 1));
        cont.appendChild(h.ejercicio('regla', 'C2 · Tratamiento de la incertidumbre', 10, ['Debe ser coherente con la estrategia que eligió en C1.'],
          [h.seleccion('C', 'C2', 'Tratamiento', TRATAMIENTOS, { columnas: 1 })], 2));
        panel.appendChild(cont);
      },
      D: function (panel, h) {
        var v = h.estado.variante;
        var cont = crear('div', { clase: 'ejercicios', 'data-tono': 'coral' });
        cont.appendChild(h.encabezado('D', 'Cierre de la revisión: registre la decisión de confirmación y la decisión sobre el intervalo.'));
        cont.appendChild(crear('div', { clase: 'regla-decision aparecer' }, [
          crear('div', { clase: 'zona ok' }, [C.icono('checkCirculo'), crear('b', { texto: 'Apto' }), crear('span', { texto: '|E| + U ≤ EMP' })]),
          crear('div', { clase: 'zona corr' }, [C.icono('lapiz'), crear('b', { texto: 'Apto con corrección' }), crear('span', { texto: '|E| + U > EMP · U ≤ EMP · admite corregir' })]),
          crear('div', { clase: 'zona no' }, [C.icono('xCirculo'), crear('b', { texto: 'No apto' }), crear('span', { texto: 'Los demás casos' })])
        ]));
        cont.appendChild(evidencias(v));
        cont.appendChild(h.ejercicio('insignia', 'D1 · Decisión de confirmación metrológica', 8,
          ['Tenga en cuenta los hallazgos de los pasos 1 a 4: si alguno falla, el certificado no sirve para confirmar el equipo.'],
          [h.seleccion('D', 'D1', 'Decisión', DECISIONES, { columnas: 2 })], 1));
        cont.appendChild(h.ejercicio('calendario', 'D2 · Decisión sobre el intervalo de calibración', 7,
          ['Use el resultado as found en el punto de uso y la escalera de la diapositiva 51 (|E| ≤ 0,8·EMP; ≤ EMP; > EMP).'],
          [h.seleccion('D', 'D2', 'Intervalo', INTERVALOS, { columnas: 1 })], 2));
        panel.appendChild(cont);
      }
    },

    avance: function (r, h) {
      var idsA = PASOS.map(function (p) { return p[0]; });
      var nA = h.llenos('A', idsA), nB = h.llenos('B', ['B1', 'B2', 'B3']), nC = h.llenos('C', ['C1', 'C2']), nD = h.llenos('D', ['D1', 'D2']);
      var faltan = (10 - nA) + (3 - nB) + (2 - nC) + (2 - nD);
      return {
        fraccion: { A: nA / 10, B: nB / 3, C: nC / 2, D: nD / 2 },
        sub: { A: nA + ' de 10', B: nB + ' de 3', C: nC + ' de 2', D: nD + ' de 2' },
        revision: [
          [nA === 10, 'lista', 'Parte A: ' + nA + ' de 10 pasos', nA < 10 ? 'Hay pasos sin revisar.' : 'Completa.'],
          [nB === 3, 'regla', 'Parte B: ' + nB + ' de 3 resultados', nB < 3 ? 'Hay cálculos vacíos.' : 'Completa.'],
          [nC === 2, 'convertir', 'Parte C: ' + nC + ' de 2 respuestas', nC < 2 ? 'Elija la estrategia y el tratamiento.' : 'Completa.'],
          [nD === 2, 'insignia', 'Parte D: ' + nD + ' de 2 decisiones', nD < 2 ? 'Registre las dos decisiones.' : 'Completa.']
        ],
        faltan: faltan ? 'Tiene ' + faltan + ' respuestas sin completar.' : ''
      };
    },

    apoyo: function (cont) {
      cont.appendChild(crear('h3', null, [C.icono('lista'), 'Lista de chequeo (10 + 1 pasos)']));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>1. Trazabilidad</td><td>Marca, alcance y declaración (CEA-3.0-02)</td></tr>' +
        '<tr><td>2. Identidad</td><td>Fabricante, modelo y serie</td></tr>' +
        '<tr><td>3. Fecha</td><td>Se cuenta desde la calibración</td></tr>' +
        '<tr><td>4. Alcance</td><td>Acreditado ⊇ calibrado ⊇ uso</td></tr>' +
        '<tr><td>5. Método</td><td>Declarado y adecuado</td></tr>' +
        '<tr><td>6. Condiciones</td><td>7.8.4.1 b</td></tr>' +
        '<tr><td>7. Notas</td><td>Sin intervalo recomendado (7.8.4.3)</td></tr>' +
        '<tr><td>8. Resultados</td><td>As found y as left (7.8.4.1 d)</td></tr>' +
        '<tr><td>9. Incertidumbre</td><td>k, nivel de confianza; U ≥ CMC</td></tr>' +
        '<tr><td>10. Conformidad</td><td>Especificación y regla (7.8.6)</td></tr>' +
        '<tr><td>+1. Uso</td><td>Corregir o no, y su incertidumbre</td></tr>' }));
      cont.appendChild(crear('h3', null, [C.icono('convertir'), 'Paso +1: usar la información']));
      cont.appendChild(crear('div', { clase: 'tips-redondeo', html:
        '<div><b>Sin corregir:</b> el error queda cubierto por el EMP, que entra como fuente tipo B rectangular.</div>' +
        '<div><b>Corrigiendo:</b> se resta el error del certificado y entra su U (normal, U/k) más la deriva entre calibraciones.</div>' +
        '<div><b>Ajustar, reparar o recalibrar:</b> se usa la información del nuevo certificado.</div>' }));
      cont.appendChild(crear('h3', null, [C.icono('calendario'), 'Escalera (diapositiva 51)']));
      cont.appendChild(crear('table', { clase: 'tabla-mini', html:
        '<tr><td>|E| ≤ 0,8·EMP</td><td>×1,25</td></tr><tr><td>0,8·EMP &lt; |E| ≤ EMP</td><td>×0,75</td></tr><tr><td>|E| &gt; EMP</td><td>×0,5 y 7.10</td></tr>' }));
    }
  });
})();
