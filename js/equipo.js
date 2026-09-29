// ===== Equipo del supervisor (relación recursiva id_supervisor) =====
const miEquipo = empleados.filter(e => e.idSupervisor === usuarioActivo.idEmpleado && e.activo);
const idsEquipo = miEquipo.map(e => e.id);

// Asistencia de hoy: si el empleado marcó en la plataforma, se usa lo procesado;
// si no, se usa el dato simulado
const hoyEquipo = asistenciasHoy
  .filter(a => idsEquipo.includes(a.idEmpleado))
  .map(a => procesarJornada(a.idEmpleado) ?? { ...a, fecha: hoy });

const registros = [
  ...historialAsistencia.filter(a => idsEquipo.includes(a.idEmpleado)),
  ...hoyEquipo
];

// ===== Llenar el select de empleados =====
const selectEmpleado = document.getElementById("filtroEmpleado");
miEquipo.forEach(e => {
  selectEmpleado.innerHTML += `<option value="${e.id}">${e.nombres} ${e.apellidos}</option>`;
});

const campoFecha = document.getElementById("filtroFecha");
const campoEstado = document.getElementById("filtroEstado");
campoFecha.value = hoy; // Por defecto se muestra el día de hoy

// ===== Aplicar filtros =====
function aplicarFiltros() {
  const fecha = campoFecha.value;
  const idEmp = selectEmpleado.value;
  const estado = campoEstado.value;

  const filtrado = registros
    .filter(r => fecha === "" || r.fecha === fecha)
    .filter(r => idEmp === "" || r.idEmpleado === Number(idEmp))
    .filter(r => estado === "" || r.estado === estado)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  mostrar(filtrado);
}

function mostrar(lista) {
  const tabla = document.getElementById("tablaEquipo");

  if (lista.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7">No hay registros con estos filtros.</td></tr>`;
  } else {
    tabla.innerHTML = lista.map(r => {
      const emp = buscarEmpleado(r.idEmpleado);
      return `
        <tr>
          <td>${emp.codigo}</td>
          <td>${emp.nombres} ${emp.apellidos}</td>
          <td>${r.fecha.split("-").reverse().join("/")}</td>
          <td>${r.entrada ?? "—"}</td>
          <td>${r.salida ?? "—"}</td>
          <td>${r.horas}</td>
          <td>${badgeEstado(r.estado)}</td>
        </tr>`;
    }).join("");
  }

  // Indicadores según lo filtrado
  document.getElementById("indIntegrantes").textContent = miEquipo.length;
  document.getElementById("indAsistieron").textContent =
    lista.filter(r => ["PRESENTE", "TARDANZA", "INCOMPLETA"].includes(r.estado)).length;
  document.getElementById("indTardanzas").textContent = lista.filter(r => r.estado === "TARDANZA").length;
  document.getElementById("indFaltas").textContent = lista.filter(r => r.estado === "AUSENTE").length;
}

// Los filtros se aplican al cambiar cualquier campo
campoFecha.addEventListener("change", aplicarFiltros);
selectEmpleado.addEventListener("change", aplicarFiltros);
campoEstado.addEventListener("change", aplicarFiltros);

document.getElementById("btnLimpiar").addEventListener("click", () => {
  campoFecha.value = "";
  selectEmpleado.value = "";
  campoEstado.value = "";
  aplicarFiltros();
});

aplicarFiltros();