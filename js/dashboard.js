// ===== Calcular indicadores =====
const presentes = asistenciasHoy.filter(a => a.estado === "PRESENTE" || a.estado === "TARDANZA").length;
const tardanzas = asistenciasHoy.filter(a => a.estado === "TARDANZA").length;
const faltas = asistenciasHoy.filter(a => a.estado === "AUSENTE").length;
const horasTotales = asistenciasHoy.reduce((suma, a) => suma + a.horas, 0);
const pendientes = obtenerSolicitudes().filter(s => s.estado === "PENDIENTE").length;

document.getElementById("indPresentes").textContent = presentes;
document.getElementById("indTardanzas").textContent = tardanzas;
document.getElementById("indFaltas").textContent = faltas;
document.getElementById("indHoras").textContent = horasTotales.toFixed(1) + " h";
document.getElementById("indPendientes").textContent = pendientes;

// ===== Llenar la tabla =====
const tabla = document.getElementById("tablaAsistencia");

asistenciasHoy.forEach(a => {
  const emp = buscarEmpleado(a.idEmpleado);
  tabla.innerHTML += `
    <tr>
      <td>${emp.codigo}</td>
      <td>${emp.nombres} ${emp.apellidos}</td>
      <td>${emp.area}</td>
      <td>${a.entrada ?? "—"}</td>
      <td>${a.salida ?? "—"}</td>
      <td>${a.horas}</td>
      <td>${badgeEstado(a.estado)}</td>
    </tr>`;
});