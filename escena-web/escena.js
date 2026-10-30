// Escena 3D del cuarto. Se ejecuta dentro de la vista web de la app.
// No usa plantillas con comillas invertidas: el generador la incrusta como texto.
// Mensajes de la app -> escena: window.recibir(datos)
// Mensajes escena -> app: { tipo: "listo" } | { tipo: "tocar", id }
(function () {
  "use strict";
  var enviar = function (msg) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
  };

  var canvas = document.getElementById("escena");
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  var hemi = new THREE.HemisphereLight(0xffffff, 0x8a93a3, 0.75);
  var sun = new THREE.DirectionalLight(0xfff3e0, 0.75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 12 });
  scene.add(hemi, sun, sun.target);

  var roomMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
  var capMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  var glassMat = new THREE.MeshBasicMaterial({ color: 0xfff6dc, transparent: true, opacity: 0.85 });
  var veilMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
  var lam = function (c) { return new THREE.MeshLambertMaterial({ color: c }); };
  var pots = { white: lam(0xf1efe8), terra: lam(0xc4683f), red: lam(0x8c2d2a), coir: lam(0x7a5636), flower: lam(0xfbfbf5) };

  var built = false, center = new THREE.Vector3(), walls = [], plantGroups = {}, markers = {};
  var datos = null, selected = null;

  function box(w, h, d, x, y, z, mat, parent) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || roomMat);
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    m.castShadow = true; m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }
  function cyl(rt, rb, h, x, y, z, mat, parent, seg) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true; m.receiveShadow = true;
    (parent || scene).add(m);
    return m;
  }
  function leaf(len, wid, mat, parent) {
    var m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat);
    m.scale.set(wid, len, wid * 0.22);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  // ---------- Cuarto y muebles ----------
  function construirCuarto(c) {
    var W = c.w, D = c.d, H = c.h, T = 0.09, cap = 0.012, V = c.ventana;
    center.set(W / 2, 0.9, D / 2);
    sun.position.set(V.x0, 4.2, -3.2);
    sun.target.position.set(W / 2, 0, D / 2);

    box(W + 2 * T, 0.18, D + 2 * T, -T, -0.18, -T);

    function wall(name, nx, nz, build) {
      var g = new THREE.Group(); g.name = name; scene.add(g);
      build(g);
      walls.push({ group: g, normal: new THREE.Vector2(nx, nz) });
    }
    function guitar(g, z, y, s, uke) {
      var lo = cyl(0.17 * s, 0.17 * s, 0.07, 0, 0, 0, roomMat, g); lo.rotation.z = Math.PI / 2; lo.position.set(W - 0.06, y, z);
      var up = cyl(0.13 * s, 0.13 * s, 0.07, 0, 0, 0, roomMat, g); up.rotation.z = Math.PI / 2; up.position.set(W - 0.06, y + 0.21 * s, z);
      box(0.03, (uke ? 0.3 : 0.5) * s, 0.055, W - 0.075, y + 0.28 * s, z - 0.027, roomMat, g);
      box(0.03, 0.1 * s, 0.08, W - 0.075, y + (uke ? 0.58 : 0.78) * s, z - 0.04, roomMat, g);
    }

    wall("ventana", 0, -1, function (g) {
      box(V.x0 + T, H, T, -T, 0, -T, roomMat, g);
      box(W - V.x1 + T, H, T, V.x1, 0, -T, roomMat, g);
      box(V.x1 - V.x0, V.y0, T, V.x0, 0, -T, roomMat, g);
      box(V.x1 - V.x0, H - V.y1, T, V.x0, V.y1, -T, roomMat, g);
      box(W + 2 * T, cap, T, -T, H, -T, capMat, g);
      var glass = new THREE.Mesh(new THREE.PlaneGeometry(V.x1 - V.x0, V.y1 - V.y0), glassMat);
      glass.position.set((V.x0 + V.x1) / 2, (V.y0 + V.y1) / 2, -T / 2); g.add(glass);
      box(V.x1 - V.x0 + 0.1, 0.16, 0.08, V.x0 - 0.05, V.y1, 0, roomMat, g);
      box(0.03, V.y1 - V.y0, 0.03, (V.x0 + V.x1) / 2 - 0.015, V.y0, -0.03, roomMat, g);
      box(V.x1 - V.x0 + 0.1, 0.03, 0.12, V.x0 - 0.05, V.y0 - 0.03, 0, roomMat, g);
      var veil = new THREE.Mesh(new THREE.PlaneGeometry(0.38, V.y1 - V.y0 + 0.2), veilMat);
      veil.position.set(V.x1 - 0.05, (V.y0 + V.y1) / 2 - 0.03, 0.07); g.add(veil);
      box(0.4, 0.34, 0.025, 0.5, 1.42, 0, roomMat, g);
    });

    wall("fondo", 0, 1, function (g) {
      box(W + 2 * T, H, T, -T, 0, D, roomMat, g);
      box(W + 2 * T, cap, T, -T, H, D, capMat, g);
      box(0.8, 2.03, 0.04, 0.5, 0, D - 0.04, capMat, g);
      box(0.12, 0.025, 0.04, 1.12, 1.0, D - 0.08, roomMat, g);
      box(1.2, 2.25, 0.05, 1.55, 0, D - 0.05, capMat, g);
      box(0.012, 2.15, 0.02, 2.144, 0.05, D - 0.07, roomMat, g);
      box(0.32, 0.12, 0.02, 1.35, 2.38, D - 0.02, roomMat, g);
      box(0.32, 0.12, 0.02, 1.95, 2.38, D - 0.02, roomMat, g);
    });

    wall("izquierda", -1, 0, function (g) {
      box(T, H, D, -T, 0, 0, roomMat, g);
      box(T, cap, D + 2 * T, -T, H, -T, capMat, g);
    });

    wall("derecha", 1, 0, function (g) {
      box(T, H, D, W, 0, 0, roomMat, g);
      box(T, cap, D + 2 * T, W, H, -T, capMat, g);
      box(0.025, 0.2, 0.16, W - 0.025, 1.45, 0.18, roomMat, g);
      box(0.025, 0.14, 0.18, W - 0.025, 1.12, 0.12, roomMat, g);
      guitar(g, 0.55, 1.15, 1.0);
      guitar(g, 0.9, 1.2, 0.85);
      guitar(g, 1.18, 1.42, 0.55, true);
      guitar(g, 1.42, 0.98, 0.95);
      box(0.2, 0.03, 0.55, W - 0.2, 1.62, 1.6, roomMat, g);
      box(0.2, 0.03, 0.55, W - 0.2, 1.78, 2.2, roomMat, g);
      box(0.1, 0.14, 0.08, W - 0.12, 1.81, 2.3, roomMat, g);
      box(0.025, 1.25, 0.34, W - 0.025, 0.35, 2.04, capMat, g);
    });

    // Escritorio, monitor, torre
    box(1.72, 0.04, 0.62, 0.44, 0.71, 0);
    box(0.04, 0.71, 0.04, 2.1, 0, 0.55);
    box(0.04, 0.71, 0.04, 2.1, 0, 0.03);
    box(0.04, 0.71, 0.04, 0.48, 0, 0.55);
    box(0.55, 0.32, 0.03, 0.62, 0.9, 0.1);
    box(0.06, 0.16, 0.06, 0.86, 0.75, 0.1);
    box(0.44, 0.02, 0.14, 0.68, 0.75, 0.3);
    box(0.2, 0.45, 0.45, 0.6, 0, 0.06);
    // Mueble de la TV
    box(0.42, 0.62, 0.92, 0, 0, 0.04);
    box(0.01, 0.12, 0.38, 0.42, 0.42, 0.08, capMat);
    box(0.01, 0.12, 0.38, 0.42, 0.24, 0.08, capMat);
    box(0.05, 0.6, 1.0, 0.16, 0.66, 0.0);
    box(0.12, 0.04, 0.3, 0.12, 0.62, 0.35);
    // Estantería de cubos
    var sz0 = 1.28, sw = 1.47, sh = 1.47, i;
    box(0.39, 0.03, sw, 0, 0, sz0); box(0.39, 0.03, sw, 0, sh - 0.03, sz0);
    for (i = 1; i < 4; i++) box(0.39, 0.03, sw, 0, (sh / 4) * i, sz0);
    for (i = 0; i <= 4; i++) box(0.39, sh, 0.03, 0, 0, sz0 + (sw - 0.03) * (i / 4));
    box(0.02, sh, sw, 0, 0, sz0);
    [[0, 3], [1, 3], [2, 1], [3, 0], [0, 1], [2, 2]].forEach(function (cr) {
      box(0.32, sh / 4 - 0.08, sw / 4 - 0.08, 0.04, cr[1] * (sh / 4) + 0.05, sz0 + cr[0] * (sw / 4) + 0.05, capMat);
    });
    // Silla
    cyl(0.28, 0.28, 0.04, 0.95, 0.04, 1.05, roomMat);
    cyl(0.03, 0.03, 0.42, 0.95, 0.06, 1.05, roomMat);
    box(0.5, 0.09, 0.5, 0.7, 0.44, 0.8);
    box(0.5, 0.8, 0.09, 0.7, 0.5, 1.26);
    box(0.06, 0.2, 0.36, 0.66, 0.53, 0.84);
    box(0.06, 0.2, 0.36, 1.18, 0.53, 0.84);
    // Cama
    box(0.95, 0.3, 1.95, W - 0.95, 0, 0.05);
    box(0.95, 0.16, 1.92, W - 0.95, 0.3, 0.07);
    box(0.62, 0.11, 0.3, W - 0.8, 0.46, 0.1);
    box(0.97, 0.05, 1.35, W - 0.96, 0.46, 0.62);
  }

  // ---------- Plantas ----------
  var FORMAS = {
    espatifilo: function (g, m) {
      cyl(0.12, 0.1, 0.18, 0, 0, 0, pots.white, g);
      for (var i = 0; i < 16; i++) {
        var a = (i / 16) * Math.PI * 2 + (i % 2) * 0.2, tilt = 0.35 + (i % 3) * 0.17;
        var l = leaf(0.15, 0.055, m, g);
        l.position.set(Math.sin(a) * 0.08, 0.32 + (i % 3) * 0.03, Math.cos(a) * 0.08);
        l.rotation.set(Math.cos(a) * tilt, a, -Math.sin(a) * tilt);
      }
      for (var k = 0; k < 3; k++) {
        var b = k * 2.1;
        cyl(0.006, 0.006, 0.3, Math.sin(b) * 0.04, 0.18, Math.cos(b) * 0.04, m, g, 6);
        var f = leaf(0.06, 0.035, pots.flower, g);
        f.position.set(Math.sin(b) * 0.05, 0.53, Math.cos(b) * 0.05);
        f.rotation.y = b;
      }
    },
    monstera: function (g, m) {
      cyl(0.12, 0.1, 0.2, 0, 0, 0, pots.terra, g);
      cyl(0.025, 0.03, 1.0, 0, 0.15, 0, pots.coir, g, 8);
      for (var i = 0; i < 18; i++) {
        var a = i * 2.4, y = 0.28 + i * 0.048, r = 0.1 + (i % 2) * 0.02;
        var l = leaf(0.085, 0.065, m, g);
        l.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
        l.rotation.set(0.5, a, 0);
      }
    },
    "poto-colgante": function (g, m, alto) {
      var m2 = lam(0xa9cf6a);
      cyl(0.005, 0.005, Math.max(0.1, alto - 0.15), 0, 0.15, 0, roomMat, g, 4);
      cyl(0.13, 0.09, 0.15, 0, 0, 0, pots.white, g);
      for (var s = 0; s < 7; s++) {
        var a = (s / 7) * Math.PI * 2, len = 0.45 + (s % 3) * 0.22;
        for (var k = 0; k < 12; k++) {
          var t = k / 11, r = 0.12 + t * 0.12;
          var l = leaf(0.045, 0.04, k % 3 === 0 ? m2 : m, g);
          l.position.set(Math.sin(a) * r, 0.14 - t * len - Math.sin(t * 3) * 0.02, Math.cos(a) * r);
          l.rotation.set(0.9, a + k, 0);
        }
      }
      for (var i = 0; i < 10; i++) {
        var b = i * 0.63, q = leaf(0.05, 0.045, m, g);
        q.position.set(Math.sin(b) * 0.07, 0.17, Math.cos(b) * 0.07);
        q.rotation.set(0.8, b, 0);
      }
    },
    "poto-balda": function (g, m) {
      var m2 = lam(0xb8d77a);
      cyl(0.06, 0.05, 0.09, 0, 0, 0, pots.white, g);
      for (var i = 0; i < 9; i++) {
        var a = i * 0.7, l = leaf(0.04, 0.035, i % 3 ? m : m2, g);
        l.position.set(Math.sin(a) * 0.05, 0.11 + (i % 2) * 0.02, Math.cos(a) * 0.05);
        l.rotation.set(0.8, a, 0);
      }
      for (var s = 0; s < 3; s++) {
        var z0 = (s - 1) * 0.06;
        for (var k = 0; k < 6; k++) {
          var t = k / 5, q = leaf(0.035, 0.03, k % 2 ? m : m2, g);
          q.position.set(-0.07 - t * 0.04, 0.06 - t * 0.32, z0 + Math.sin(t * 4 + s) * 0.03);
          q.rotation.set(0.9, -Math.PI / 2 + k, 0);
        }
      }
    },
    lengua: function (g, m) {
      var edge = lam(0xb9c45a);
      cyl(0.12, 0.1, 0.2, 0, 0, 0, pots.white, g);
      for (var i = 0; i < 8; i++) {
        var a = (i / 8) * Math.PI * 2, h = 0.42 + (i % 3) * 0.12;
        var bl = new THREE.Mesh(new THREE.ConeGeometry(0.035, h, 4), i % 4 === 0 ? edge : m);
        bl.scale.z = 0.3;
        bl.position.set(Math.sin(a) * 0.04, 0.2 + h / 2, Math.cos(a) * 0.04);
        bl.rotation.set(Math.cos(a) * 0.12, a, -Math.sin(a) * 0.12);
        bl.castShadow = true;
        g.add(bl);
      }
    },
    areca: function (g, m) {
      var stem = lam(0xc0a44a);
      cyl(0.17, 0.13, 0.3, 0, 0, 0, pots.red, g);
      for (var f = 0; f < 9; f++) {
        var a = (f / 9) * Math.PI * 2, reach = 0.35 + (f % 3) * 0.1, top = 1.1 + (f % 2) * 0.35;
        var curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(0, 0.3, 0),
          new THREE.Vector3(Math.sin(a) * 0.05, top + 0.15, Math.cos(a) * 0.05),
          new THREE.Vector3(Math.sin(a) * reach, top - 0.25, Math.cos(a) * reach));
        g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.008, 4), stem));
        for (var k = 6; k < 20; k++) {
          var t = k / 20, pt = curve.getPoint(t), tan = curve.getTangent(t);
          [-1, 1].forEach(function (side) {
            var lf = leaf(0.11 * (1 - t * 0.5), 0.016, m, g);
            lf.position.copy(pt);
            var out = new THREE.Vector3(Math.cos(a) * side, -0.4, -Math.sin(a) * side).normalize();
            lf.position.addScaledVector(out, 0.07);
            lf.lookAt(pt.clone().add(tan));
            lf.rotateX(Math.PI / 2);
            lf.rotateZ(side * 1.1);
          });
        }
      }
    },
  };

  function marcador() {
    // Gota de agua flotante para las plantas que hay que regar
    var g = new THREE.Group();
    var mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    var s = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), mat);
    var c = new THREE.Mesh(new THREE.ConeGeometry(0.052, 0.09, 16), mat);
    c.position.y = 0.075;
    g.add(s, c);
    g.userData.mat = mat;
    g.visible = false;
    scene.add(g);
    return g;
  }

  function construirPlantas(lista, alturaTecho) {
    lista.forEach(function (p) {
      var g = new THREE.Group();
      g.position.set(p.x, p.base, p.z);
      g.userData.id = p.id;
      var pared = p.pared && walls.filter(function (w) { return w.group.name === p.pared; })[0];
      (pared ? pared.group : scene).add(g);
      var forma = FORMAS[p.forma] || FORMAS.espatifilo;
      forma(g, lam(p.color), alturaTecho - p.base);
      plantGroups[p.id] = g;
      markers[p.id] = marcador();
    });
  }

  var ringMat = new THREE.MeshBasicMaterial({ color: 0x2e6a44, transparent: true, opacity: 0.9 });
  var ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 40), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  // ---------- Cámara ----------
  var theta = 0.75, target = theta, velocity = 0, ELEV = 0.62, DIST = 10;
  function resize() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    var aspect = w / h, span = 2.7;
    if (aspect >= 1) { camera.left = -span * aspect; camera.right = span * aspect; camera.top = span; camera.bottom = -span; }
    else { camera.left = -span; camera.right = span; camera.top = span / aspect; camera.bottom = -span / aspect; }
    camera.updateProjectionMatrix();
  }
  function placeCamera() {
    var dir = new THREE.Vector3(Math.sin(theta) * Math.cos(ELEV), Math.sin(ELEV), Math.cos(theta) * Math.cos(ELEV));
    camera.position.copy(center).addScaledVector(dir, DIST);
    camera.lookAt(center);
    var view = new THREE.Vector2(Math.sin(theta), Math.cos(theta));
    walls.forEach(function (w) { w.group.visible = w.normal.dot(view) < -0.05; });
  }
  function visible(o) { for (var n = o; n; n = n.parent) if (!n.visible) return false; return true; }

  function girarHacia(id) {
    var g = plantGroups[id];
    if (!g) return;
    var wp = g.getWorldPosition(new THREE.Vector3());
    var want = Math.atan2(wp.x - center.x, wp.z - center.z);
    if (g.parent !== scene) want += Math.PI; // planta en una pared: esa pared al fondo
    var d = want - theta; d = Math.atan2(Math.sin(d), Math.cos(d));
    velocity = 0; target = theta + d;
  }

  function marcarSeleccion(id) {
    selected = id;
    var g = id && plantGroups[id];
    if (!g) { ring.visible = false; return; }
    var wp = g.getWorldPosition(new THREE.Vector3());
    ring.position.set(wp.x, wp.y + 0.005, wp.z);
    var p = datos.plantas.filter(function (x) { return x.id === id; })[0];
    ring.scale.setScalar(p && p.forma === "areca" ? 1.2 : p && p.forma === "poto-balda" ? 0.45 : 0.9);
    ring.visible = true;
  }

  // ---------- Entrada táctil ----------
  var dragging = false, lastX = 0, lastT = 0, moved = 0, downT = 0;
  canvas.addEventListener("pointerdown", function (e) {
    dragging = true; lastX = e.clientX; lastT = downT = performance.now(); moved = 0; velocity = 0;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var dx = e.clientX - lastX, now = performance.now(), k = 0.012;
    moved += Math.abs(dx);
    theta -= dx * k; target = theta;
    velocity = (-dx * k) / Math.max(1, now - lastT) * 16;
    lastX = e.clientX; lastT = now;
  });
  canvas.addEventListener("pointerup", function (e) {
    dragging = false;
    if (moved < 6 && performance.now() - downT < 500) tocar(e);
  });
  canvas.addEventListener("pointercancel", function () { dragging = false; });

  var raycaster = new THREE.Raycaster();
  function tocar(e) {
    var r = canvas.getBoundingClientRect();
    var ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    var grupos = Object.keys(plantGroups).map(function (k) { return plantGroups[k]; });
    var hits = raycaster.intersectObjects(grupos, true).filter(function (h) { return visible(h.object); });
    var id = null;
    if (hits.length) {
      var o = hits[0].object;
      while (o && !o.userData.id) o = o.parent;
      if (o) id = o.userData.id;
    }
    marcarSeleccion(id);
    enviar({ tipo: "tocar", id: id });
  }

  // ---------- Datos desde la app ----------
  window.recibir = function (d) {
    var primera = !built;
    datos = d;
    var t = d.tema;
    roomMat.color.set(t.cuarto);
    capMat.color.set(t.remate);
    ringMat.color.set(t.acento);
    hemi.intensity = t.oscuro ? 0.6 : 0.75;
    sun.intensity = t.oscuro ? 0.6 : 0.75;
    document.body.style.background = t.fondo;
    if (!built) {
      construirCuarto(d.cuarto);
      construirPlantas(d.plantas, d.cuarto.h);
      built = true;
      resize();
    }
    d.plantas.forEach(function (p) {
      var m = markers[p.id], g = plantGroups[p.id];
      var aviso = p.estado === "atrasada" || p.estado === "hoy";
      m.visible = aviso;
      if (aviso) {
        m.userData.mat.color.set(p.estado === "atrasada" ? t.atrasada : t.hoy);
        var wp = g.getWorldPosition(new THREE.Vector3());
        m.userData.base = new THREE.Vector3(wp.x, wp.y + p.alto + 0.18, wp.z);
      }
    });
    if (d.seleccion !== selected) {
      marcarSeleccion(d.seleccion);
      if (d.seleccion && !primera) girarHacia(d.seleccion);
    }
  };

  // ---------- Bucle ----------
  var reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function frame(t) {
    if (built) {
      if (!dragging) {
        if (Math.abs(velocity) > 0.0005) { theta += velocity; target = theta; velocity *= 0.92; }
        else { velocity = 0; theta += (target - theta) * (reduced ? 1 : 0.14); }
      }
      placeCamera();
      if (ring.visible) {
        var g = plantGroups[selected];
        ringMat.opacity = g && visible(g) ? (reduced ? 0.9 : 0.6 + 0.35 * Math.sin(t / 300)) : 0;
      }
      Object.keys(markers).forEach(function (id) {
        var m = markers[id];
        if (!m.visible || !m.userData.base) return;
        m.position.copy(m.userData.base);
        if (!reduced) m.position.y += Math.sin(t / 400 + id.length) * 0.04;
        var g = plantGroups[id];
        m.children.forEach(function (c) { c.visible = visible(g); });
      });
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);
  enviar({ tipo: "listo" });
})();
