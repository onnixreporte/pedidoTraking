'use client';

import { useEffect, useState } from 'react';
import { STATUS_LABELS, STATUSES_LINEAR_DELIVERY, type OrderType } from '@/lib/status';
import { SUCURSALES, SUCURSAL_LABELS } from '@/lib/sucursales';
import {
  autoTotal,
  emptyRow,
  serializeDetalle,
  validateRows,
  type DetalleRow,
} from '@/lib/order-detalle';

type SuccessLinks = { tracking: string; admin: string };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function NewOrderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  // Detalle estructurado: 1 fila vacía visible al abrir.
  const [rows, setRows] = useState<DetalleRow[]>([emptyRow()]);
  // El total se deriva de la suma de líneas (autoTotal) cuando este override es null.
  // Si el usuario lo edita a mano, guardamos su valor acá y respetamos ese valor.
  const [totalOverride, setTotalOverride] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [status, setStatus] =
    useState<(typeof STATUSES_LINEAR_DELIVERY)[number]>('ENVIADO_AL_NEGOCIO');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');

  // Campos de retiro
  const [sucursal, setSucursal] = useState('');
  const [fechaRetiro, setFechaRetiro] = useState('');
  const [horaRetiro, setHoraRetiro] = useState('');
  const [aviso, setAviso] = useState(false);

  const isRetiro = orderType === 'PASAR_A_RETIRAR';

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessLinks | null>(null);
  const [copied, setCopied] = useState<'tracking' | 'admin' | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const suggested = autoTotal(rows);
  const totalTouched = totalOverride !== null;
  // Valor mostrado/enviado: el override manual, o el auto-total en vivo.
  const total = totalTouched ? totalOverride : suggested > 0 ? String(suggested) : '';

  function updateRow(index: number, patch: Partial<DetalleRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    // Siempre dejamos al menos una fila visible.
    setRows((prev) => (prev.length <= 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (!cliente.trim()) return setError('Falta el nombre del cliente');

    const rowsValidation = validateRows(rows);
    if (!rowsValidation.ok) return setError(rowsValidation.error);
    const detalle = serializeDetalle(rows);

    // Validaciones por tipo
    if (isRetiro) {
      if (!sucursal) return setError('Elegí la sucursal de retiro');
      if (horaRetiro.trim() && !HHMM.test(horaRetiro.trim())) {
        return setError('Hora de retiro inválida (formato HH:mm)');
      }
      // R26: si el aviso está tildado, la hora es obligatoria.
      if (aviso && !horaRetiro.trim()) {
        return setError('Si activás el aviso, cargá la hora de retiro');
      }
    } else {
      if (!direccion.trim()) return setError('Falta la dirección');
    }

    const totalNum = parseInt(total.replace(/[^\d]/g, ''), 10);
    if (!Number.isFinite(totalNum) || totalNum <= 0) {
      return setError('Total inválido');
    }

    const needsEstimated = status !== 'ENVIADO_AL_NEGOCIO';
    const needsDelivery =
      !isRetiro && (status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO');

    const estimatedNum = parseInt(estimatedMinutes.replace(/[^\d]/g, ''), 10);
    if (needsEstimated && (!Number.isFinite(estimatedNum) || estimatedNum <= 0)) {
      return setError('Cargá el tiempo estimado en minutos');
    }

    const deliveryNum = parseInt(deliveryFee.replace(/[^\d]/g, ''), 10);
    if (needsDelivery && (!Number.isFinite(deliveryNum) || deliveryNum < 0)) {
      return setError('Cargá el costo del delivery');
    }

    setBusy(true);
    try {
      // El modal usa los nombres del wire de Botmaker para no divergir del contrato;
      // el preprocess Zod del endpoint los normaliza. DELIVERY no envía tipo_pedido
      // (back-compat con la acción Botmaker vieja).
      const payload: Record<string, unknown> = {
        cliente: cliente.trim(),
        detalle: detalle.trim(),
        total: totalNum,
      };
      if (isRetiro) {
        payload.tipo_pedido = 'retiro';
        payload.sucursal_seleccionada = sucursal;
        if (fechaRetiro.trim()) payload.fecha_retiro = fechaRetiro.trim();
        if (horaRetiro.trim()) payload.hora = horaRetiro.trim();
        if (aviso) payload.aviso = true;
      } else {
        payload.direccion = direccion.trim();
      }
      if (telefono.trim()) payload.telefono = telefono.trim();
      if (nota.trim()) payload.aditionalnota = nota.trim();
      if (status !== 'ENVIADO_AL_NEGOCIO') payload.status = status;
      if (needsEstimated && Number.isFinite(estimatedNum)) {
        payload.estimatedMinutes = estimatedNum;
      }
      if (needsDelivery && Number.isFinite(deliveryNum)) {
        payload.deliveryFee = deliveryNum;
      }

      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.message ?? 'No se pudo crear el pedido');
        return;
      }

      const data = (await res.json()) as { link_tracking: string; link_admin: string };
      setSuccess({ tracking: data.link_tracking, admin: data.link_admin });
      onCreated();
    } catch {
      setError('Error de red. Reintentá.');
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(key: 'tracking' | 'admin', url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(key);
      setTimeout(() => setCopied((cur) => (cur === key ? null : cur)), 2000);
    } catch {
      window.prompt('Copiá manualmente el link:', url);
    }
  }

  async function shareTracking(url: string) {
    const text = `Hola ${cliente.trim() || 'cliente'}, seguí tu pedido en vivo: ${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Tu pedido', text, url });
        return;
      } catch {
        // fallback
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }

  const totalNum = parseInt(total.replace(/[^\d]/g, ''), 10) || 0;
  // Solo cuando el usuario pisó el total a mano y difiere de la suma de líneas
  // le ofrecemos volver al auto-total.
  const showSuggestion = !success && totalTouched && suggested > 0 && suggested !== totalNum;

  const needsEstimated = status !== 'ENVIADO_AL_NEGOCIO';
  const needsDelivery = !isRetiro && (status === 'REPARTIDOR_EN_CAMINO' || status === 'ENTREGADO');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        {!success ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1f1f1f]">Nuevo pedido</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#8a8a8a] hover:bg-black/5 hover:text-[#1f1f1f]"
                aria-label="Cerrar"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L8.586 10l-3.775 3.775a1 1 0 1 0 1.414 1.414L10 11.414l3.775 3.775a1 1 0 0 0 1.414-1.414L11.414 10l3.775-3.775a1 1 0 0 0-1.414-1.414L10 8.586 6.225 4.811Z" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-[#5a5a5a]">
              Cargá un pedido que llegó por teléfono, redes o en persona.
            </p>

            <form onSubmit={submit} className="space-y-3">
              {/* Tipo de pedido — primer control del form (reorganiza el resto) */}
              <Field label="Tipo de pedido">
                <div className="flex gap-2">
                  {(
                    [
                      ['DELIVERY', '🛵 Delivery'],
                      ['PASAR_A_RETIRAR', '🏪 Pasar a retirar'],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setOrderType(value);
                        // Al pasar a retiro, los estados avanzados de delivery no aplican:
                        // reseteamos a ENVIADO si el estado actual no es compartido.
                        if (
                          value === 'PASAR_A_RETIRAR' &&
                          status !== 'ENVIADO_AL_NEGOCIO' &&
                          status !== 'ACEPTADO'
                        ) {
                          setStatus('ENVIADO_AL_NEGOCIO');
                        }
                      }}
                      disabled={busy}
                      className={[
                        'flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition disabled:opacity-50',
                        orderType === value
                          ? 'border-[#066731] bg-[#066731] text-white'
                          : 'border-black/10 bg-white text-[#5a5a5a] hover:bg-[#fcf9f2]',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Cliente *">
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  required
                  disabled={busy}
                  placeholder="Nombre del cliente"
                  className="input-base w-full !py-2 text-sm"
                />
              </Field>

              <Field label="Teléfono">
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  disabled={busy}
                  placeholder="0981 123 456"
                  className="input-base w-full !py-2 text-sm"
                />
              </Field>

              {!isRetiro && (
                <Field label="Dirección *">
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    required
                    disabled={busy}
                    placeholder="Calle, número, barrio"
                    className="input-base w-full !py-2 text-sm"
                  />
                </Field>
              )}

              {isRetiro && (
                <>
                  <Field label="Sucursal *">
                    <select
                      value={sucursal}
                      onChange={(e) => setSucursal(e.target.value)}
                      required
                      disabled={busy}
                      className="input-base w-full !py-2 text-sm"
                    >
                      <option value="">Elegí la sucursal…</option>
                      {SUCURSALES.map((code) => (
                        <option key={code} value={code}>
                          {SUCURSAL_LABELS[code]}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Fecha de retiro">
                    <input
                      type="date"
                      value={fechaRetiro}
                      onChange={(e) => setFechaRetiro(e.target.value)}
                      disabled={busy}
                      className="input-base w-full !py-2 text-sm"
                    />
                  </Field>

                  <Field
                    label={aviso ? 'Hora de retiro *' : 'Hora de retiro'}
                    hint={aviso ? 'Obligatoria porque el aviso está activado' : undefined}
                  >
                    <input
                      type="time"
                      value={horaRetiro}
                      onChange={(e) => setHoraRetiro(e.target.value)}
                      required={aviso}
                      disabled={busy}
                      className="input-base w-full !py-2 text-sm"
                    />
                  </Field>

                  <Field label="Aviso al cliente">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1f1f1f]">
                      <input
                        type="checkbox"
                        checked={aviso}
                        onChange={(e) => setAviso(e.target.checked)}
                        disabled={busy}
                        className="h-4 w-4 rounded border-black/20 text-[#066731] focus:ring-[#066731]"
                      />
                      Avisar al cliente cuando esté listo para retirar
                    </label>
                  </Field>
                </>
              )}

              <Field label="Detalle del pedido *" hint="Cargá un ítem por fila.">
                <div className="space-y-2">
                  {/* Encabezado de columnas (oculto en pantallas muy chicas) */}
                  <div className="hidden grid-cols-[3rem_1fr_5.5rem_1.75rem] gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8a8a8a] sm:grid">
                    <span>Cant.</span>
                    <span>Producto</span>
                    <span>Gs.</span>
                    <span aria-hidden />
                  </div>

                  {rows.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[3rem_1fr_5.5rem_1.75rem] items-center gap-1.5"
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.cantidad}
                        onChange={(e) => updateRow(i, { cantidad: e.target.value })}
                        disabled={busy}
                        placeholder="1"
                        aria-label={`Cantidad ítem ${i + 1}`}
                        className="input-base w-full !px-2 !py-2 text-center text-sm"
                      />
                      <input
                        type="text"
                        value={row.producto}
                        onChange={(e) => updateRow(i, { producto: e.target.value })}
                        disabled={busy}
                        placeholder="Empanada de pollo"
                        aria-label={`Producto ítem ${i + 1}`}
                        className="input-base w-full !px-2 !py-2 text-sm"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.precio}
                        onChange={(e) => updateRow(i, { precio: e.target.value })}
                        disabled={busy}
                        placeholder="12.000"
                        aria-label={`Precio ítem ${i + 1}`}
                        className="input-base w-full !px-2 !py-2 text-right text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={busy}
                        aria-label={`Quitar ítem ${i + 1}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8a8a8a] transition hover:bg-[#b4191e]/10 hover:text-[#b4191e] disabled:opacity-50"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M6.225 4.811a1 1 0 0 0-1.414 1.414L8.586 10l-3.775 3.775a1 1 0 1 0 1.414 1.414L10 11.414l3.775 3.775a1 1 0 0 0 1.414-1.414L11.414 10l3.775-3.775a1 1 0 0 0-1.414-1.414L10 8.586 6.225 4.811Z" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addRow}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#066731] transition hover:text-[#055527] disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
                    </svg>
                    Agregar ítem
                  </button>
                </div>
              </Field>

              <Field
                label="Total Gs. *"
                hint="Se calcula solo sumando los ítems. Podés editarlo a mano."
              >
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={total}
                    onChange={(e) => setTotalOverride(e.target.value)}
                    required
                    disabled={busy}
                    placeholder="22000"
                    className="input-base flex-1 !py-2 text-sm"
                  />
                  {showSuggestion && (
                    <button
                      type="button"
                      onClick={() => setTotalOverride(null)}
                      className="whitespace-nowrap text-xs font-medium text-[#066731] underline"
                    >
                      Usar Gs. {suggested.toLocaleString('es-PY')}
                    </button>
                  )}
                </div>
              </Field>

              <Field label="Estado inicial">
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as (typeof STATUSES_LINEAR_DELIVERY)[number])
                  }
                  disabled={busy}
                  className="input-base w-full !py-2 text-sm"
                >
                  {/* En retiro solo ofrecemos estados compartidos pre-split (ENVIADO/ACEPTADO);
                      los estados avanzados se alcanzan desde el panel via PATCH. */}
                  {STATUSES_LINEAR_DELIVERY.filter(
                    (s) => !isRetiro || s === 'ENVIADO_AL_NEGOCIO' || s === 'ACEPTADO',
                  ).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label={needsEstimated ? 'Tiempo estimado (minutos) *' : 'Tiempo estimado (minutos)'}
                hint={!needsEstimated ? 'Se habilita al elegir un estado avanzado' : undefined}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  disabled={busy || !needsEstimated}
                  required={needsEstimated}
                  placeholder="30"
                  className="input-base w-full !py-2 text-sm disabled:opacity-50"
                />
              </Field>

              {!isRetiro && (
                <Field
                  label={needsDelivery ? 'Precio delivery Gs. *' : 'Precio delivery Gs.'}
                  hint={!needsDelivery ? 'Se habilita desde "Repartidor en camino"' : undefined}
                >
                  <input
                    type="text"
                    inputMode="numeric"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    disabled={busy || !needsDelivery}
                    required={needsDelivery}
                    placeholder="10000"
                    className="input-base w-full !py-2 text-sm disabled:opacity-50"
                  />
                </Field>
              )}

              <Field label="Nota especial del cliente">
                <input
                  type="text"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  disabled={busy}
                  placeholder="Ej: tocar timbre 2 veces"
                  className="input-base w-full !py-2 text-sm"
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-[#b4191e]/10 px-3 py-2 text-sm text-[#b4191e]">
                  {error}
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex-1 rounded-xl bg-[#066731] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#055527] disabled:opacity-50"
                >
                  {busy ? 'Creando…' : 'Crear pedido'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#5a5a5a] hover:bg-[#fcf9f2] disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#066731]/10 text-[#066731]">
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 0 1 .006 1.415l-7.5 7.55a1 1 0 0 1-1.42 0L3.29 9.755a1 1 0 1 1 1.42-1.41l3.79 3.81 6.79-6.84a1 1 0 0 1 1.414-.025Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1f1f1f]">¡Pedido creado!</h2>
                <p className="text-sm text-[#5a5a5a]">
                  Compartí los links con cliente y repartidor.
                </p>
              </div>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
                👤 Para el cliente (tracking)
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={success.tracking}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 truncate rounded-lg border border-black/10 bg-[#fcf9f2] px-3 py-2 text-xs text-[#1f1f1f]"
                />
                <button
                  onClick={() => copyLink('tracking', success.tracking)}
                  className={[
                    'rounded-lg px-3 py-2 text-xs font-semibold transition',
                    copied === 'tracking'
                      ? 'bg-[#066731]/10 text-[#066731]'
                      : 'bg-[#066731] text-white hover:bg-[#055527]',
                  ].join(' ')}
                >
                  {copied === 'tracking' ? '✓' : 'Copiar'}
                </button>
              </div>
              <button
                onClick={() => shareTracking(success.tracking)}
                className="mt-2 w-full rounded-lg border border-[#066731] bg-white px-3 py-2 text-xs font-semibold text-[#066731] hover:bg-[#066731]/5"
              >
                📱 Compartir con cliente por WhatsApp
              </button>
            </div>

            <div className="mb-4">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#5a5a5a]">
                🚚 Para el repartidor (admin)
              </p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={success.admin}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 truncate rounded-lg border border-black/10 bg-[#fcf9f2] px-3 py-2 text-xs text-[#1f1f1f]"
                />
                <button
                  onClick={() => copyLink('admin', success.admin)}
                  className={[
                    'rounded-lg px-3 py-2 text-xs font-semibold transition',
                    copied === 'admin'
                      ? 'bg-[#066731]/10 text-[#066731]'
                      : 'bg-[#066731] text-white hover:bg-[#055527]',
                  ].join(' ')}
                >
                  {copied === 'admin' ? '✓' : 'Copiar'}
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-[#1f1f1f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black"
            >
              Listo
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#1f1f1f]">{label}</label>
      {hint && <p className="mb-1 text-xs text-[#8a8a8a]">{hint}</p>}
      {children}
    </div>
  );
}
