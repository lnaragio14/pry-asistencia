const empleado = buscarEmpleado(usuarioActivo.idEmpleado);
const horario = horarios.find(h => h.id === empleado.idHorario);

// Antes:  const registroHoy = asistenciaDeHoy();
const registroHoy = procesarJornada(empleado.id);

const miHistorial = historialAsistencia.filter(a => a.idEmpleado === empleado.id);
if (registroHoy) miHistorial.push(registroHoy);

// Ordenar del más reciente al más antiguo
miHistorial.sort((a, b) => b.fecha.localeCompare(a.fecha));

// ===== Mostrar tabla y resumen =====
function formatearFecha(fecha) {   // "2026-09-16" -> "16/09/2026"
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
}

function mostrar(lista) {
  const tabla = document.getElementById("tablaHistorial");

  if (lista.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5">No hay registros en este periodo.</td></tr>`;
  } else {
    tabla.innerHTML = lista.map(a => `
      <tr>
        <td>${formatearFecha(a.fecha)}</td>
        <td>${a.entrada ?? "—"}</td>
        <td>${a.salida ?? "—"}</td>
        <td>${a.horas}</td>
        <td>${badgeEstado(a.estado)}</td>
      </tr>`).join("");
  }

  // Resumen del periodo filtrado
  const asistidos = lista.filter(a => ["PRESENTE", "TARDANZA", "INCOMPLETA"].includes(a.estado)).length;
  const tardanzas = lista.filter(a => a.estado === "TARDANZA").length;
  const faltas = lista.filter(a => a.estado === "AUSENTE").length;
  const horas = lista.reduce((suma, a) => suma + a.horas, 0);

  document.getElementById("resAsistidos").textContent = asistidos;
  document.getElementById("resTardanzas").textContent = tardanzas;
  document.getElementById("resFaltas").textContent = faltas;
  document.getElementById("resHoras").textContent = horas.toFixed(1) + " h";
}

// ===== Filtro por fechas =====
document.getElementById("btnFiltrar").addEventListener("click", () => {
  const desde = document.getElementById("desde").value;
  const hasta = document.getElementById("hasta").value;

  if (desde === "" || hasta === "") {
    mostrarAlerta("Selecciona ambas fechas para filtrar.", "error");
    return;
  }
  if (desde > hasta) {
    mostrarAlerta("La fecha 'Desde' no puede ser mayor que 'Hasta'.", "error");
    return;
  }

  document.getElementById("alerta").className = "alerta"; // Ocultar alerta
  const filtrado = miHistorial.filter(a => a.fecha >= desde && a.fecha <= hasta);
  mostrar(filtrado);
});

document.getElementById("btnLimpiar").addEventListener("click", () => {
  document.getElementById("desde").value = "";
  document.getElementById("hasta").value = "";
  document.getElementById("alerta").className = "alerta";
  mostrar(miHistorial);
});

mostrar(miHistorial);