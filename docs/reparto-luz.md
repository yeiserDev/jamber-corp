# Reparto interno de luz

Acuerdo confirmado el 30 de septiembre de 2026. Los nuevos registros de luz y los periodos que se editen utilizan `consumo-alumbrado-igv-v1`. Los registros históricos conservan sus importes hasta que se editen; el agua conserva su regla anterior.

Se consideran únicamente tres conceptos para academia (tipo `academia` o el tipo histórico `profesor`), panadería, spa y casa. Para los registros de luz se usan los locales activos, igual que en el formulario:

1. **Energía:** consumo del local en kWh por tarifa de energía del recibo.
2. **Alumbrado público:** importe del recibo dividido entre cuatro, incluso si un ocupante consume cero. Varios medidores del mismo local no generan cuotas adicionales.
3. **IGV:** IGV del recibo multiplicado por consumo del local / consumo total. No se recalcula el impuesto sobre la suma de energía y alumbrado.

Cada concepto se redondea a dos decimales antes de sumarlos. Se muestran el total distribuido y la diferencia respecto al recibo, sin cargar esa diferencia a casa ni a los locales. Esa diferencia incluye los conceptos excluidos y posibles centavos de redondeo. Si el alumbrado no se puede dividir exactamente en céntimos entre cuatro, las cuatro cuotas redondeadas permanecen iguales.

El consumo de casa se obtiene como consumo principal menos la suma de los submedidores. Se exigen los tres locales comerciales y casa; las lecturas faltantes no se interpretan como consumo cero.

## Cuenta de referencia: panadería, agosto de 2026

- Consumo: 494.28 kWh de un total de 706.80 kWh.
- Energía: 494.28 × S/ 0.6234 = **S/ 308.13**.
- Alumbrado: S/ 35.20 / 4 = **S/ 8.80**.
- IGV: S/ 86.47 × 494.28 / 706.80 = **S/ 60.47**.
- Total: **S/ 377.40**.

Verificación: `node --test scripts/test-reparto-luz.cjs`.
