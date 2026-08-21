# Sondeo Caiena

App de teléfono para sondear precios del catálogo Caiena en Maracaibo.

**En vivo:** https://nor2701.github.io/sondeo-caiena/

128 referencias con foto, teclado grande, y veredicto automático de si es
negocio (compara el precio de vitrina contra el costo puesto en Maracaibo).

## Sincronizar entre teléfonos

Sin conectar nada, la app guarda **solo en el teléfono** que la usa.
Para que lo que anote una persona lo vean todas, y caiga en el libro:

1. Abre el Sheet **SONDEO PRECIOS MARACAIBO - CAIENA** → Extensiones → Apps Script.
2. Pega todo `conector.gs`, guarda.
3. Implementar → Nueva implementación → Aplicación web.
   Ejecutar como **Yo**, acceso **Cualquier usuario**. Acepta el permiso.
4. Copia la URL que termina en `/exec` y pégala en la app, pestaña
   **Enviar → Sincronizar entre teléfonos**.

Después, el botón *"Copiar link para otro teléfono"* genera un link que ya
trae la conexión puesta: quien lo abra queda sincronizado sin configurar nada.

Los precios caen en las columnas H–K (mayoristas) y R (vitrina) de la hoja
SONDEO, y queda registro de quién anotó qué en la pestaña BITACORA.

## Archivos

- `index.html` — la app completa, con las 128 fotos embebidas. Sin dependencias.
- `conector.gs` — el Apps Script que conecta la app con el Sheet.
