let solicitudes = obtenerSolicitudes();
const idsEquipo = empleados
  .filter(e => e.idSupervisor === usuarioActivo.idEmpleado)
  .map(e => e.id);

const filtroEstado = document.getElementById("filtroEstado");
const modal = document.getElementById("modalRechazo");
let idSeleccionado = null;

// ===== Mostrar solicitudes del equipo =====
function mostrar() {
  const estado = filtroEstado.value;
  const delEquipo = solicitudes.filter(s => idsEquipo.includes(s.idEmpleado));
  const lista = delEquipo
    .filter(s => estado === "TODAS" || s.estado === estado)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  document.getElementById("contadorPendientes").textContent =
    delEquipo.filter(s => s.estado === "PENDIENTE").length;

  const tabla = document.getElementById("tablaSolicitudes");

  if (lista.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No hay solicitudes en esta categoría.</td></tr>`;
    return;
  }

  tabla.innerHTML = lista.map(s => {
    const emp = buscarEmpleado(s.idEmpleado);

    const acciones = s.estado === "PENDIENTE"
      ? `<div class="acciones-tabla">
           <button class="btn btn-exito btn-sm" data-accion="aprobar" data-id="${s.id}">Aprobar</button>
           <button class="btn btn-eliminar btn-sm" data-accion="rechazar" data-id="${s.id}">Rechazar</button>
         </div>`
      : `<span class="texto-secundario">${s.comentario || "Resuelta"}<br>${s.fechaResolucion ?? ""}</span>`;

    return `
      <tr>
        <td>${emp.nombres} ${emp.apellidos}</td>
        <td>${s.fecha.split("-").reverse().join("/")}</td>
        <td>${s.inicio} - ${s.fin}</td>
        <td>${s.horas}</td>
        <td>${s.motivo}</td>
        <td>${badgeSolicitud(s.estado)}</td>
        <td>${acciones}</td>
      </tr>`;
  }).join("");
}

// ===== Registrar la decisión (trazabilidad RNF-04) =====
function resolver(id, nuevoEstado, comentario) {
  const solicitud = solicitudes.find(s => s.id === id);
  solicitud.estado = nuevoEstado;
  solicitud.idSupervisor = usuarioActivo.idEmpleado;       // Quién decidió
  solicitud.fechaResolucion = new Date().toLocaleString("es-PE"); // Cuándo
  solicitud.comentario = comentario;
  guardarSolicitudes(solicitudes);

  const emp = buscarEmpleado(solicitud.idEmpleado);
  mostrarAlerta(
    `Solicitud de ${emp.nombres} ${emp.apellidos} ${nuevoEstado === "APROBADA" ? "aprobada" : "rechazada"}.`,
    nuevoEstado === "APROBADA" ? "exito" : "advertencia"
  );
  mostrar();
}

// ===== Delegación de eventos en la tabla =====
document.getElementById("tablaSolicitudes").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  const solicitud = solicitudes.find(s => s.id === id);
  const emp = buscarEmpleado(solicitud.idEmpleado);

  if (boton.dataset.accion === "aprobar") {
    const confirmado = confirm(`¿Aprobar ${solicitud.horas} h extras de ${emp.nombres} ${emp.apellidos}?`);
    if (confirmado) resolver(id, "APROBADA", "Aprobada");
  }

  if (boton.dataset.accion === "rechazar") {
    idSeleccionado = id;
    document.getElementById("modalDetalle").textContent =
      `${emp.nombres} ${emp.apellidos} · ${solicitud.horas} h · ${solicitud.motivo}`;
    document.getElementById("comentario").value = "";
    document.getElementById("errorModal").textContent = "";
    modal.classList.add("visible");
  }
});

// ===== Modal de rechazo =====
document.getElementById("btnCancelar").addEventListener("click", () => {
  modal.classList.remove("visible");
});

document.getElementById("btnConfirmarRechazo").addEventListener("click", () => {
  const comentario = document.getElementById("comentario").value.trim();

  if (comentario.length < 5) {
    document.getElementById("errorModal").textContent = "Escribe un motivo de al menos 5 caracteres.";
    return;
  }

  resolver(idSeleccionado, "RECHAZADA", comentario);
  modal.classList.remove("visible");
});

filtroEstado.addEventListener("change", mostrar);
mostrar();