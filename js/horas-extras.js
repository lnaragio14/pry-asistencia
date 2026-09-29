const empleado = buscarEmpleado(usuarioActivo.idEmpleado);
let solicitudes = obtenerSolicitudes();

const campoFecha = document.getElementById("fecha");
const campoInicio = document.getElementById("inicio");
const campoFin = document.getElementById("fin");
const campoMotivo = document.getElementById("motivo");

// No permitir fechas futuras: las horas extras se solicitan después de trabajarlas
campoFecha.max = hoy;

// ===== Calcular horas en vivo =====
function calcularHoras() {
  if (campoInicio.value === "" || campoFin.value === "") return 0;
  return (aMinutos(campoFin.value) - aMinutos(campoInicio.value)) / 60;
}

function actualizarTotal() {
  const horas = calcularHoras();
  document.getElementById("totalHoras").textContent =
    horas > 0 ? horas.toFixed(2) + " h" : "0 h";
}
campoInicio.addEventListener("change", actualizarTotal);
campoFin.addEventListener("change", actualizarTotal);

// ===== Enviar solicitud =====
document.getElementById("formSolicitud").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const fecha = campoFecha.value;
  const inicio = campoInicio.value;
  const fin = campoFin.value;
  const motivo = campoMotivo.value.trim();
  const horas = calcularHoras();

  // Validaciones
  if (fecha === "" || inicio === "" || fin === "" || motivo === "") {
    mostrarAlerta("Completa todos los campos.", "error");
    return;
  }
  if (fecha > hoy) {
    mostrarAlerta("No puedes solicitar horas extras de una fecha futura.", "error");
    return;
  }
  if (horas <= 0) {
    mostrarAlerta("La hora de fin debe ser mayor que la hora de inicio.", "error");
    return;
  }
  if (horas > 4) {
    mostrarAlerta("Una solicitud no puede superar las 4 horas.", "error");
    return;
  }
  if (motivo.length < 10) {
    mostrarAlerta("El motivo debe tener al menos 10 caracteres.", "error");
    return;
  }

  // Crear la solicitud en estado PENDIENTE
  solicitudes.push({
    id: Date.now(),
    idEmpleado: empleado.id,
    fecha: fecha,
    inicio: inicio,
    fin: fin,
    horas: Number(horas.toFixed(2)),
    motivo: motivo,
    estado: "PENDIENTE"
  });
  guardarSolicitudes(solicitudes);

  mostrarAlerta("Solicitud enviada. Tu supervisor la revisará.", "exito");
  evento.target.reset();
  actualizarTotal();
  mostrarTabla();
});

// ===== Tabla de mis solicitudes =====
function mostrarTabla() {
  const tabla = document.getElementById("tablaSolicitudes");
  const mias = solicitudes
    .filter(s => s.idEmpleado === empleado.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  if (mias.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5">No tienes solicitudes registradas.</td></tr>`;
    return;
  }

  tabla.innerHTML = mias.map(s => `
    <tr>
      <td>${s.fecha.split("-").reverse().join("/")}</td>
      <td>${s.inicio} - ${s.fin}</td>
      <td>${s.horas}</td>
      <td>${s.motivo}</td>
      <td>${badgeSolicitud(s.estado)}</td>
    </tr>`).join("");
}
mostrarTabla();