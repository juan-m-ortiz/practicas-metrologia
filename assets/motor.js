// Motor común de las prácticas: construye la página (portada, registro, taller por
// partes, revisión, envío, consulta y resultados) a partir de la definición de cada
// práctica. Código PÚBLICO: no contiene respuestas ni lógica de calificación.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;
  var CIRCUNFERENCIA = 540.35;
  var PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ico(nombre, clase) { return '<i data-icono="' + nombre + '"' + (clase ? ' data-icono-clase="' + clase + '"' : '') + '></i>'; }

  function iniciar(def) {
    var CLAVE_BORRADOR = 'practicas:' + def.id.toLowerCase() + ':borrador';
    var CLAVE_ENVIO = 'practicas:' + def.id.toLowerCase() + ':envio';
    var PASOS = def.partes.concat([{ id: 'R', titulo: 'Enviar', icono: 'enviar', tono: 'esmeralda' }]);
    var PARTES = {};
    def.partes.forEach(function (p) { PARTES[p.id] = p; });

    var estado = null, reloj = null, temporizadorGuardado = null;
    function $(id) { return document.getElementById(id); }

    // -------------------------------------------------------------------------
    // Esqueleto de la página
    // -------------------------------------------------------------------------

    document.title = def.titulo;
    var app = $('app');
    app.innerHTML =
      '<header class="barra"><div class="barra-in">' +
        '<a class="marca" href="../" data-tip="Volver al portal de prácticas">' +
          '<span class="logo">' + ico(def.icono) + '</span>' +
          '<span class="marca-texto"><b>' + esc(def.id + ' · ' + def.titulo) + '</b><span>Metrología y aseguramiento metrológico</span></span></a>' +
        '<div class="acciones-barra">' +
          '<span class="chip chip-reloj" id="chip-reloj" hidden data-tip="Tiempo transcurrido desde que comenzó"><span class="punto-vivo"></span><span id="reloj">00:00</span></span>' +
          '<span class="chip guardado" id="guardado" hidden data-tip="Sus respuestas se guardan automáticamente en este navegador">' + ico('nube') + '<span class="txt">Guardado</span></span>' +
          '<button type="button" class="btn-icono" id="abrir-apoyo" hidden data-tip="Material de apoyo" aria-label="Material de apoyo">' + ico('libro') + '</button>' +
          '<button type="button" class="btn-icono" id="tema"></button>' +
        '</div></div>' +
        '<div class="progreso-global" id="progreso-global" hidden data-tip="Avance de la práctica"><i></i></div>' +
      '</header>' +
      '<div class="demo" id="aviso-demo" hidden>' + ico('info') + ' Modo demostración: las respuestas no se envían a ningún servidor.</div>' +
      '<main>' +
        '<section id="pantalla-inicio" class="envoltura">' +
          '<section class="hero aparecer"><span class="burbuja b1"></span><span class="burbuja b2"></span><span class="burbuja b3"></span><span class="rejilla-fondo"></span>' +
            '<span class="hero-etq">' + ico('matraz') + ' ' + esc(def.etiqueta) + '</span>' +
            '<h1>' + esc(def.titulo) + '</h1><p>' + esc(def.descripcion) + '</p>' +
            '<div class="hero-meta">' + def.meta.map(function (m) { return '<span>' + ico(m[0]) + ' ' + esc(m[1]) + '</span>'; }).join('') + '</div>' +
          '</section>' +
          '<div class="partes">' + def.partes.map(function (p, i) {
            return '<div class="tarjeta parte aparecer" data-tono="' + p.tono + '" style="--i:' + (i + 1) + '">' +
              '<div class="parte-cab"><span class="ico-tile chico">' + ico(p.icono) + '</span><span class="pts">' + p.pts + ' pts</span></div>' +
              '<b>' + esc(p.nombre) + '</b><span class="suave">' + esc(p.resumen) + '</span></div>';
          }).join('') + '</div>' +
          '<div id="estado-practica"></div>' +
          '<div class="columnas-inicio" id="zona-registro">' +
            '<form class="tarjeta aparecer" id="form-registro" novalidate style="--i:5">' +
              '<div class="tarjeta-cab"><span class="ico-tile" data-tono="esmeralda">' + ico('usuario') + '</span>' +
                '<div><h2>Regístrese para comenzar</h2><span class="suave peq">' + esc(def.notaRegistro) + '</span></div></div>' +
              '<div class="aviso aviso-ok" id="aviso-enviado" hidden><span class="ico">' + ico('checkCirculo') + '</span><p id="texto-enviado"></p></div>' +
              '<div class="aviso aviso-amarillo" id="aviso-borrador" hidden><span class="ico">' + ico('reanudar') + '</span><div><p id="texto-borrador"></p>' +
                '<div class="acciones" style="margin-top:10px"><button type="button" class="btn btn-primario" id="continuar-borrador">' + ico('jugar') + ' Continuar donde iba</button>' +
                '<button type="button" class="btn btn-texto" id="descartar-borrador">Descartar</button></div></div></div>' +
              campoRegistro('Nombre completo', 'nombre', 'text', 'usuario', 'name', 'Como aparece en la lista del curso', 120) +
              campoRegistro('Correo electrónico', 'correo', 'email', 'correo', 'email', 'nombre@correo.com', 254) +
              campoRegistro('Confirme el correo', 'correo2', 'email', 'correoOk', 'off', 'Escríbalo de nuevo', 254) +
              '<label class="interruptor"><input type="checkbox" id="autoriza"><span class="riel"></span><span>Autorizo el tratamiento de mi nombre, correo y respuestas con fines exclusivamente académicos del diplomado (Ley 1581 de 2012).</span></label>' +
              '<div class="aviso aviso-error" id="error-registro" role="alert" hidden><span class="ico">' + ico('alerta') + '</span><p></p></div>' +
              '<div class="acciones"><button type="submit" class="btn btn-primario btn-grande" id="boton-comenzar">Comenzar la práctica ' + ico('flecha', 'icono-mover') + '</button>' +
              '<button type="button" class="btn btn-texto" data-ir="consulta">' + ico('medalla') + ' Consultar mi nota</button></div>' +
            '</form>' +
            '<div class="tarjeta aparecer" style="--i:6"><div class="tarjeta-cab"><span class="ico-tile" data-tono="indigo">' + ico('lista') + '</span><h3>Cómo funciona</h3></div>' +
              '<ol class="lista-pasos">' + def.comoFunciona.map(function (t, i) { return '<li><span class="n">' + (i + 1) + '</span><span>' + esc(t) + '</span></li>'; }).join('') + '</ol>' +
              '<div class="aviso" style="margin-bottom:0"><span class="ico">' + ico('nube') + '</span><p>Su avance se guarda solo en este navegador. Si se cierra la página, al volver podrá continuar donde iba.</p></div></div>' +
          '</div>' +
        '</section>' +
        '<section id="pantalla-taller" class="envoltura" hidden>' +
          '<nav class="pasos" role="tablist" aria-label="Partes de la práctica" id="pasos"></nav>' +
          PASOS.map(function (p) { return '<div role="tabpanel" id="panel-' + p.id + '" aria-labelledby="paso-' + p.id + '" class="panel" hidden></div>'; }).join('') +
        '</section>' +
        '<section id="pantalla-enviado" class="envoltura angosta" hidden><div class="tarjeta exito">' +
          '<svg class="check-animado" viewBox="0 0 104 104" aria-hidden="true"><circle cx="52" cy="52" r="46"/><path d="M32 54 46 67 73 38"/></svg>' +
          '<h1>¡Práctica enviada!</h1><p class="suave">Sus respuestas quedaron registradas. Guarde este código de consulta: lo necesitará con su correo para ver su nota cuando el docente la publique.</p>' +
          '<div class="codigo" id="codigo-enviado"></div>' +
          '<div class="acciones" style="justify-content:center"><button type="button" class="btn" id="copiar-codigo" data-tip="Copiar el código al portapapeles">' + ico('copiar') + ' Copiar el código</button>' +
          '<button type="button" class="btn btn-texto" data-ir="consulta">' + ico('medalla') + ' Consultar mi nota</button>' +
          '<a class="btn btn-texto" href="../">' + ico('casa') + ' Ir al portal</a></div></div><div id="resultado-envio"></div></section>' +
        '<section id="pantalla-consulta" class="envoltura angosta" hidden>' +
          '<form class="tarjeta aparecer" id="form-consulta" novalidate><div class="tarjeta-cab"><span class="ico-tile" data-tono="indigo">' + ico('medalla') + '</span>' +
            '<div><h2>Consultar mi nota</h2><span class="suave peq">Disponible cuando el docente habilite la consulta.</span></div></div>' +
            campoRegistro('Correo con el que envió', 'consulta-correo', 'email', 'correo', 'email', '', 254) +
            '<label class="campo"><span class="etq">Código de consulta</span><span class="control"><span class="ico">' + ico('llave') + '</span>' +
              '<input type="text" id="consulta-codigo" autocomplete="off" maxlength="6" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700"></span></label>' +
            '<div class="aviso aviso-error" id="error-consulta" role="alert" hidden><span class="ico">' + ico('alerta') + '</span><p></p></div>' +
            '<div class="acciones"><button type="submit" class="btn btn-primario" id="boton-consultar">' + ico('ojo') + ' Consultar</button>' +
            '<button type="button" class="btn btn-texto" data-ir="inicio">' + ico('flechaIzq') + ' Volver</button></div></form>' +
          '<div id="resultado-consulta"></div></section>' +
      '</main>' +
      '<aside class="cajon" id="cajon" aria-label="Material de apoyo" aria-hidden="true">' +
        '<div class="cajon-cab"><span class="ico-tile chico" data-tono="esmeralda">' + ico('libro') + '</span><h2>Material de apoyo</h2>' +
        '<button type="button" class="btn-icono" id="cerrar-apoyo" data-tip="Cerrar" aria-label="Cerrar">' + ico('x') + '</button></div>' +
        '<div id="contenido-apoyo"></div></aside><div class="cajon-fondo" id="cajon-fondo"></div>' +
      '<dialog class="modal" id="confirmar-envio" aria-labelledby="confirmar-titulo"><form method="dialog">' +
        '<div class="modal-cab"><span class="ico-tile chico" data-tono="esmeralda">' + ico('enviar') + '</span><h3 id="confirmar-titulo">¿Enviar la práctica ahora?</h3></div>' +
        '<div class="modal-cuerpo"><p id="confirmar-texto"></p></div>' +
        '<div class="modal-pie"><button type="submit" value="no" class="btn">Seguir revisando</button><button type="submit" value="si" class="btn btn-primario">' + ico('enviar') + ' Sí, enviar</button></div>' +
      '</form></dialog>' +
      '<footer class="pie"><span>UIS · Escuela de Química · Diplomado Acreditación de Laboratorios ISO/IEC 17025:2017 · <span data-edicion>' + esc(C.edicion().etiqueta) + '</span></span><span>' + esc(def.pie || 'Datos ficticios con fines didácticos') + '</span></footer>';

    function campoRegistro(etq, id, tipo, icono, auto, ph, max) {
      return '<label class="campo"><span class="etq">' + esc(etq) + '</span><span class="control"><span class="ico">' + ico(icono) + '</span>' +
        '<input type="' + tipo + '" id="' + id + '" autocomplete="' + auto + '" maxlength="' + max + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></span></label>';
    }

    window.Iconos.pintar(app);

    // -------------------------------------------------------------------------
    // Utilidades
    // -------------------------------------------------------------------------

    function errorEn(id, mensaje) {
      var el = $(id);
      el.querySelector('p').textContent = mensaje || '';
      el.hidden = !mensaje;
      if (mensaje) { el.classList.remove('sacudir'); void el.offsetWidth; el.classList.add('sacudir'); }
    }

    function ocupado(boton, si) { boton.classList.toggle('cargando', si); boton.disabled = si; }

    function guardar() {
      if (!estado) return;
      clearTimeout(temporizadorGuardado);
      temporizadorGuardado = setTimeout(function () {
        var ok = C.almacen.guardar(CLAVE_BORRADOR, estado);
        var chip = $('guardado');
        chip.querySelector('.txt').textContent = ok ? 'Guardado' : 'Sin guardado local';
        chip.classList.remove('activo'); void chip.offsetWidth; chip.classList.add('activo');
      }, 300);
    }

    function simular(datos) {
      if (datos.accion === 'iniciar') {
        return { ok: true, practica: def.id, nombre: datos.nombre, correo: datos.correo.trim().toLowerCase(),
          inicio: new Date().toISOString(), variante: def.varianteDemo || {} };
      }
      if (datos.accion === 'enviar') {
        console.info('Modo demostración. Esto es lo que se enviaría al servidor:', datos);
        return { ok: true, idEnvio: 'demo', codigo: 'DEMO42', retroalimentacion: 'ninguna' };
      }
      return { ok: false, codigo: 'NO_DISPONIBLE', mensaje: 'En modo demostración no hay resultados para consultar.' };
    }

    function mostrar(pantalla) {
      ['inicio', 'taller', 'enviado', 'consulta'].forEach(function (p) { $('pantalla-' + p).hidden = p !== pantalla; });
      var taller = pantalla === 'taller';
      ['chip-reloj', 'guardado', 'abrir-apoyo', 'progreso-global'].forEach(function (id) { $(id).hidden = !taller; });
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

    // -------------------------------------------------------------------------
    // Componentes para las partes (los usa cada práctica)
    // -------------------------------------------------------------------------

    function dato(texto) { return crear('span', { clase: 'dato', texto: texto }); }

    /** Campo de texto corto (numérico por defecto) ligado a respuestas[parte][item]. */
    function respuesta(parte, item, etiqueta, unidad, opciones) {
      opciones = opciones || {};
      var id = 'resp-' + parte + '-' + item;
      var valor = estado.respuestas[parte][item] || '';
      var input = crear('input', { type: 'text', id: id, 'data-parte': parte, 'data-item': item, autocomplete: 'off',
        spellcheck: 'false', maxlength: opciones.ancha ? '80' : '30', inputmode: opciones.ancha ? 'text' : 'decimal',
        placeholder: opciones.placeholder || (opciones.ancha ? '' : 'Use coma decimal') });
      input.value = valor;
      var grupo = crear('span', { clase: 'grupo-entrada' }, [input]);
      if (unidad) grupo.appendChild(crear('span', { clase: 'unidad', texto: unidad }));
      return crear('div', { clase: 'respuesta' + (opciones.ancha ? ' ancha' : '') }, [
        crear('label', { for: id, texto: etiqueta }), grupo,
        crear('span', { clase: 'estado-campo' + (String(valor).trim() ? ' lleno' : ''), 'data-ok': parte + '-' + item, 'aria-hidden': 'true' }, [C.icono('check')])
      ]);
    }

    /** Opciones excluyentes en forma de fichas (radio) ligadas a respuestas[parte][item]. */
    function seleccion(parte, item, etiqueta, opciones, config) {
      config = config || {};
      var nombre = 'sel-' + parte + '-' + item;
      var actual = estado.respuestas[parte][item] || '';
      var grupo = crear('div', { clase: 'fichas' + (config.columnas ? ' col-' + config.columnas : ''), role: 'radiogroup', 'aria-label': etiqueta });
      opciones.forEach(function (o) {
        var valor = typeof o === 'string' ? o : o[0];
        var texto = typeof o === 'string' ? o : o[1];
        var tip = typeof o === 'string' ? null : o[2];
        var input = crear('input', { type: 'radio', name: nombre, value: valor, 'data-parte': parte, 'data-item': item });
        if (actual === valor) input.checked = true;
        grupo.appendChild(crear('label', { clase: 'ficha', 'data-tip': tip }, [input, crear('span', { texto: texto })]));
      });
      return crear('div', { clase: 'seleccion' }, [
        crear('div', { clase: 'seleccion-cab' }, [crear('span', { clase: 'etq', texto: etiqueta }),
          crear('span', { clase: 'estado-campo' + (actual ? ' lleno' : ''), 'data-ok': parte + '-' + item, 'aria-hidden': 'true' }, [C.icono('check')])]),
        grupo
      ]);
    }

    /** Área de texto con contador y medidor (recomendado: `minimo` caracteres). */
    function texto(parte, item, etiqueta, opciones) {
      opciones = opciones || {};
      var max = opciones.max || 1500, minimo = opciones.minimo || 150;
      var id = 'txt-' + parte + '-' + item;
      var area = crear('textarea', { id: id, 'data-parte': parte, 'data-item': item, maxlength: String(max),
        placeholder: opciones.placeholder || 'Escriba aquí…' });
      area.value = estado.respuestas[parte][item] || '';
      area.style.minHeight = (opciones.alto || 180) + 'px';
      var medidor = crear('i');
      var cuenta = crear('b', { clase: 'num', texto: String(area.value.length) });
      function pintarCuenta() {
        cuenta.textContent = area.value.length;
        medidor.style.width = Math.min(100, area.value.length / (minimo * 2) * 100) + '%';
      }
      area.addEventListener('input', pintarCuenta);
      pintarCuenta();
      return crear('div', { clase: 'campo-texto' }, [
        crear('label', { clase: 'campo', for: id }, [crear('span', { clase: 'etq', texto: etiqueta })]), area,
        crear('div', { clase: 'contador-texto' }, [
          crear('span', { clase: 'medidor', 'data-tip': 'Se recomiendan al menos ' + minimo + ' caracteres' }, [medidor]),
          crear('span', null, [cuenta, ' / ' + max + ' caracteres'])
        ])
      ]);
    }

    function ejercicio(icono, titulo, pts, enunciado, filas, i) {
      return crear('div', { clase: 'tarjeta ejercicio aparecer', style: '--i:' + (i || 0) }, [
        crear('div', { clase: 'ejercicio-cab' }, [
          crear('span', { clase: 'ico-tile chico' }, [C.icono(icono)]),
          crear('h3', { texto: titulo }),
          pts ? crear('span', { clase: 'pts', texto: pts + ' pts' }) : null
        ]),
        enunciado ? crear('div', { clase: 'enunciado' }, enunciado) : null
      ].concat(filas || []));
    }

    function encabezado(parte, texto) {
      var p = PARTES[parte];
      return crear('div', { clase: 'tarjeta aparecer' }, [
        crear('div', { clase: 'tarjeta-cab' }, [crear('span', { clase: 'ico-tile' }, [C.icono(p.icono)]),
          crear('div', null, [crear('h2', { texto: 'Parte ' + p.nombre }), texto ? crear('span', { clase: 'suave peq', texto: texto }) : null]),
          crear('span', { clase: 'pts', texto: p.pts + ' pts' })])
      ]);
    }

    function llenos(parte, items) {
      return items.filter(function (i) { return String(estado.respuestas[parte][i] || '').trim(); }).length;
    }

    var ayudas = {
      crear: crear, icono: C.icono, toast: C.toast, dato: dato, respuesta: respuesta, seleccion: seleccion, texto: texto,
      ejercicio: ejercicio, encabezado: encabezado, llenos: llenos, guardar: guardar,
      barraSimbolos: C.barraSimbolos, recordarFoco: C.recordarFoco,
      actualizar: function () { actualizarAvance(); },
      get estado() { return estado; }
    };

    // -------------------------------------------------------------------------
    // Disponibilidad (la decide la hoja de Google)
    // -------------------------------------------------------------------------

    var BLOQUEO = {
      proximamente: { icono: 'candado', tono: 'indigo', titulo: 'Esta práctica aún no está habilitada',
        texto: 'El docente la habilitará a medida que avance el curso. Vuelva al portal para ver las prácticas disponibles.' },
      programada: { icono: 'reloArena', tono: 'ambar', titulo: 'Esta práctica está programada' },
      cerrada: { icono: 'prohibido', tono: 'rosa', titulo: 'Esta práctica ya cerró', texto: 'El plazo para desarrollarla terminó.' }
    };

    function pintarBloqueo(info) {
      var m = BLOQUEO[info.estado];
      if (!m) return;
      $('zona-registro').hidden = true;
      var t = info.estado === 'programada' ? 'Se habilita el ' + C.fecha(info.abreDesde) + '.' : m.texto;
      var acciones = [crear('a', { clase: 'btn btn-primario', href: '../' }, [C.icono('casa'), 'Ir al portal'])];
      if (info.resultados) {
        acciones.unshift(crear('button', { type: 'button', clase: 'btn', 'data-ir': 'consulta' }, [C.icono('medalla'), 'Consultar mi nota']));
        t += ' Ya puede consultar su nota con su correo y su código.';
      }
      var cont = $('estado-practica');
      cont.textContent = '';
      cont.appendChild(crear('div', { clase: 'tarjeta bloqueo aparecer', 'data-tono': m.tono }, [
        crear('span', { clase: 'ico-tile' }, [C.icono(m.icono)]), crear('h2', { texto: m.titulo }),
        crear('p', { clase: 'suave', texto: t }), crear('div', { clase: 'acciones', style: 'justify-content:center' }, acciones)
      ]));
    }

    async function verificarDisponibilidad() {
      var boton = $('boton-comenzar');
      ocupado(boton, true);
      var r = await C.llamar({ accion: 'estado' });
      ocupado(boton, false);
      if (!r.ok) return;
      var info = (r.practicas || []).filter(function (p) { return p.id === def.id; })[0];
      if (info && info.estado !== 'abierta') pintarBloqueo(info);
    }

    // -------------------------------------------------------------------------
    // Portada y registro
    // -------------------------------------------------------------------------

    function prepararInicio() {
      var envio = C.almacen.leer(CLAVE_ENVIO);
      $('aviso-enviado').hidden = !(envio && envio.codigo);
      if (envio && envio.codigo) {
        $('texto-enviado').textContent = 'Desde este navegador ya se envió la práctica a nombre de ' + envio.nombre +
          '. Su código de consulta es ' + envio.codigo + '.';
      }
      var b = C.almacen.leer(CLAVE_BORRADOR);
      $('aviso-borrador').hidden = !(b && b.variante && b.correo);
      if (b && b.correo) $('texto-borrador').textContent = 'Tiene una práctica sin enviar a nombre de ' + b.nombre + ' (' + b.correo + ').';
    }

    $('continuar-borrador').addEventListener('click', function () {
      var b = C.almacen.leer(CLAVE_BORRADOR);
      if (!b) return;
      estado = b;
      completarRespuestas();
      abrirTaller();
      C.toast('Continuamos donde iba', 'exito', 'reanudar');
    });

    $('descartar-borrador').addEventListener('click', function () {
      if (!confirm('¿Descartar el trabajo guardado en este navegador? No se puede recuperar.')) return;
      C.almacen.borrar(CLAVE_BORRADOR);
      prepararInicio();
      C.toast('Borrador descartado', 'info', 'papelera');
    });

    /** Asegura que existan todas las partes en respuestas (borradores de versiones anteriores). */
    function completarRespuestas() {
      var vacias = def.respuestasVacias();
      Object.keys(vacias).forEach(function (k) { if (!estado.respuestas[k]) estado.respuestas[k] = vacias[k]; });
    }

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
      var r = await C.llamar({ accion: 'iniciar', practica: def.id, nombre: nombre, correo: correo, autorizaDatos: true }, simular);
      ocupado(boton, false);
      if (!r.ok) return errorEn('error-registro', r.mensaje || 'No fue posible iniciar la práctica.');
      var previo = C.almacen.leer(CLAVE_BORRADOR);
      var mismo = previo && previo.correo === r.correo;
      estado = {
        nombre: r.nombre, correo: r.correo, inicio: mismo ? previo.inicio : r.inicio, variante: r.variante,
        edicion: mismo && previo.edicion ? previo.edicion : (r.edicion || C.edicion()),
        idCliente: mismo ? previo.idCliente : C.uuid(),
        respuestas: mismo ? previo.respuestas : def.respuestasVacias(), pestana: PASOS[0].id
      };
      completarRespuestas();
      guardar();
      abrirTaller();
      C.toast('¡Éxitos, ' + r.nombre.split(' ')[0] + '!', 'exito', 'destellos');
    });

    // -------------------------------------------------------------------------
    // Taller
    // -------------------------------------------------------------------------

    function abrirTaller() {
      clearInterval(reloj);
      reloj = C.iniciarReloj($('reloj'), estado.inicio);
      pintarPasos();
      def.partes.forEach(function (p) {
        var panel = $('panel-' + p.id);
        panel.textContent = '';
        def.pintar[p.id](panel, ayudas);
        window.Iconos.pintar(panel);
      });
      pintarPanelEnvio();
      agregarNavegacion();
      mostrar('taller');
      medirBarra();
      actualizarAvance();
      elegirPestana(estado.pestana && $('panel-' + estado.pestana) ? estado.pestana : PASOS[0].id);
    }

    function pintarPasos() {
      var nav = $('pasos');
      nav.textContent = '';
      nav.style.gridTemplateColumns = 'repeat(' + PASOS.length + ', minmax(0, 1fr))';
      PASOS.forEach(function (p) {
        nav.appendChild(crear('button', { type: 'button', role: 'tab', id: 'paso-' + p.id, clase: 'paso', 'data-tono': p.tono,
          'aria-controls': 'panel-' + p.id, 'aria-selected': 'false',
          'data-tip': p.pts ? 'Parte ' + p.id + ' · ' + p.pts + ' puntos' : 'Revise su avance y envíe' }, [
          crear('span', { clase: 'ico-tile' }, [C.icono(p.icono)]),
          crear('span', { clase: 'paso-texto' }, [
            crear('b', null, [p.id === 'R' ? null : crear('span', { clase: 'paso-letra', texto: p.id + ' · ' }), p.titulo]),
            crear('span', { id: 'sub-' + p.id })
          ]),
          crear('span', { clase: 'paso-barra' }, [crear('i', { id: 'barra-' + p.id })])
        ]));
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
      if (def.alMostrar) def.alMostrar(p, ayudas);
      estado.pestana = p;
      guardar();
      var arriba = Math.max(0, $('pantalla-taller').offsetTop - 8);
      if (window.scrollY > arriba) window.scrollTo({ top: arriba, behavior: C.sinMovimiento ? 'auto' : 'smooth' });
    }

    function medirBarra() {
      document.documentElement.style.setProperty('--alto-barra', document.querySelector('.barra').offsetHeight + 'px');
    }
    window.addEventListener('resize', function () { if (!$('pantalla-taller').hidden) medirBarra(); });

    function agregarNavegacion() {
      PASOS.forEach(function (p, i) {
        if (p.id === 'R') return;
        var panel = $('panel-' + p.id);
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

    // Respuestas genéricas: cualquier control con data-parte y data-item
    document.addEventListener('input', alCambiar);
    document.addEventListener('change', alCambiar);
    function alCambiar(e) {
      var t = e.target;
      if (!estado || !t.dataset || !t.dataset.item || !t.dataset.parte) return;
      if (t.type === 'radio' && !t.checked) return;
      estado.respuestas[t.dataset.parte][t.dataset.item] = t.value;
      var ok = document.querySelector('[data-ok="' + t.dataset.parte + '-' + t.dataset.item + '"]');
      if (ok) ok.classList.toggle('lleno', !!String(t.value).trim());
      if (def.alResponder) def.alResponder(t.dataset.parte, t.dataset.item, ayudas);
      actualizarAvance();
      guardar();
    }

    // -------------------------------------------------------------------------
    // Avance, revisión y envío
    // -------------------------------------------------------------------------

    function actualizarAvance() {
      if (!estado) return;
      var a = def.avance(estado.respuestas, ayudas);
      var total = 0, suma = 0;
      def.partes.forEach(function (p) {
        var f = Math.max(0, Math.min(1, a.fraccion[p.id] || 0));
        total += f * p.pts; suma += p.pts;
        $('sub-' + p.id).textContent = a.sub[p.id] || '';
        $('barra-' + p.id).style.width = Math.round(f * 100) + '%';
      });
      var pct = suma ? total / suma : 0;
      $('sub-R').textContent = Math.round(pct * 100) + ' % de avance';
      $('barra-R').style.width = Math.round(pct * 100) + '%';
      $('progreso-global').querySelector('i').style.width = Math.round(pct * 100) + '%';
      return { a: a, pct: pct };
    }

    function pintarPanelEnvio() {
      var panel = $('panel-R');
      panel.innerHTML =
        '<div class="tarjeta" data-tono="esmeralda"><div class="tarjeta-cab"><span class="ico-tile">' + ico('enviar') + '</span><h2>Revisar y enviar</h2></div>' +
        '<div class="revision"><div class="anillo" data-tip="Avance estimado de la práctica"><svg viewBox="0 0 200 200"><circle class="pista" cx="100" cy="100" r="86"/>' +
        '<circle class="arco" id="arco-avance" cx="100" cy="100" r="86" stroke-dasharray="' + CIRCUNFERENCIA + '" stroke-dashoffset="' + CIRCUNFERENCIA + '"/></svg>' +
        '<div class="centro"><div><b id="porcentaje-avance">0 %</b><span>avance</span></div></div></div><ul class="checklist" id="lista-revision"></ul></div>' +
        '<label class="interruptor" style="margin-top:22px"><input type="checkbox" id="declaracion"><span class="riel"></span><span>Declaro que desarrollé esta práctica de forma individual.</span></label>' +
        '<p class="suave peq">Solo se acepta un envío por correo. Después de enviar no podrá modificar sus respuestas.</p>' +
        '<div class="aviso aviso-error" id="error-envio" role="alert" hidden><span class="ico">' + ico('alerta') + '</span><p></p></div>' +
        '<div class="acciones"><button type="button" class="btn btn-primario btn-grande" id="boton-enviar" disabled>' + ico('enviar') + ' Enviar la práctica</button></div></div>';
      window.Iconos.pintar(panel);
      $('declaracion').addEventListener('change', function () { $('boton-enviar').disabled = !this.checked; });
      $('boton-enviar').addEventListener('click', function () {
        var a = def.avance(estado.respuestas, ayudas);
        $('confirmar-texto').textContent = (a.faltan ? a.faltan + ' ' : '') +
          'Solo se acepta un envío por correo y después no podrá modificar sus respuestas.';
        $('confirmar-envio').showModal();
      });
    }

    function pintarRevision() {
      var r = actualizarAvance();
      $('arco-avance').style.strokeDashoffset = String(CIRCUNFERENCIA * (1 - r.pct));
      C.contar($('porcentaje-avance'), Math.round(r.pct * 100), 0, ' %');
      var lista = $('lista-revision');
      lista.textContent = '';
      r.a.revision.forEach(function (x, i) {
        lista.appendChild(crear('li', { clase: x[0] ? 'bien' : 'falta', style: '--i:' + i }, [
          crear('span', { clase: 'estado-icono' }, [C.icono(x[0] ? 'check' : 'alerta')]),
          crear('div', null, [crear('b', { texto: x[2] }), crear('small', { texto: x[3] })])
        ]));
      });
      $('boton-enviar').disabled = !$('declaracion').checked;
    }

    // Se usa el «submit» del formulario y no el evento «close» del diálogo: «close» llega
    // con retraso (o no llega) en pestañas en segundo plano.
    $('confirmar-envio').querySelector('form').addEventListener('submit', function (e) {
      if (e.submitter && e.submitter.value === 'si') setTimeout(enviar, 0);
    });

    async function enviar() {
      var boton = $('boton-enviar');
      ocupado(boton, true);
      $('error-envio').hidden = true;
      var r = await C.llamar({
        accion: 'enviar', practica: def.id, nombre: estado.nombre, correo: estado.correo, autorizaDatos: true,
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

    // -------------------------------------------------------------------------
    // Consulta y resultados
    // -------------------------------------------------------------------------

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
      var r = await C.llamar({ accion: 'consultar', practica: def.id, correo: correo, codigo: codigo }, simular);
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

    function vistaResultado(res, nombre) {
      var t = crear('div', { clase: 'tarjeta aparecer', style: 'margin-top:18px' });
      var anillo = crear('div', { clase: 'anillo' });
      anillo.innerHTML = '<svg viewBox="0 0 200 200"><circle class="pista" cx="100" cy="100" r="86"/>' +
        '<circle class="arco" cx="100" cy="100" r="86" stroke-dasharray="' + CIRCUNFERENCIA + '" stroke-dashoffset="' + CIRCUNFERENCIA + '"/></svg>';
      var centroNota = crear('b', { texto: '0,0' });
      anillo.appendChild(crear('div', { clase: 'centro' }, [crear('div', null, [centroNota, crear('span', { texto: 'de 5,0' })])]));
      var barras = crear('div', { clase: 'barras' });
      def.partes.forEach(function (p) {
        // Parte calificada del todo por el docente: «pendiente». Parte mixta: puntos ya ganados y aviso.
        var pend = p.id === 'D' && res.dPendiente && p.docente;
        var mixta = p.id === 'D' && res.dPendiente && !p.docente;
        var relleno = crear('i');
        var maximo = res.maximos[p.id];
        barras.appendChild(crear('div', { clase: 'barra-parte', 'data-tono': p.tono }, [
          crear('div', { clase: 'fila' }, [
            crear('span', null, [C.icono(p.icono), p.nombre]),
            crear('span', { clase: 'num', texto: pend ? 'pendiente' : numero(res.partes[p.id]) + ' / ' + numero(maximo) + (mixta ? ' · falta la parte del docente' : '') })
          ]),
          crear('div', { clase: 'pista' }, [relleno])
        ]));
        relleno.dataset.ancho = pend || !maximo ? 0 : Math.max(0, res.partes[p.id]) / maximo * 100;
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
        def.partes.filter(function (p) { return !p.docente; }).forEach(function (p, k) {
          var items = res.detalle.filter(function (d) { return d.parte === p.id; });
          if (!items.length) return;
          var det = crear('details', { clase: 'acordeon', 'data-tono': p.tono });
          if (k === 0) det.open = true;
          det.appendChild(crear('summary', null, [crear('span', { clase: 'ico-tile chico' }, [C.icono(p.icono)]), p.nombre, C.icono('abajo', 'flecha-acordeon')]));
          var cont = crear('div', { clase: 'items' });
          items.forEach(function (d) {
            var clase = d.max > 0 ? (d.pts >= d.max ? 'bien' : (d.pts > 0 ? 'parcial' : 'mal')) : (d.pts >= 0 ? 'bien' : 'mal');
            cont.appendChild(crear('div', { clase: 'item-res ' + clase }, [
              crear('span', { clase: 'marca-res' }, [C.icono(clase === 'bien' ? 'check' : (clase === 'parcial' ? 'alerta' : 'x'))]),
              crear('div', { style: 'min-width:0' }, [
                crear('div', { clase: 'desc', texto: d.descripcion }),
                crear('div', { clase: 'comp' }, [crear('span', { texto: d.resultado }), crear('span', { texto: 'Su respuesta: ' + d.respuesta }),
                  crear('span', { texto: 'Esperada: ' + d.esperada })]),
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

    // -------------------------------------------------------------------------
    // Arranque
    // -------------------------------------------------------------------------

    if (def.apoyo) {
      def.apoyo($('contenido-apoyo'), ayudas);
      window.Iconos.pintar($('contenido-apoyo'));
    }
    C.conectarTema($('tema'));
    if (C.modoDemo) $('aviso-demo').hidden = false;
    prepararInicio();
    verificarDisponibilidad();
    if (location.hash === '#consultar') { prepararConsulta(); mostrar('consulta'); }
    return ayudas;
  }

  window.Motor = { iniciar: iniciar };
})();
