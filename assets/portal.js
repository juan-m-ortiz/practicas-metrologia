// Portal de prácticas: muestra cada práctica con el estado que define la hoja
// de Google (pestaña «Practicas»): abierta, programada, próximamente o cerrada.
(function () {
  'use strict';

  var C = window.Comun;
  var crear = C.crear;

  var ESTADOS = {
    abierta: { clase: 'estado-abierta', texto: 'Disponible', tip: 'Ya puede desarrollar esta práctica' },
    programada: { clase: 'estado-programada', icono: 'reloArena', texto: 'Programada' },
    proximamente: { clase: 'estado-proximamente', icono: 'candado', texto: 'Próximamente', tip: 'El docente la habilitará a medida que avance el curso' },
    cerrada: { clase: 'estado-cerrada', icono: 'prohibido', texto: 'Cerrada', tip: 'El plazo de esta práctica terminó' }
  };

  function insignia(estado, tip) {
    var e = ESTADOS[estado];
    var hijos = estado === 'abierta' ? [crear('span', { clase: 'punto-vivo' })] : [C.icono(e.icono)];
    hijos.push(e.texto);
    return crear('span', { clase: 'estado ' + e.clase, 'data-tip': tip || e.tip }, hijos);
  }

  function tarjeta(p, info, i) {
    var estado = info ? info.estado : 'proximamente';
    var enlace = null, accion = null, tip = null, nota = p.resumen, fecha = null;
    if (estado === 'abierta') {
      enlace = p.ruta;
      accion = crear('span', { clase: 'practica-ir' }, ['Comenzar', C.icono('flecha')]);
      if (info.cierraEn) fecha = crear('span', { clase: 'practica-fecha' }, [C.icono('reloArena'), 'Cierra el ' + C.fecha(info.cierraEn)]);
    } else if (estado === 'programada') {
      tip = 'Se habilita el ' + C.fecha(info.abreDesde);
      fecha = crear('span', { clase: 'practica-fecha' }, [C.icono('calendario'), 'Abre el ' + C.fecha(info.abreDesde)]);
    } else if (estado === 'cerrada' && info.resultados) {
      enlace = p.ruta + '#consultar';
      tip = 'Ya puede consultar su nota';
      accion = crear('span', { clase: 'practica-ir' }, ['Ver mi nota', C.icono('flecha')]);
    }
    var cuerpo = [
      crear('div', { clase: 'practica-cab' }, [
        crear('span', { clase: 'ico-tile' }, [C.icono(p.icono)]),
        crear('span', { clase: 'practica-id', texto: p.id })
      ]),
      crear('h3', { texto: p.titulo }),
      crear('p', { texto: nota }),
      fecha,
      crear('div', { clase: 'practica-pie' }, [insignia(estado, tip), accion])
    ];
    var clase = 'tarjeta practica aparecer' + (enlace ? '' : ' inactiva');
    var nodo = enlace
      ? crear('a', { clase: clase, href: enlace, 'data-tono': p.tono, style: '--i:' + i }, cuerpo)
      : crear('div', { clase: clase, 'data-tono': p.tono, style: '--i:' + i, 'aria-disabled': 'true' }, cuerpo);
    return nodo;
  }

  function pintar(estado) {
    var mapa = {};
    ((estado && estado.practicas) || []).forEach(function (x) { mapa[x.id] = x; });
    [1, 2].forEach(function (s) {
      var cont = document.getElementById('sesion-' + s);
      cont.textContent = '';
      C.CATALOGO.filter(function (p) { return p.sesion === s; }).forEach(function (p, i) {
        cont.appendChild(tarjeta(p, mapa[p.id], i));
      });
    });
  }

  function esqueletos() {
    [1, 2].forEach(function (s) {
      var cont = document.getElementById('sesion-' + s);
      C.CATALOGO.filter(function (p) { return p.sesion === s; }).forEach(function () {
        cont.appendChild(crear('div', { clase: 'esqueleto', 'aria-hidden': 'true' }));
      });
    });
  }

  C.conectarTema(document.getElementById('tema'));
  if (C.modoDemo) document.getElementById('aviso-demo').hidden = false;
  esqueletos();

  C.llamar({ accion: 'estado' }).then(function (r) {
    if (!r.ok) {
      document.getElementById('error-portal').hidden = false;
      document.getElementById('texto-error').textContent = 'No fue posible consultar qué prácticas están habilitadas. Recargue la página en unos segundos.';
      pintar(null);
      return;
    }
    if (r.aviso) {
      document.getElementById('aviso-portal').hidden = false;
      document.getElementById('texto-aviso').textContent = r.aviso;
    }
    pintar(r);
  });
})();
