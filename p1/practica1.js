// Práctica 1 · Cazadores de errores del SI — lógica de la página.
// Código PÚBLICO: contiene el informe (con sus errores, que son el ejercicio) y la
// interfaz. La clave de respuestas y la calificación están solo en Apps Script.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;
  var PRACTICA = 'P1';
  var CLAVE_BORRADOR = 'practicas:p1:borrador';
  var CLAVE_ENVIO = 'practicas:p1:envio';
  var CIRCUNFERENCIA = 540.35;

  // ---------------------------------------------------------------------------
  // Contenido
  // ---------------------------------------------------------------------------

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

  // Cada valor clicable tiene un id; los demás textos son fijos.
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

  var PASOS = [
    { id: 'A', titulo: 'Informe', icono: 'buscar', tono: 'ambar', pts: 45 },
    { id: 'B', titulo: 'Redondeo', icono: 'redondeo', tono: 'violeta', pts: 20 },
    { id: 'C', titulo: 'Conversión', icono: 'convertir', tono: 'cielo', pts: 20 },
    { id: 'D', titulo: 'Reflexión', icono: 'mensaje', tono: 'rosa', pts: 15 },
    { id: 'R', titulo: 'Enviar', icono: 'enviar', tono: 'esmeralda' }
  ];

  // Valores de ejemplo para el modo demostración (no son los de ningún estudiante real)
  var VARIANTE_DEMO = {
    B1: { valor: '7,2412', intervalo: '0,01' },
    B2: { valor: '4,505', intervalo: '0,01' },
    B3: { valor: '71,548', dosEtapas: '71,6' },
    B4: { magnitud: 'concentración másica de nitratos (NO₃⁻) en agua', unidad: 'mg/L', y: '21,018 78', U: '0,5708' },
    C1: { p: '15,3', U: '0,5' },
    C2: { t: '115,0', U: '0,6' },
    C3: { v: '6,0' }
  };

  // ---------------------------------------------------------------------------
  // Estado y utilidades
  // ---------------------------------------------------------------------------

  var estado = null;      // { nombre, correo, inicio, variante, idCliente, respuestas, pestana }
  var reloj = null;
  var temporizadorGuardado = null;

  function $(id) { return document.getElementById(id); }
  function respuestasVacias() { return { A: {}, B: {}, C: {}, D: { reflexion: '' } }; }

  function errorEn(id, mensaje) {
    var el = $(id);
    el.querySelector('p').textContent = mensaje || '';
    el.hidden = !mensaje;
    if (mensaje) { el.classList.remove('sacudir'); void el.offsetWidth; el.classList.add('sacudir'); }
  }

  function guardarBorrador() {
    if (!estado) return;
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(function () {
      var ok = C.almacen.guardar(CLAVE_BORRADOR, estado);
      var chip = $('guardado');
      chip.querySelector('.txt').textContent = ok ? 'Guardado' : 'Sin guardado local';
      chip.classList.remove('activo'); void chip.offsetWidth; chip.classList.add('activo');
    }, 300);
  }

  function ocupado(boton, si) {
    boton.classList.toggle('cargando', si);
    boton.disabled = si;
  }

  function simular(datos) {
    if (datos.accion === 'iniciar') {
      return { ok: true, practica: PRACTICA, nombre: datos.nombre, correo: datos.correo.trim().toLowerCase(),
        inicio: new Date().toISOString(), variante: VARIANTE_DEMO };
    }
    if (datos.accion === 'enviar') {
      console.info('Modo demostración. Esto es lo que se enviaría al servidor:', datos);
      return { ok: true, idEnvio: 'demo', codigo: 'DEMO42', retroalimentacion: 'ninguna' };
    }
    return { ok: false, codigo: 'NO_DISPONIBLE', mensaje: 'En modo demostración no hay resultados para consultar.' };
  }

  // ---------------------------------------------------------------------------
  // Pantallas
  // ---------------------------------------------------------------------------

  function mostrar(pantalla) {
    ['inicio', 'taller', 'enviado', 'consulta'].forEach(function (p) { $('pantalla-' + p).hidden = p !== pantalla; });
    var taller = pantalla === 'taller';
    $('chip-reloj').hidden = !taller;
    $('guardado').hidden = !taller;
    $('abrir-apoyo').hidden = !taller;
    $('progreso-global').hidden = !taller;
    document.body.classList.toggle('con-pasos', taller);
    window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var destino = e.target.closest('[data-ir]');
    if (!destino) return;
    var ir = destino.getAttribute('data-ir');
    if (ir === 'consulta') prepararConsulta();
    if (ir === 'inicio') prepararInicio();
    mostrar(ir);
  });

  // ---------------------------------------------------------------------------
  // Disponibilidad de la práctica (la decide la hoja de Google)
  // ---------------------------------------------------------------------------

  var MENSAJES_BLOQUEO = {
    proximamente: { icono: 'candado', tono: 'indigo', titulo: 'Esta práctica aún no está habilitada',
      texto: 'El docente la habilitará a medida que avance el curso. Vuelva al portal para ver las prácticas disponibles.' },
    programada: { icono: 'reloArena', tono: 'ambar', titulo: 'Esta práctica está programada' },
    cerrada: { icono: 'prohibido', tono: 'rosa', titulo: 'Esta práctica ya cerró',
      texto: 'El plazo para desarrollarla terminó.' }
  };

  function pintarBloqueo(info) {
    var m = MENSAJES_BLOQUEO[info.estado];
    if (!m) return;
    $('zona-registro').hidden = true;
    var texto = info.estado === 'programada' ? 'Se habilita el ' + C.fecha(info.abreDesde) + '.' : m.texto;
    var acciones = [crear('a', { clase: 'btn btn-primario', href: '../' }, [C.icono('casa'), 'Ir al portal'])];
    if (info.resultados) {
      var b = crear('button', { type: 'button', clase: 'btn', 'data-ir': 'consulta' }, [C.icono('medalla'), 'Consultar mi nota']);
      acciones.unshift(b);
      texto += ' Ya puede consultar su nota con su correo y su código.';
    }
    var cont = $('estado-practica');
    cont.textContent = '';
    cont.appendChild(crear('div', { clase: 'tarjeta bloqueo aparecer', 'data-tono': m.tono }, [
      crear('span', { clase: 'ico-tile' }, [C.icono(m.icono)]),
      crear('h2', { texto: m.titulo }),
      crear('p', { clase: 'suave', texto: texto }),
      crear('div', { clase: 'acciones', style: 'justify-content:center' }, acciones)
    ]));
  }

  async function verificarDisponibilidad() {
    var boton = $('boton-comenzar');
    ocupado(boton, true);
    var r = await C.llamar({ accion: 'estado' });
    ocupado(boton, false);
    if (!r.ok) return;   // sin conexión: el servidor vuelve a validar al iniciar
    var info = (r.practicas || []).filter(function (p) { return p.id === PRACTICA; })[0];
    if (info && info.estado !== 'abierta') pintarBloqueo(info);
  }

  // ---------------------------------------------------------------------------
  // Portada y registro
  // ---------------------------------------------------------------------------

  function prepararInicio() {
    var envio = C.almacen.leer(CLAVE_ENVIO);
    if (envio && envio.codigo) {
      $('aviso-enviado').hidden = false;
      $('texto-enviado').textContent = 'Desde este navegador ya se envió la práctica a nombre de ' + envio.nombre +
        '. Su código de consulta es ' + envio.codigo + '.';
    } else {
      $('aviso-enviado').hidden = true;
    }
    var b = C.almacen.leer(CLAVE_BORRADOR);
    $('aviso-borrador').hidden = !(b && b.variante && b.correo);
    if (b && b.correo) $('texto-borrador').textContent = 'Tiene una práctica sin enviar a nombre de ' + b.nombre + ' (' + b.correo + ').';
  }

  $('continuar-borrador').addEventListener('click', function () {
    var b = C.almacen.leer(CLAVE_BORRADOR);
    if (!b) return;
    estado = b;
    abrirTaller();
    C.toast('Continuamos donde iba', 'exito', 'reanudar');
  });

  $('descartar-borrador').addEventListener('click', function () {
    if (!confirm('¿Descartar el trabajo guardado en este navegador? No se puede recuperar.')) return;
    C.almacen.borrar(CLAVE_BORRADOR);
    prepararInicio();
    C.toast('Borrador descartado', 'info', 'papelera');
  });

  var PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  $('form-registro').addEventListener('submit', async function (e) {
    e.preventDefault();
    var nombre = $('nombre').value.replace(/\s+/g, ' ').trim();
    var correo = $('correo').value.trim().toLowerCase();
    var correo2 = $('correo2').value.trim().toLowerCase();
    if (nombre.length < 3) return errorEn('error-registro', 'Escriba su nombre completo.');
    if (!PATRON_CORREO.test(correo)) return errorEn('error-registro', 'Escriba un correo válido.');
    if (correo !== correo2) return errorEn('error-registro', 'Los dos correos no coinciden.');
    if (!$('autoriza').checked) return errorEn('error-registro', 'Debe autorizar el tratamiento de sus datos para continuar.');
    errorEn('error-registro', '');

    var boton = $('boton-comenzar');
    ocupado(boton, true);
    var r = await C.llamar({ accion: 'iniciar', practica: PRACTICA, nombre: nombre, correo: correo, autorizaDatos: true }, simular);
    ocupado(boton, false);
    if (!r.ok) return errorEn('error-registro', r.mensaje || 'No fue posible iniciar la práctica.');

    var previo = C.almacen.leer(CLAVE_BORRADOR);
    var mismo = previo && previo.correo === r.correo;
    estado = {
      nombre: r.nombre, correo: r.correo, inicio: mismo ? previo.inicio : r.inicio, variante: r.variante,
      idCliente: mismo ? previo.idCliente : C.uuid(),
      respuestas: mismo ? previo.respuestas : respuestasVacias(), pestana: 'A'
    };
    guardarBorrador();
    abrirTaller();
    C.toast('¡Éxitos, ' + r.nombre.split(' ')[0] + '!', 'exito', 'destellos');
  });

  // ---------------------------------------------------------------------------
  // Taller
  // ---------------------------------------------------------------------------

  function abrirTaller() {
    clearInterval(reloj);
    reloj = C.iniciarReloj($('reloj'), estado.inicio);
    pintarPasos();
    pintarInforme();
    pintarListaErrores();
    pintarEjercicios();
    $('reflexion').value = estado.respuestas.D.reflexion || '';
    actualizarReflexion();
    agregarNavegacion();
    mostrar('taller');
    actualizarAvance();
    elegirPestana(estado.pestana || 'A');
  }

  function pintarPasos() {
    var nav = $('pasos');
    nav.textContent = '';
    PASOS.forEach(function (p) {
      var b = crear('button', { type: 'button', role: 'tab', id: 'paso-' + p.id, clase: 'paso', 'data-tono': p.tono,
        'aria-controls': 'panel-' + p.id, 'aria-selected': 'false',
        'data-tip': p.pts ? 'Parte ' + p.id + ' · ' + p.pts + ' puntos' : 'Revise su avance y envíe' }, [
        crear('span', { clase: 'ico-tile' }, [C.icono(p.icono)]),
        crear('span', { clase: 'paso-texto' }, [
          crear('b', null, [p.id === 'R' ? null : crear('span', { clase: 'paso-letra', texto: p.id + ' · ' }), p.titulo]),
          crear('span', { id: 'sub-' + p.id })
        ]),
        crear('span', { clase: 'paso-barra' }, [crear('i', { id: 'barra-' + p.id })])
      ]);
      nav.appendChild(b);
    });
  }

  $('pasos').addEventListener('click', function (e) {
    var b = e.target.closest('.paso');
    if (b) elegirPestana(b.id.slice(5));
  });
  $('pasos').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var orden = PASOS.map(function (p) { return p.id; });
    var i = orden.indexOf(estado.pestana) + (e.key === 'ArrowRight' ? 1 : -1);
    var p = orden[(i + orden.length) % orden.length];
    elegirPestana(p);
    $('paso-' + p).focus();
  });

  function elegirPestana(p) {
    PASOS.forEach(function (x) {
      $('paso-' + x.id).setAttribute('aria-selected', String(x.id === p));
      var panel = $('panel-' + x.id);
      var antes = panel.hidden;
      panel.hidden = x.id !== p;
      if (antes && !panel.hidden) { panel.classList.remove('panel'); void panel.offsetWidth; panel.classList.add('panel'); }
    });
    if (p === 'R') pintarRevision();
    estado.pestana = p;
    guardarBorrador();
    var arriba = Math.max(0, $('pantalla-taller').offsetTop - 8);
    if (window.scrollY > arriba) window.scrollTo({ top: arriba, behavior: C.sinMovimiento ? 'auto' : 'smooth' });
  }

  /** Botones «Anterior / Siguiente» al final de cada parte. */
  function agregarNavegacion() {
    PASOS.forEach(function (p, i) {
      if (p.id === 'R') return;
      var panel = $('panel-' + p.id);
      var viejo = panel.querySelector('.navegacion');
      if (viejo) viejo.remove();
      var sig = PASOS[i + 1];
      var hijos = [];
      if (i > 0) {
        var ant = crear('button', { type: 'button', clase: 'btn' }, [C.icono('flechaIzq'), 'Anterior']);
        ant.addEventListener('click', function () { elegirPestana(PASOS[i - 1].id); });
        hijos.push(ant);
      }
      var bsig = crear('button', { type: 'button', clase: 'btn btn-primario' }, [
        sig.id === 'R' ? 'Revisar y enviar' : 'Siguiente: ' + sig.titulo, C.icono('flecha', 'icono-mover')]);
      bsig.addEventListener('click', function () { elegirPestana(sig.id); });
      hijos.push(bsig);
      panel.appendChild(crear('div', { clase: 'acciones navegacion', style: 'justify-content:flex-end' }, hijos));
    });
  }

  $('abrir-apoyo').addEventListener('click', function () { abrirCajon(true); });
  $('cerrar-apoyo').addEventListener('click', function () { abrirCajon(false); });
  $('cajon-fondo').addEventListener('click', function () { abrirCajon(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') abrirCajon(false); });

  function abrirCajon(abrir) {
    $('cajon').classList.toggle('abierto', abrir);
    $('cajon').setAttribute('aria-hidden', String(!abrir));
    $('cajon-fondo').classList.toggle('visible', abrir);
    if (abrir) $('cerrar-apoyo').focus();
  }

  // --- Parte A: informe -------------------------------------------------------

  function marcados() { return ORDEN_A.filter(function (id) { return estado.respuestas.A[id]; }); }

  function nombreRegla(id) {
    for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i][0] === id) return REGLAS[i][1];
    return '';
  }

  function botonValor(campo) {
    var r = estado.respuestas.A[campo.id];
    var b = crear('button', { type: 'button', clase: 'valor' + (r ? ' marcado' : ''), 'data-campo': campo.id,
      'aria-label': ETIQUETAS[campo.id] + ': ' + campo.v + (r ? ' (marcado como error)' : ''),
      'data-tip': r ? 'Marcado: ' + r.regla + ' → ' + r.correccion + ' · clic para editar' : 'Clic para revisar este valor' },
    [crear('span', { texto: campo.v }), C.icono('buscar', 'lupa')]);
    if (r) b.appendChild(crear('span', { clase: 'valor-num', texto: String(marcados().indexOf(campo.id) + 1) }));
    return b;
  }

  function pintarInforme() {
    var inf = $('informe');
    inf.textContent = '';
    inf.appendChild(crear('div', { clase: 'doc-cab' }, [
      crear('div', { clase: 'doc-titulo' }, [
        crear('span', { clase: 'ico-tile', 'data-tono': 'esmeralda' }, [C.icono('matraz')]),
        crear('div', null, [
          crear('h2', { texto: 'Informe de resultados N.º IR-2026-0815' }),
          crear('p', { texto: 'Laboratorio de aguas · Cliente: Acueducto municipal · Emitido el 2026-10-20' })
        ])
      ]),
      crear('span', { clase: 'sello' }, [C.icono('alerta'), 'Documento ficticio'])
    ]));
    var cuerpo = crear('div', { clase: 'doc-cuerpo' });
    INFORME.forEach(function (s) {
      var sec = crear('section', { clase: 'doc-seccion' }, [crear('h4', { texto: s.titulo })]);
      if (s.filas) {
        s.filas.forEach(function (f) {
          sec.appendChild(crear('div', { clase: 'doc-fila' }, [
            crear('span', { clase: 'etq', texto: f[0] }),
            crear('span', null, [typeof f[1] === 'object' ? botonValor(f[1]) : f[1]])
          ]));
        });
      } else {
        var tabla = crear('table', { clase: 'doc-tabla' });
        tabla.appendChild(crear('thead', null, [crear('tr', null, [
          crear('th', { texto: 'Parámetro' }), crear('th', { texto: 'Resultado' }), crear('th', { texto: 'Método' })
        ])]));
        var tb = crear('tbody');
        s.tabla.forEach(function (f) {
          tb.appendChild(crear('tr', null, [
            crear('td', { texto: f[0] }),
            crear('td', null, [botonValor(f[1]), f[2]]),
            crear('td', { texto: f[3] })
          ]));
        });
        tabla.appendChild(tb);
        sec.appendChild(tabla);
      }
      cuerpo.appendChild(sec);
    });
    cuerpo.appendChild(crear('div', { clase: 'doc-pie' }, [C.icono('info'), crear('span', { texto:
      'Valor máximo aceptable de plomo en agua para consumo humano: 0,01 mg/L (Resolución 2115 de 2007). ' +
      'La incertidumbre expandida se declara con k = 2, para un nivel de confianza de aproximadamente 95 %.' })]));
    inf.appendChild(cuerpo);
  }

  $('informe').addEventListener('click', function (e) {
    var b = e.target.closest('[data-campo]');
    if (b) abrirEditor(b.getAttribute('data-campo'));
  });

  function pintarListaErrores() {
    var lista = $('lista-errores');
    lista.textContent = '';
    var ids = marcados();
    $('n-errores').textContent = ids.length;
    if (!ids.length) {
      lista.appendChild(crear('li', { clase: 'vacio' }, [C.icono('buscar'),
        crear('span', { texto: 'Aún no ha marcado errores. Haga clic en un valor del informe para empezar.' })]));
      return;
    }
    ids.forEach(function (id, i) {
      var r = estado.respuestas.A[id];
      var editar = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Editar', 'aria-label': 'Editar ' + ETIQUETAS[id] }, [C.icono('lapiz')]);
      editar.addEventListener('click', function () { abrirEditor(id); });
      var quitar = crear('button', { type: 'button', clase: 'btn-icono', 'data-tip': 'Quitar la marca', 'aria-label': 'Quitar la marca de ' + ETIQUETAS[id] }, [C.icono('papelera')]);
      quitar.addEventListener('click', function () {
        delete estado.respuestas.A[id];
        refrescarA();
        C.toast('Marca quitada', 'info', 'papelera');
      });
      lista.appendChild(crear('li', { clase: 'error-item', style: 'animation-delay:' + (i * 30) + 'ms' }, [
        crear('span', { clase: 'valor-num', texto: String(i + 1) }),
        crear('div', { style: 'min-width:0' }, [
          crear('div', { clase: 'campo-nombre', texto: ETIQUETAS[id] }),
          crear('div', { clase: 'cambio' }, [
            crear('span', { clase: 'antes', texto: VALORES[id] }), C.icono('flecha'),
            crear('span', { clase: 'despues', texto: r.correccion }),
            crear('span', { clase: 'regla-pill', texto: r.regla, 'data-tip': nombreRegla(r.regla) })
          ])
        ]),
        crear('div', { clase: 'botones-item' }, [editar, quitar])
      ]));
    });
  }

  function refrescarA() {
    guardarBorrador();
    pintarInforme();
    pintarListaErrores();
    actualizarAvance();
  }

  // --- Editor (diálogo) ---------------------------------------------------------

  var editorCampo = null;

  (function prepararEditor() {
    var grid = $('editor-reglas');
    REGLAS.forEach(function (r) {
      grid.appendChild(crear('label', { clase: 'regla-opcion', 'data-tip': 'Ejemplo incorrecto: ' + r[2] }, [
        crear('input', { type: 'radio', name: 'regla', value: r[0] }),
        crear('span', null, [crear('b', { texto: r[0] }), r[1]])
      ]));
    });
    var cuerpo = $('form-editor');
    $('editor-simbolos').appendChild(C.barraSimbolos(cuerpo));
    C.recordarFoco(cuerpo);
  })();

  function reglaElegida() {
    var x = document.querySelector('#editor-reglas input:checked');
    return x ? x.value : '';
  }

  function abrirEditor(id) {
    editorCampo = id;
    var r = estado.respuestas.A[id];
    $('editor-titulo').textContent = ETIQUETAS[id];
    $('editor-original').textContent = VALORES[id];
    document.querySelectorAll('#editor-reglas input').forEach(function (x) { x.checked = !!r && x.value === r.regla; });
    $('editor-correccion').value = r ? r.correccion : '';
    $('editor-quitar').hidden = !r;
    $('editor-guardar').querySelector('span').textContent = r ? 'Guardar cambios' : 'Marcar como error';
    $('error-editor').hidden = true;
    $('editor').showModal();
    var elegido = document.querySelector('#editor-reglas input:checked') || document.querySelector('#editor-reglas input');
    elegido.focus();
  }

  $('form-editor').addEventListener('submit', function (e) {
    var accion = e.submitter ? e.submitter.value : 'cancelar';
    if (accion === 'guardar') {
      var regla = reglaElegida();
      var correccion = $('editor-correccion').value.trim();
      if (!regla || !correccion) {
        e.preventDefault();
        errorEn('error-editor', 'Elija la regla y escriba la versión corregida. Si duda de la regla, elija la más cercana.');
        return;
      }
      var nuevo = !estado.respuestas.A[editorCampo];
      estado.respuestas.A[editorCampo] = { regla: regla, correccion: correccion };
      C.toast(nuevo ? 'Error marcado: ' + VALORES[editorCampo] : 'Cambios guardados', 'exito', nuevo ? 'buscar' : 'check');
    } else if (accion === 'quitar') {
      delete estado.respuestas.A[editorCampo];
      C.toast('Marca quitada', 'info', 'papelera');
    } else {
      return;
    }
    refrescarA();
  });

  $('editor').addEventListener('close', function () {
    var b = document.querySelector('[data-campo="' + editorCampo + '"]');
    if (b) b.focus({ preventScroll: true });
  });

  // --- Partes B y C ----------------------------------------------------------------

  function dato(texto) { return crear('span', { clase: 'dato', texto: texto }); }

  function respuesta(parte, item, etiqueta, unidad, ancha) {
    var id = 'resp-' + item;
    var valor = estado.respuestas[parte][item] || '';
    var input = crear('input', { type: 'text', id: id, 'data-parte': parte, 'data-item': item, autocomplete: 'off',
      spellcheck: 'false', maxlength: ancha ? '60' : '30', inputmode: ancha ? 'text' : 'decimal',
      placeholder: ancha ? 'Ej.: (12,3 ± 0,4) mg/L' : 'Use coma decimal' });
    input.value = valor;
    var grupo = crear('span', { clase: 'grupo-entrada' }, [input]);
    if (unidad) grupo.appendChild(crear('span', { clase: 'unidad', texto: unidad }));
    return crear('div', { clase: 'respuesta' + (ancha ? ' ancha' : '') }, [
      crear('label', { for: id, texto: etiqueta }), grupo,
      crear('span', { clase: 'estado-campo' + (valor.trim() ? ' lleno' : ''), id: 'ok-' + item, 'aria-hidden': 'true' }, [C.icono('check')])
    ]);
  }

  function ejercicio(icono, titulo, pts, enunciado, filas, i) {
    return crear('div', { clase: 'tarjeta ejercicio aparecer', style: '--i:' + i }, [
      crear('div', { clase: 'ejercicio-cab' }, [
        crear('span', { clase: 'ico-tile chico' }, [C.icono(icono)]),
        crear('h3', { texto: titulo }),
        crear('span', { clase: 'pts', texto: pts + ' pts' })
      ]),
      crear('p', { clase: 'enunciado' }, enunciado)
    ].concat(filas));
  }

  function encabezado(icono, titulo, texto) {
    return crear('div', { clase: 'tarjeta aparecer' }, [
      crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile' }, [C.icono(icono)]),
        crear('div', null, [crear('h2', { texto: titulo }), crear('span', { clase: 'suave peq', texto: texto })]),
        crear('span', { clase: 'pts', texto: '20 pts' })])
    ]);
  }

  function pintarEjercicios() {
    var v = estado.variante;
    var cb = $('ejercicios-B');
    cb.textContent = '';
    cb.appendChild(encabezado('redondeo', 'Parte B · Redondeo', 'Escriba solo el número, con coma decimal. Sus valores son únicos.'));
    cb.appendChild(ejercicio('regla', 'B1 · Intervalo de redondeo', 4, [
      'Redondee ', dato(v.B1.valor), ' con un intervalo de redondeo de ', dato(v.B1.intervalo), '.'
    ], [respuesta('B', 'B1', 'Valor redondeado', '')], 1));
    cb.appendChild(ejercicio('diana', 'B2 · Empate', 4, [
      'Redondee ', dato(v.B2.valor), ' con un intervalo de ', dato(v.B2.intervalo), '. Aplique la regla preferente de ISO 80000-1 para los empates.'
    ], [respuesta('B', 'B2', 'Valor redondeado', '')], 2));
    cb.appendChild(ejercicio('rayo', 'B3 · ¿Una o dos etapas?', 4, [
      'Un analista redondeó ', dato(v.B3.valor), ' primero a 0,01 y después a 0,1, y reportó ', dato(v.B3.dosEtapas),
      '. ¿Cuál es el valor correcto redondeado a 0,1?'
    ], [respuesta('B', 'B3', 'Valor correcto', '')], 3));
    cb.appendChild(ejercicio('destellos', 'B4 · Resultado con incertidumbre (GUM 7.2.6)', 8, [
      'Para la ', v.B4.magnitud, ', la hoja de cálculo arroja y = ', dato(v.B4.y + ' ' + v.B4.unidad), ' y U = ',
      dato(v.B4.U + ' ' + v.B4.unidad), ' (k = 2).'
    ], [
      respuesta('B', 'B4U', 'a) U con dos cifras significativas', v.B4.unidad),
      respuesta('B', 'B4y', 'b) y redondeado a la misma posición decimal que U', v.B4.unidad),
      respuesta('B', 'B4expr', 'c) Resultado como se escribiría en el informe', '', true),
      C.barraSimbolos(cb)
    ], 4));
    C.recordarFoco(cb);

    var cc = $('ejercicios-C');
    cc.textContent = '';
    cc.appendChild(encabezado('convertir', 'Parte C · Conversión de unidades', 'Use los factores de la NIST SP 811 del material de apoyo y redondee solo el resultado final.'));
    cc.appendChild(ejercicio('manometro', 'C1 · Presión del autoclave', 7, [
      'El manómetro del autoclave indica ', dato(v.C1.p + ' psi'), ' con una incertidumbre expandida U = ', dato(v.C1.U + ' psi'),
      ' (k = 2). Exprese ambos en kilopascales: U con dos cifras significativas y el valor redondeado a la misma posición decimal.'
    ], [respuesta('C', 'C1valor', 'a) Valor', 'kPa'), respuesta('C', 'C1U', 'b) U', 'kPa')], 1));
    cc.appendChild(ejercicio('termometro', 'C2 · Termómetro de la incubadora', 8, [
      'Un termómetro de incubadora calibrado en grados Fahrenheit indica ', dato(v.C2.t + ' °F'), ' con U = ', dato(v.C2.U + ' °F'),
      ' (k = 2). Exprese ambos en grados Celsius: U con dos cifras significativas y la temperatura redondeada a la misma posición decimal.'
    ], [respuesta('C', 'C2valor', 'a) Temperatura', '°C'), respuesta('C', 'C2U', 'b) U', '°C')], 2));
    cc.appendChild(ejercicio('vaso', 'C3 · Bidón de reactivo', 5, [
      'Un bidón de reactivo importado indica una capacidad de ', dato(v.C3.v + ' gal'),
      ' (galones de EE. UU.). Exprese la capacidad en litros, redondeada a 0,01 L.'
    ], [respuesta('C', 'C3', 'Capacidad', 'L')], 3));
  }

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!estado) return;
    if (t.dataset && t.dataset.item) {
      estado.respuestas[t.dataset.parte][t.dataset.item] = t.value;
      $('ok-' + t.dataset.item).classList.toggle('lleno', !!t.value.trim());
      actualizarAvance();
      guardarBorrador();
    } else if (t.id === 'reflexion') {
      estado.respuestas.D.reflexion = t.value;
      actualizarReflexion();
      actualizarAvance();
      guardarBorrador();
    }
  });

  function actualizarReflexion() {
    var n = $('reflexion').value.length;
    $('contador-reflexion').textContent = n;
    $('medidor-reflexion').style.width = Math.min(100, n / 4) + '%';
  }

  // --- Avance -------------------------------------------------------------------------

  function llenos(parte, items) {
    return items.filter(function (i) { return String(estado.respuestas[parte][i] || '').trim(); }).length;
  }

  function avance() {
    var nA = marcados().length, nB = llenos('B', ITEMS_B), nC = llenos('C', ITEMS_C);
    var nD = (estado.respuestas.D.reflexion || '').trim().length;
    var f = { A: Math.min(nA, 15) / 15, B: nB / ITEMS_B.length, C: nC / ITEMS_C.length, D: Math.min(1, nD / 150) };
    return { nA: nA, nB: nB, nC: nC, nD: nD, f: f, total: (f.A * 45 + f.B * 20 + f.C * 20 + f.D * 15) / 100 };
  }

  function actualizarAvance() {
    var a = avance();
    $('sub-A').textContent = a.nA + (a.nA === 1 ? ' marcado' : ' marcados');
    $('sub-B').textContent = a.nB + ' de ' + ITEMS_B.length;
    $('sub-C').textContent = a.nC + ' de ' + ITEMS_C.length;
    $('sub-D').textContent = a.nD + ' caracteres';
    $('sub-R').textContent = Math.round(a.total * 100) + ' % de avance';
    ['A', 'B', 'C', 'D'].forEach(function (p) { $('barra-' + p).style.width = Math.round(a.f[p] * 100) + '%'; });
    $('barra-R').style.width = Math.round(a.total * 100) + '%';
    $('progreso-global').querySelector('i').style.width = Math.round(a.total * 100) + '%';
  }

  // --- Revisión y envío ------------------------------------------------------------

  function pintarRevision() {
    var a = avance();
    var pct = Math.round(a.total * 100);
    $('arco-avance').style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - a.total));
    C.contar($('porcentaje-avance'), pct, 0, ' %');
    var lista = $('lista-revision');
    lista.textContent = '';
    [
      [a.nA >= 10, 'buscar', 'Parte A: ' + a.nA + (a.nA === 1 ? ' valor marcado' : ' valores marcados'),
        'El informe tiene alrededor de 15 errores. Marcar un valor correcto resta 1 punto.'],
      [a.nB === ITEMS_B.length, 'redondeo', 'Parte B: ' + a.nB + ' de ' + ITEMS_B.length + ' respuestas', a.nB < ITEMS_B.length ? 'Hay respuestas vacías.' : 'Completa.'],
      [a.nC === ITEMS_C.length, 'convertir', 'Parte C: ' + a.nC + ' de ' + ITEMS_C.length + ' respuestas', a.nC < ITEMS_C.length ? 'Hay respuestas vacías.' : 'Completa.'],
      [a.nD >= 150, 'mensaje', 'Parte D: ' + a.nD + ' caracteres', a.nD < 150 ? 'Desarrolle un poco más su reflexión (al menos 150 caracteres).' : 'Completa.']
    ].forEach(function (x, i) {
      lista.appendChild(crear('li', { clase: x[0] ? 'bien' : 'falta', style: '--i:' + i }, [
        crear('span', { clase: 'estado-icono' }, [C.icono(x[0] ? 'check' : 'alerta')]),
        crear('div', null, [crear('b', { texto: x[2] }), crear('small', { texto: x[3] })])
      ]));
    });
    $('boton-enviar').disabled = !$('declaracion').checked;
  }

  $('declaracion').addEventListener('change', function () { $('boton-enviar').disabled = !this.checked; });

  $('boton-enviar').addEventListener('click', function () {
    var faltan = (ITEMS_B.length - llenos('B', ITEMS_B)) + (ITEMS_C.length - llenos('C', ITEMS_C));
    $('confirmar-texto').textContent = (faltan ? 'Tiene ' + faltan + ' respuestas vacías en las partes B y C. ' : '') +
      'Solo se acepta un envío por correo y después no podrá modificar sus respuestas.';
    $('confirmar-envio').showModal();
  });

  $('confirmar-envio').addEventListener('close', function () {
    if (this.returnValue === 'si') enviar();
  });

  async function enviar() {
    var boton = $('boton-enviar');
    ocupado(boton, true);
    $('error-envio').hidden = true;
    var r = await C.llamar({
      accion: 'enviar', practica: PRACTICA, nombre: estado.nombre, correo: estado.correo, autorizaDatos: true,
      idCliente: estado.idCliente, inicioCliente: estado.inicio, respuestas: estado.respuestas
    }, simular);
    ocupado(boton, false);
    boton.disabled = !$('declaracion').checked;
    if (!r.ok) {
      errorEn('error-envio', r.mensaje || 'No fue posible enviar la práctica.');
      C.toast('No se pudo enviar', 'error');
      return;
    }
    clearInterval(reloj);
    C.almacen.guardar(CLAVE_ENVIO, { nombre: estado.nombre, correo: estado.correo, codigo: r.codigo, fecha: new Date().toISOString() });
    C.almacen.borrar(CLAVE_BORRADOR);
    $('codigo-enviado').textContent = r.codigo;
    var cont = $('resultado-envio');
    cont.textContent = '';
    if (r.resultado) cont.appendChild(vistaResultado(r.resultado));
    estado = null;
    mostrar('enviado');
    C.confeti();
  }

  $('copiar-codigo').addEventListener('click', function () {
    var codigo = $('codigo-enviado').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codigo).then(function () { C.toast('Código copiado', 'exito', 'copiar'); },
        function () { C.toast('Copie el código manualmente', 'aviso'); });
    }
  });

  // ---------------------------------------------------------------------------
  // Consulta de resultados
  // ---------------------------------------------------------------------------

  function prepararConsulta() {
    var envio = C.almacen.leer(CLAVE_ENVIO);
    if (envio) {
      if (!$('consulta-correo').value) $('consulta-correo').value = envio.correo;
      if (!$('consulta-codigo').value) $('consulta-codigo').value = envio.codigo;
    }
    $('resultado-consulta').textContent = '';
    $('error-consulta').hidden = true;
  }

  $('form-consulta').addEventListener('submit', async function (e) {
    e.preventDefault();
    var correo = $('consulta-correo').value.trim().toLowerCase();
    var codigo = $('consulta-codigo').value.trim().toUpperCase();
    if (!PATRON_CORREO.test(correo) || codigo.length !== 6) {
      return errorEn('error-consulta', 'Escriba su correo y el código de 6 caracteres que recibió al enviar.');
    }
    $('error-consulta').hidden = true;
    var boton = $('boton-consultar');
    ocupado(boton, true);
    var r = await C.llamar({ accion: 'consultar', practica: PRACTICA, correo: correo, codigo: codigo }, simular);
    ocupado(boton, false);
    var cont = $('resultado-consulta');
    cont.textContent = '';
    if (!r.ok) return errorEn('error-consulta', r.mensaje || 'No fue posible consultar.');
    cont.appendChild(vistaResultado(r.resultado, r.nombre));
    cont.scrollIntoView({ behavior: C.sinMovimiento ? 'auto' : 'smooth', block: 'start' });
  });

  function numero(n, dec) {
    return Number(n).toLocaleString('es-CO', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec === undefined ? 1 : dec });
  }

  var PARTES = {
    A: { nombre: 'A · Informe con errores', icono: 'buscar', tono: 'ambar' },
    B: { nombre: 'B · Redondeo', icono: 'redondeo', tono: 'violeta' },
    C: { nombre: 'C · Conversión', icono: 'convertir', tono: 'cielo' },
    D: { nombre: 'D · Reflexión', icono: 'mensaje', tono: 'rosa' }
  };

  function vistaResultado(res, nombre) {
    var t = crear('div', { clase: 'tarjeta aparecer', style: 'margin-top:18px' });
    var anillo = crear('div', { clase: 'anillo' });
    anillo.innerHTML = '<svg viewBox="0 0 200 200"><circle class="pista" cx="100" cy="100" r="86"/>' +
      '<circle class="arco" cx="100" cy="100" r="86" stroke-dasharray="' + CIRCUNFERENCIA + '" stroke-dashoffset="' + CIRCUNFERENCIA + '"/></svg>';
    var centroNota = crear('b', { texto: '0,0' });
    anillo.appendChild(crear('div', { clase: 'centro' }, [crear('div', null, [centroNota, crear('span', { texto: 'de 5,0' })])]));

    var barras = crear('div', { clase: 'barras' });
    ['A', 'B', 'C', 'D'].forEach(function (p) {
      var pend = p === 'D' && res.dPendiente;
      var relleno = crear('i');
      barras.appendChild(crear('div', { clase: 'barra-parte', 'data-tono': PARTES[p].tono }, [
        crear('div', { clase: 'fila' }, [
          crear('span', null, [C.icono(PARTES[p].icono), PARTES[p].nombre]),
          crear('span', { clase: 'num', texto: pend ? 'pendiente' : numero(res.partes[p]) + ' / ' + numero(res.maximos[p]) })
        ]),
        crear('div', { clase: 'pista' }, [relleno])
      ]));
      relleno.dataset.ancho = pend || !res.maximos[p] ? 0 : Math.max(0, res.partes[p]) / res.maximos[p] * 100;
    });

    t.appendChild(crear('div', { clase: 'resultado-cab' }, [anillo, crear('div', null, [
      nombre ? crear('p', { clase: 'suave', style: 'margin-bottom:4px', texto: nombre }) : null,
      crear('h2', { texto: numero(res.total) + ' de 100 puntos' }),
      res.dPendiente ? crear('p', { clase: 'suave peq', texto: 'La parte D aún no ha sido calificada por el docente.' }) : null,
      barras
    ])]));

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        anillo.querySelector('.arco').style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - res.nota / 5));
        barras.querySelectorAll('.pista i').forEach(function (i) { i.style.width = i.dataset.ancho + '%'; });
        C.contar(centroNota, res.nota, 1);
      });
    });

    if (res.detalle) {
      ['A', 'B', 'C'].forEach(function (p, k) {
        var items = res.detalle.filter(function (d) { return d.parte === p; });
        var det = crear('details', { clase: 'acordeon', 'data-tono': PARTES[p].tono });
        if (k === 0) det.open = true;
        det.appendChild(crear('summary', null, [
          crear('span', { clase: 'ico-tile chico' }, [C.icono(PARTES[p].icono)]), PARTES[p].nombre,
          C.icono('abajo', 'flecha-acordeon')
        ]));
        var cont = crear('div', { clase: 'items' });
        items.forEach(function (d) {
          var clase = d.max > 0 ? (d.pts >= d.max ? 'bien' : (d.pts > 0 ? 'parcial' : 'mal')) : (d.pts >= 0 ? 'bien' : 'mal');
          cont.appendChild(crear('div', { clase: 'item-res ' + clase }, [
            crear('span', { clase: 'marca-res' }, [C.icono(clase === 'bien' ? 'check' : (clase === 'parcial' ? 'alerta' : 'x'))]),
            crear('div', { style: 'min-width:0' }, [
              crear('div', { clase: 'desc', texto: d.descripcion }),
              crear('div', { clase: 'comp' }, [
                crear('span', { texto: d.resultado }),
                crear('span', { texto: 'Su respuesta: ' + d.respuesta }),
                crear('span', { texto: 'Esperada: ' + d.esperada })
              ]),
              d.explicacion ? crear('div', { clase: 'expl', texto: d.explicacion }) : null
            ]),
            crear('span', { clase: 'ptsitem', texto: numero(d.pts) + '/' + numero(d.max) })
          ]));
        });
        det.appendChild(cont);
        t.appendChild(det);
      });
    }
    return t;
  }

  // ---------------------------------------------------------------------------
  // Arranque
  // ---------------------------------------------------------------------------

  (function apoyoReglas() {
    var cont = $('apoyo-reglas');
    REGLAS.forEach(function (r) {
      cont.appendChild(crear('div', null, [crear('b', { texto: r[0] }),
        crear('span', null, [r[1], crear('small', { texto: 'Ej. incorrecto: ' + r[2] })])]));
    });
  })();

  C.conectarTema($('tema'));
  if (C.modoDemo) $('aviso-demo').hidden = false;
  prepararInicio();
  verificarDisponibilidad();
  if (location.hash === '#consultar') { prepararConsulta(); mostrar('consulta'); }
})();
