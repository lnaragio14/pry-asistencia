const campoDesde = document.getElementById("desde");
const campoHasta = document.getElementById("hasta");

// ===== Consolidar la información (equivale a un JOIN en SQL) =====
function consolidar() {
  const hoyTodos = asistenciasHoy.map(a => procesarJornada(a.idEmpleado) ?? { ...a, fecha: hoy });
  const registros = [...historialAsistencia, ...hoyTodos];
  const aprobadas = obtenerSolicitudes().filter(s => s.estado === "APROBADA");

  return registros.map(r => {
    const emp = buscarEmpleado(r.idEmpleado);
    const horasExtras = aprobadas
      .filter(s => s.idEmpleado === r.idEmpleado && s.fecha === r.fecha)
      .reduce((total, s) => total + s.horas, 0);

    return {
      codigo: emp.codigo,
      empleado: `${emp.nombres} ${emp.apellidos}`,
      area: emp.area,
      fecha: r.fecha,
      entrada: r.entrada ?? "",
      salida: r.salida ?? "",
      horas: r.horas,
      estado: r.estado,
      horasExtras: horasExtras
    };
  }).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.codigo.localeCompare(b.codigo));
}

const datosConsolidados = consolidar();

// Rango por defecto: desde el primer registro hasta hoy
campoDesde.value = datosConsolidados[0].fecha;
campoHasta.value = hoy;

// ===== Filtrar por rango con validación =====
function obtenerFiltrados() {
  const desde = campoDesde.value;
  const hasta = campoHasta.value;

  if (desde === "" || hasta === "") {
    mostrarAlerta("Selecciona ambas fechas.", "error");
    return null;
  }
  if (desde > hasta) {
    mostrarAlerta("La fecha 'Desde' no puede ser mayor que 'Hasta'.", "error");
    return null;
  }

  document.getElementById("alerta").className = "alerta";
  return datosConsolidados.filter(r => r.fecha >= desde && r.fecha <= hasta);
}

// ===== Vista previa =====
function vistaPrevia() {
  const lista = obtenerFiltrados();
  if (!lista) return;

  const tabla = document.getElementById("tablaExportar");
  tabla.innerHTML = lista.length === 0
    ? `<tr><td colspan="9">No hay registros en este periodo.</td></tr>`
    : lista.map(r => `
        <tr>
          <td>${r.codigo}</td>
          <td>${r.empleado}</td>
          <td>${r.area}</td>
          <td>${r.fecha.split("-").reverse().join("/")}</td>
          <td>${r.entrada || "—"}</td>
          <td>${r.salida || "—"}</td>
          <td>${r.horas}</td>
          <td>${badgeEstado(r.estado)}</td>
          <td>${r.horasExtras}</td>
        </tr>`).join("");

  document.getElementById("indRegistros").textContent = lista.length;
  document.getElementById("indHoras").textContent =
    lista.reduce((t, r) => t + r.horas, 0).toFixed(1) + " h";
  document.getElementById("indExtras").textContent =
    lista.reduce((t, r) => t + r.horasExtras, 0).toFixed(1) + " h";
}

// ===== Descargar CSV =====
document.getElementById("btnDescargar").addEventListener("click", () => {
  const lista = obtenerFiltrados();
  if (!lista) return;

  if (lista.length === 0) {
    mostrarAlerta("No hay datos para exportar en este periodo.", "advertencia");
    return;
  }

  const encabezados = ["Código", "Empleado", "Área", "Fecha", "Entrada", "Salida",
                       "Horas trabajadas", "Estado", "Horas extras aprobadas"];

  const filas = lista.map(r =>
    [r.codigo, r.empleado, r.area, r.fecha, r.entrada, r.salida, r.horas, r.estado, r.horasExtras].join(";")
  );

  const csv = [encabezados.join(";"), ...filas].join("\n");

  // "\uFEFF" hace que Excel lea bien las tildes y la ñ
  const archivo = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `asistencia_${campoDesde.value}_a_${campoHasta.value}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);

  mostrarAlerta(`Se exportaron ${lista.length} registros.`, "exito");
});

document.getElementById("btnVistaPrevia").addEventListener("click", vistaPrevia);
vistaPrevia();