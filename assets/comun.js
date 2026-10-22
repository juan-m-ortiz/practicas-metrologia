// Utilidades comunes de las prácticas: catálogo, llamadas al servidor, borrador
// local, tema claro/oscuro, notificaciones, tooltips, confeti, cronómetro y barra
// de símbolos. No contiene respuestas ni lógica de calificación.
(function () {
  'use strict';

  var config = window.CONFIG_PRACTICAS || {};
  var parametros = new URLSearchParams(location.search);
  var modoDemo = parametros.get('demo') === '1' || !config.URL_WEBAPP;
  var sinMovimiento = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // Catálogo público de prácticas (el estado de cada una lo decide la hoja)
  // ---------------------------------------------------------------------------

  var CATALOGO = [
    { id: 'P1', sesion: 1, tono: 'ambar', icono: 'buscar', ruta: 'p1/', titulo: 'Cazadores de errores del SI',
      resumen: 'Escritura, redondeo y conversión de unidades en un informe de resultados.' },
    { id: 'P2', sesion: 1, tono: 'violeta', icono: 'mira', ruta: 'p2/', titulo: 'Error, sesgo y precisión con datos reales',
      resumen: 'Veracidad y precisión con datos de verificación de equipos del laboratorio.' },
    { id: 'P3', sesion: 1, tono: 'cielo', icono: 'cadena', ruta: 'p3/', titulo: 'Arme y audite la cadena de trazabilidad',
      resumen: 'Del resultado hasta el SI: certificados, KCDB y alcances de acreditación.' },
    { id: 'P4', sesion: 2, tono: 'esmeralda', icono: 'insignia', ruta: 'p4/', titulo: 'Confirmación metrológica de los equipos del caso',
      resumen: 'Requisitos del método frente a las características de cada equipo.' },
    { id: 'P5', sesion: 2, tono: 'rosa', icono: 'calendario', ruta: 'p5/', titulo: 'Intervalos con el método escalera y el algoritmo de Bare',
      resumen: 'Intervalos de calibración justificados con datos históricos.' },
    { id: 'P6', sesion: 2, tono: 'indigo', icono: 'actividad', ruta: 'p6/', titulo: 'Carta de control de una balanza',
      resumen: 'Comprobaciones intermedias y decisiones con cartas de control.' },
    { id: 'P7', sesion: 2, tono: 'coral', icono: 'certificado', ruta: 'p7/', titulo: 'Revisión de un certificado de calibración real',
      resumen: 'Lista de chequeo y decisión de confirmación metrológica.' }
  ];

  /** Estado simulado para el modo demostración. */
  function estadoDemo() {
    var manana = new Date(Date.now() + 86400000);
    manana.setHours(8, 0, 0, 0);
    return {
      ok: true, aviso: 'Modo demostración: así se verá el portal cuando conecte la hoja de Google.',
      practicas: CATALOGO.map(function (p, i) {
        return { id: p.id, estado: i === 0 ? 'abierta' : (i === 1 ? 'programada' : 'proximamente'),
          abreDesde: i === 1 ? manana.toISOString() : null, cierraEn: null, resultados: false };
      })
    };
  }

  // ---------------------------------------------------------------------------
  // Servidor
  // ---------------------------------------------------------------------------

  function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /**
   * POST en texto plano: evita la verificación previa de CORS que Apps Script
   * no responde. Reintenta con espera creciente si la red o el servidor fallan.
   * `simular` atiende la llamada en modo demostración.
   */
  async function llamar(datos, simular) {
    if (modoDemo) {
      await esperar(450);
      if (datos.accion === 'estado') return estadoDemo();
      return simular(datos);
    }
    var reintentos = 4;
    for (var intento = 0; ; intento++) {
      try {
        var r = await fetch(config.URL_WEBAPP, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(datos),
          redirect: 'follow'
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var j = await r.json();
        if (j.codigo === 'OCUPADO' || j.codigo === 'SERVIDOR') throw new Error(j.mensaje);
        return j;
      } catch (e) {
        if (intento >= reintentos) {
          return {
            ok: false, codigo: 'RED',
            mensaje: 'No fue posible comunicarse con el servidor. Su trabajo sigue guardado en este navegador: revise su conexión e intente de nuevo.'
          };
        }
        await esperar(1000 * Math.pow(2, intento) + Math.random() * 600);
      }
    }
  }

  // Almacenamiento local tolerante a fallos (modo privado, cookies bloqueadas…)
  var almacen = {
    leer: function (clave) {
      try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : null; } catch (e) { return null; }
    },
    guardar: function (clave, valor) {
      try { localStorage.setItem(clave, JSON.stringify(valor)); return true; } catch (e) { return false; }
    },
    borrar: function (clave) {
      try { localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ }
    }
  };

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------

  function crear(etiqueta, atributos, hijos) {
    var n = document.createElement(etiqueta);
    if (atributos) Object.keys(atributos).forEach(function (k) {
      var v = atributos[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'texto') n.textContent = v;
      else if (k === 'clase') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else n.setAttribute(k, v);
    });
    (hijos || []).forEach(function (h) { if (h) n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h); });
    return n;
  }

  function icono(nombre, clase) {
    return crear('span', { clase: 'ico ' + (clase || ''), html: window.Iconos.svg(nombre) });
  }

  // ---------------------------------------------------------------------------
  // Tema: sistema → claro → oscuro (se recuerda en este navegador)
  // ---------------------------------------------------------------------------

  var CLAVE_TEMA = 'practicas:tema';
  var TEMAS = {
    sistema: { icono: 'monitor', texto: 'Tema: según el sistema', sig: 'claro' },
    claro: { icono: 'sol', texto: 'Tema: claro', sig: 'oscuro' },
    oscuro: { icono: 'luna', texto: 'Tema: oscuro', sig: 'sistema' }
  };

  function aplicarTema(t) {
    var raiz = document.documentElement;
    if (t === 'claro') raiz.setAttribute('data-theme', 'light');
    else if (t === 'oscuro') raiz.setAttribute('data-theme', 'dark');
    else raiz.removeAttribute('data-theme');
  }

  function conectarTema(boton) {
    if (!boton) return;
    var actual = almacen.leer(CLAVE_TEMA) || 'sistema';
    if (!TEMAS[actual]) actual = 'sistema';
    function pintar() {
      boton.innerHTML = window.Iconos.svg(TEMAS[actual].icono);
      boton.setAttribute('data-tip', TEMAS[actual].texto + ' · clic para cambiar');
      boton.setAttribute('aria-label', TEMAS[actual].texto);
    }
    aplicarTema(actual);
    pintar();
    boton.addEventListener('click', function () {
      actual = TEMAS[actual].sig;
      almacen.guardar(CLAVE_TEMA, actual);
      aplicarTema(actual);
      pintar();
      boton.classList.remove('girar');
      void boton.offsetWidth;
      boton.classList.add('girar');
      mostrarTooltip(boton);
    });
  }

  // ---------------------------------------------------------------------------
  // Notificaciones
  // ---------------------------------------------------------------------------

  var ICONO_TOAST = { exito: 'checkCirculo', error: 'alerta', info: 'info', aviso: 'alerta' };

  function toast(texto, tipo, nombreIcono) {
    tipo = tipo || 'info';
    var cont = document.getElementById('toasts');
    if (!cont) { cont = crear('div', { id: 'toasts', 'aria-live': 'polite' }); document.body.appendChild(cont); }
    var t = crear('div', { clase: 'toast toast-' + tipo }, [icono(nombreIcono || ICONO_TOAST[tipo]), crear('span', { texto: texto })]);
    cont.appendChild(t);
    setTimeout(function () { t.classList.add('saliendo'); }, 2600);
    setTimeout(function () { t.remove(); }, 3000);
  }

  // ---------------------------------------------------------------------------
  // Tooltips: un solo globo que sigue a cualquier elemento con data-tip
  // ---------------------------------------------------------------------------

  var globo = null, temporizadorTip = null, ultimoPuntero = 'mouse';

  function mostrarTooltip(el) {
    var texto = el.getAttribute('data-tip');
    if (!texto) return;
    if (!globo) { globo = crear('div', { id: 'tooltip', role: 'tooltip' }); document.body.appendChild(globo); }
    globo.textContent = texto;
    globo.classList.remove('visible', 'abajo');
    var r = el.getBoundingClientRect();
    var g = globo.getBoundingClientRect();
    var arriba = r.top - g.height - 10;
    var abajo = arriba < 8;
    var top = abajo ? r.bottom + 10 : arriba;
    var left = Math.min(Math.max(8, r.left + r.width / 2 - g.width / 2), window.innerWidth - g.width - 8);
    globo.style.top = top + 'px';
    globo.style.left = left + 'px';
    if (abajo) globo.classList.add('abajo');
    requestAnimationFrame(function () { globo.classList.add('visible'); });
  }

  function ocultarTooltip() {
    clearTimeout(temporizadorTip);
    if (globo) globo.classList.remove('visible');
  }

  document.addEventListener('pointerdown', function (e) { ultimoPuntero = e.pointerType; });
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return;
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (!el) return;
    clearTimeout(temporizadorTip);
    temporizadorTip = setTimeout(function () { mostrarTooltip(el); }, 220);
  });
  document.addEventListener('pointerout', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el && !el.contains(e.relatedTarget)) ocultarTooltip();
  });
  document.addEventListener('focusin', function (e) {
    var el = e.target.closest && e.target.closest('[data-tip]');
    if (el && ultimoPuntero !== 'touch' && el.matches(':focus-visible')) mostrarTooltip(el);
  });
  document.addEventListener('focusout', ocultarTooltip);
  window.addEventListener('scroll', ocultarTooltip, { passive: true });

  // ---------------------------------------------------------------------------
  // Celebración
  // ---------------------------------------------------------------------------

  function confeti() {
    if (sinMovimiento) return;
    var colores = ['#10B981', '#06B6D4', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6', '#22C55E'];
    var capa = crear('div', { clase: 'confeti', 'aria-hidden': 'true' });
    for (var i = 0; i < 110; i++) {
      var p = crear('i');
      p.style.left = (Math.random() * 100) + 'vw';
      p.style.background = colores[i % colores.length];
      p.style.setProperty('--x', (Math.random() * 240 - 120) + 'px');
      p.style.setProperty('--r', (Math.random() * 900 - 450) + 'deg');
      p.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      p.style.animationDelay = (Math.random() * 0.4) + 's';
      p.style.width = (6 + Math.random() * 6) + 'px';
      p.style.height = (8 + Math.random() * 10) + 'px';
      capa.appendChild(p);
    }
    document.body.appendChild(capa);
    setTimeout(function () { capa.remove(); }, 4500);
  }

  /** Anima un número desde 0 hasta `valor` con los decimales indicados. */
  function contar(el, valor, decimales, sufijo) {
    var fmt = function (v) {
      return v.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + (sufijo || '');
    };
    if (sinMovimiento || document.hidden) { el.textContent = fmt(valor); return; }
    var t0 = performance.now(), dur = 900, listo = false;
    function paso(t) {
      if (listo) return;
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(valor * e);
      if (k < 1) requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
    // Respaldo: si el navegador pausa la animación (pestaña en segundo plano), deja el valor final.
    setTimeout(function () { listo = true; el.textContent = fmt(valor); }, dur + 150);
  }

  // ---------------------------------------------------------------------------
  // Cronómetro: tiempo transcurrido desde el inicio
  // ---------------------------------------------------------------------------

  function iniciarReloj(elemento, inicio) {
    var t0 = new Date(inicio).getTime();
    if (isNaN(t0)) t0 = Date.now();
    function dos(n) { return (n < 10 ? '0' : '') + n; }
    function pintar() {
      var s = Math.max(0, Math.floor((Date.now() - t0) / 1000));
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
      elemento.textContent = (h ? h + ':' + dos(m) : dos(m)) + ':' + dos(ss);
    }
    pintar();
    return setInterval(pintar, 1000);
  }

  // ---------------------------------------------------------------------------
  // Barra de símbolos
  // ---------------------------------------------------------------------------

  var SIMBOLOS = [
    ['µ', 'micro (µ)'], ['°', 'grado (°)'], ['±', 'más o menos (±)'], ['·', 'punto medio (·)'], ['×', 'multiplicación (×)'],
    ['⁻¹', 'exponente −1'], ['²', 'al cuadrado'], ['³', 'al cubo']
  ];

  /** Barra que inserta símbolos en el último campo de texto enfocado dentro de `ambito`. */
  function barraSimbolos(ambito) {
    var barra = crear('div', { clase: 'simbolos' }, [crear('span', { clase: 'simbolos-etq' }, [icono('teclado'), 'Símbolos'])]);
    SIMBOLOS.forEach(function (s) {
      var b = crear('button', { type: 'button', clase: 'simbolo', texto: s[0], 'data-tip': 'Insertar ' + s[1], 'aria-label': 'Insertar ' + s[1] });
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function () { insertar(ambito, s[0]); });
      barra.appendChild(b);
    });
    return barra;
  }

  function insertar(ambito, texto) {
    var campo = ambito.__ultimoCampo;
    if (!campo || !ambito.contains(campo)) campo = ambito.querySelector('input[type="text"], textarea');
    if (!campo) return;
    var ini = campo.selectionStart == null ? campo.value.length : campo.selectionStart;
    var fin = campo.selectionEnd == null ? campo.value.length : campo.selectionEnd;
    campo.value = campo.value.slice(0, ini) + texto + campo.value.slice(fin);
    campo.focus();
    campo.setSelectionRange(ini + texto.length, ini + texto.length);
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** Recuerda el último campo de texto enfocado dentro de `ambito`. */
  function recordarFoco(ambito) {
    if (ambito.__recordando) return;
    ambito.__recordando = true;
    ambito.addEventListener('focusin', function (e) {
      if (e.target.matches('input[type="text"], textarea')) ambito.__ultimoCampo = e.target;
    });
  }

  function fecha(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });
  }

  window.Comun = {
    CATALOGO: CATALOGO,
    modoDemo: modoDemo,
    sinMovimiento: sinMovimiento,
    llamar: llamar,
    almacen: almacen,
    uuid: uuid,
    crear: crear,
    icono: icono,
    conectarTema: conectarTema,
    toast: toast,
    confeti: confeti,
    contar: contar,
    iniciarReloj: iniciarReloj,
    barraSimbolos: barraSimbolos,
    recordarFoco: recordarFoco,
    fecha: fecha
  };
})();
