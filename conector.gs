/**
 * Conector entre la app "Sondeo Caiena" y el Google Sheet
 * "SONDEO PRECIOS MARACAIBO - CAIENA".
 *
 * Qué hace: la app del teléfono le pide y le manda precios a esta hoja.
 * Cada precio que anota alguien cae directo en la columna que le toca,
 * y queda registrado en la pestaña BITACORA (quién, cuándo, qué).
 *
 * Cómo instalarlo (4 pasos, una sola vez):
 *   1. Abre la hoja  →  Extensiones  →  Apps Script.
 *   2. Borra lo que haya y pega TODO este archivo. Guarda (el disquete).
 *   3. Implementar  →  Nueva implementación  →  tipo "Aplicación web".
 *      Ejecutar como: Yo.   Quién tiene acceso: Cualquier usuario.
 *      Google te va a pedir permiso una vez: acéptalo.
 *   4. Copia la URL que termina en /exec y pégala en la app,
 *      pestaña ENVIAR → "Sincronizar entre teléfonos".
 *
 * Para apagarlo: Implementar → Administrar implementaciones → Inhabilitar.
 */

var ID   = '10j5kNpa4oluciVR7gzWs5JBnCmJBBv9NfRO-wnH0UEo';
var HOJA = 'SONDEO';
var R0   = 6;    // primera fila de producto
var RN   = 133;  // última fila de producto
var COL  = {m0:8, m1:9, m2:10, m3:11, v:18};   // H, I, J, K y R

function doGet(e) {
  var p = (e && e.parameter) || {};
  var cb = String(p.cb || 'cb').replace(/[^A-Za-z0-9_$]/g, '');
  var out;
  try {
    out = despachar(p);
  } catch (err) {
    out = { ok: false, error: String(err && err.message || err) };
  }
  return ContentService
    .createTextOutput(cb + '(' + JSON.stringify(out) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function despachar(p) {
  var ss = SpreadsheetApp.openById(ID);
  var sh = ss.getSheetByName(HOJA);
  if (!sh) throw new Error('No encuentro la pestaña ' + HOJA);

  if (p.op === 'get') return leer(sh);

  if (p.op === 'set') {
    var col = COL[p.f];
    if (!col) throw new Error('Campo desconocido');
    var fila = R0 + Number(p.i);
    if (!(fila >= R0 && fila <= RN)) throw new Error('Producto fuera de rango');
    var val = (p.val === '' || p.val == null) ? '' : Number(p.val);
    if (val !== '' && !(val >= 0 && val < 100000)) throw new Error('Precio fuera de rango');

    var lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      sh.getRange(fila, col).setValue(val);
      SpreadsheetApp.flush();
      anotarBitacora(ss, p, fila);
    } finally {
      lock.releaseLock();
    }
    return leer(sh);
  }

  if (p.op === 'names') {
    var n = [[p.t0 || 'Tienda 1', p.t1 || 'Tienda 2', p.t2 || 'Tienda 3', p.t3 || 'Tienda 4']];
    sh.getRange(5, 8, 1, 4).setValues(n);
    SpreadsheetApp.flush();
    return leer(sh);
  }

  throw new Error('Operación desconocida');
}

function leer(sh) {
  var n   = RN - R0 + 1;
  var may = sh.getRange(R0, 8, n, 4).getValues();     // H..K
  var vit = sh.getRange(R0, 18, n, 1).getValues();    // R
  var nom = sh.getRange(5, 8, 1, 4).getValues()[0];   // H5..K5

  var d = {};
  for (var k = 0; k < n; k++) {
    var o = {};
    for (var j = 0; j < 4; j++) {
      var v = may[k][j];
      if (v !== '' && v !== null && !isNaN(v)) o['m' + j] = Number(v);
    }
    var w = vit[k][0];
    if (w !== '' && w !== null && !isNaN(w)) o.v = Number(w);
    if (Object.keys(o).length) d[k] = o;
  }

  return {
    ok: true,
    d: d,
    tiendas: nom.map(function (x, i) { return String(x || ('Tienda ' + (i + 1))); }),
    trm: Number(sh.getRange('D2').getValue()) || 3053.48,
    flete: Number(sh.getRange('G2').getValue()) || 0
  };
}

/**
 * Deja bonitas las columnas TELÉFONO / DÓNDE QUEDA / NOTAS de la hoja RESUMEN
 * (las agregué a mano y quedaron sin color). Se corre UNA vez, desde el editor:
 * elige "formatoResumen" en el selector de funciones y dale a Ejecutar.
 */
function formatoResumen() {
  var rs = SpreadsheetApp.openById(ID).getSheetByName('RESUMEN');
  if (!rs) throw new Error('No encuentro la pestaña RESUMEN');

  rs.getRange('A17:H17').merge()
    .setBackground('#6B4F1D').setFontColor('#FFFFFF')
    .setFontWeight('bold').setHorizontalAlignment('center');

  rs.getRange('F18:H18')
    .setBackground('#C9A227').setFontColor('#000000')
    .setFontWeight('bold').setFontSize(9)
    .setHorizontalAlignment('center').setVerticalAlignment('middle')
    .setWrap(true);

  rs.getRange('F19:H22')
    .setBackground('#FFF9E7').setFontColor('#0000FF')
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('left')
    .setNumberFormat('@');   // texto: no se come el 0 de "0414..."

  rs.getRange('A18:H22').setBorder(true, true, true, true, true, true,
    '#BFBFBF', SpreadsheetApp.BorderStyle.SOLID);

  SpreadsheetApp.flush();
  return 'Listo';
}

function anotarBitacora(ss, p, fila) {
  var b = ss.getSheetByName('BITACORA');
  if (!b) {
    b = ss.insertSheet('BITACORA');
    b.appendRow(['Cuándo', 'Quién', 'Producto', 'Fila', 'Campo', 'Valor']);
    b.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#6B4F1D').setFontColor('#FFFFFF');
    b.setFrozenRows(1);
    b.setColumnWidth(1, 150); b.setColumnWidth(3, 200);
  }
  var sh = ss.getSheetByName(HOJA);
  var nombre = sh.getRange(fila, 3).getValue();
  var etiqueta = (p.f === 'v') ? 'Precio de vitrina'
               : ('Mayorista ' + (Number(p.f.substring(1)) + 1));
  b.appendRow([new Date(), String(p.who || 'sin nombre').substring(0, 40),
               nombre, fila, etiqueta, (p.val === '' ? '(borrado)' : Number(p.val))]);
}
