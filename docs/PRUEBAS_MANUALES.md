# Pruebas manuales en el teléfono (Etapa 6)

Marca cada punto. Si algo falla, anota el número de prueba y lo que viste.
Haz las pruebas en orden: las últimas aprovechan los datos de las primeras.

## A. Primer arranque
- [ ] **A1** Instalación nueva (o borrando datos de Expo Go): aparece la pantalla de nombre.
- [ ] **A2** "Empezar" está desactivado con el campo vacío o solo con espacios.
- [ ] **A3** Con un nombre, llegas al Dashboard con "Hola, [nombre]. ¡Es hora de entrenar!" y la fecha de hoy.
- [ ] **A4** Dashboard sin sesiones: "Última sesión" muestra el mensaje vacío; Progresión pide terminar una sesión; el mapa muscular aparece todo en gris.

## B. Registro de una sesión
- [ ] **B1** "Nueva sesión" abre el cronómetro corriendo.
- [ ] **B2** Buscar "banca" y "bench" encuentra press de banca. Buscar con acento y sin acento da lo mismo.
- [ ] **B3** El filtro por músculo (chips) reduce la lista.
- [ ] **B4** Un ejercicio nuevo dice "Este será tu primer registro de este ejercicio" y la columna Anterior muestra "—".
- [ ] **B5** Completar una serie con 60 kg × 10: el volumen del ejercicio y el de la sesión suben (600 kg).
- [ ] **B6** Intentar completar con 0 repeticiones: no se completa y el campo se marca en rojo.
- [ ] **B7** Peso vacío o 0 con 12 repeticiones (peso corporal): sí se completa.
- [ ] **B8** Escribir el peso con coma ("62,5") funciona como 62.5.
- [ ] **B9** RIR: cada toque recorre – → 3 → 2 → 1 → 0 → –. Al llegar a 0 se marca Fallo (F).
- [ ] **B10** Marcar F pone el RIR en 0. Poner RIR 2 después desmarca F.
- [ ] **B11** "+ Agregar serie" copia el peso y las repeticiones de la anterior.
- [ ] **B12** Mantener pulsado el número de una serie la elimina y las demás se renumeran.
- [ ] **B13** Una serie completada no se puede editar hasta desmarcarla.
- [ ] **B14** Mantener pulsado el nombre de un ejercicio ofrece quitarlo.
- [ ] **B15** Dejar series sin completar y finalizar: se descartan; el resumen no las cuenta.
- [ ] **B16** Finalizar sin ninguna serie completada: avisa y no guarda.
- [ ] **B17** Finalizar pide confirmación; "Seguir entrenando" no guarda nada.

## C. Que no se pierda nada (lo más importante)
- [ ] **C1** A media sesión, con una serie completada: pulsa "Minimizar". El Dashboard muestra "Sesión en curso" y el botón "Reanudar sesión".
- [ ] **C2** Reanudar: todo sigue igual (ejercicios, valores, series completadas) y el cronómetro sigue contando.
- [ ] **C3** Con la sesión abierta, completa una serie, espera 2 segundos y **cierra la app deslizándola** de las recientes. Ábrela: el Dashboard muestra la sesión en curso con esa serie.
- [ ] **C4** Igual que C3, pero saliendo a la pantalla de inicio del teléfono (sin cerrar) y volviendo después de unos minutos.
- [ ] **C5** Cierra la app **justo** después de teclear un valor (menos de medio segundo). Es posible que ese último valor no se guarde; todo lo anterior sí. Esto es lo esperado.
- [ ] **C6** "Descartar sesión" pide confirmación y, al aceptar, el Dashboard vuelve a "Nueva sesión".
- [ ] **C7** Finalizar una sesión, cerrar la app por completo y abrirla: la sesión sigue en "Última sesión", y no reaparece como sesión en curso.
- [ ] **C8** Apagar y volver a encender el teléfono: los datos siguen ahí.

## D. Comparación y récords (necesita 2 sesiones del mismo ejercicio)
Sesión 1: Press de banca 3 × (60 kg × 10). Sesión 2: mismo ejercicio.
- [ ] **D1** Aparece el bloque "Última sesión" con fecha, series, mejor serie y volumen.
- [ ] **D2** La columna Anterior muestra "60 kg × 10" en cada serie.
- [ ] **D3** Con 65 kg × 10: `▲ +5 kg` en verde y 🏆 "Nuevo peso máximo"; la serie lleva la marca PR.
- [ ] **D4** Con 60 kg × 10 otra vez: `= igual`, sin PR.
- [ ] **D5** Con 60 kg × 8: `▼ -2 rep` en rojo.
- [ ] **D6** Con 65 kg × 7: aparece en rojo (peso arriba pero caída fuerte de rendimiento).
- [ ] **D7** Con 60 kg × 12: 🏆 "Más repeticiones con 60 kg".
- [ ] **D8** Una cuarta serie, donde antes solo había tres, dice "nueva".
- [ ] **D9** El resumen "Hoy: +X kg de volumen" coincide con tu cuenta.
- [ ] **D10** Un ejercicio distinto, que nunca hiciste, no muestra comparación ni PR.

## E. Dashboard
- [ ] **E1** La tarjeta de última sesión coincide con lo registrado (duración, ejercicios, series, volumen, músculos).
- [ ] **E2** Progresión: los chips muestran solo ejercicios con historial; las pestañas Peso / Reps / Volumen / RIR cambian la gráfica.
- [ ] **E3** Con una sola sesión, la gráfica muestra un punto y un aviso. Con dos o más, una línea.
- [ ] **E4** La tabla "Últimas sesiones" muestra la diferencia de volumen contra la anterior.
- [ ] **E5** El mapa muestra las dos figuras (frente y espalda). Los músculos que entrenaste están en naranja.
- [ ] **E6** Tocar un músculo muestra su detalle; volver a tocarlo lo deselecciona.
- [ ] **E7** Cambiar entre 7 días, 30 días y Todo cambia los colores de forma coherente.
- [ ] **E8** Un músculo no entrenado dice "Sin entrenamiento registrado en este periodo".
- [ ] **E9** Un ejercicio solo de peso corporal deja su músculo en naranja bajo, no en gris.

## F. Uso real
- [ ] **F1** Entrena una sesión de verdad (4-5 ejercicios, 15 series). Registrar una serie debe tomar pocos segundos.
- [ ] **F2** El teclado no tapa los campos que estás editando.
- [ ] **F3** Con la lista larga, el desplazamiento es fluido.
- [ ] **F4** Rota el teléfono y bloquea la pantalla a mitad de sesión: nada se pierde.

## Resultado
Fecha: ______  Dispositivo: ______  Versión de Expo Go: ______
Pruebas fallidas: ______
