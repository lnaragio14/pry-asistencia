const buscador = document.getElementById("buscador");
const filtroActivo = document.getElementById("filtroActivo");
const modal = document.getElementById("modalEmpleado");
let idEditando = null; // null = registrando uno nuevo

// ===== Utilidades de la pantalla =====
function nombreHorario(id) {
  const h = horarios.find(x => x.id === id);
  return h ? h.nombre : "Sin horario";
}

function nombreSupervisor(id) {
  const s = buscarEmpleado(id);
  return s ? `${s.nombres} ${s.apellidos}` : "—";
}

function siguienteId() {
  return Math.max(...empleados.map(e => e.id)) + 1;
}

// ===== Listado con búsqueda y filtro =====
function mostrar() {
  const texto = buscador.value.trim().toLowerCase();
  const estado = filtroActivo.value;

  const lista = empleados
    .filter(e => `${e.nombres} ${e.apellidos} ${e.codigo} ${e.dni}`.toLowerCase().includes(texto))
    .filter(e => estado === "" || (estado === "activos" ? e.activo : !e.activo));

  const tabla = document.getElementById("tablaEmpleados");

  if (lista.length === 0) {
    tabla.innerHTML = `<tr><td colspan="9">No se encontraron empleados.</td></tr>`;
    return;
  }

  tabla.innerHTML = lista.map(e => `
    <tr class="${e.activo ? "" : "fila-inactiva"}">
      <td>${e.codigo}</td>
      <td>${e.nombres} ${e.apellidos}</td>
      <td>${e.dni}</td>
      <td>${e.area}</td>
      <td>${e.cargo}</td>
      <td>${nombreHorario(e.idHorario)}</td>
      <td>${nombreSupervisor(e.idSupervisor)}</td>
      <td>${badgeActivo(e.activo)}</td>
      <td>
        <div class="acciones-tabla">
          <button class="btn btn-secundario btn-sm" data-accion="editar" data-id="${e.id}">Editar</button>
          <button class="btn ${e.activo ? "btn-eliminar" : "btn-exito"} btn-sm" data-accion="estado" data-id="${e.id}">
            ${e.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </td>
    </tr>`).join("");
}

// ===== Abrir el modal (nuevo o edición) =====
function abrirModal(emp = null) {
  idEditando = emp ? emp.id : null;
  document.getElementById("tituloModal").textContent = emp ? "Editar empleado" : "Nuevo empleado";
  document.getElementById("errorModal").textContent = "";

  // Opciones de horario (solo los existentes)
  document.getElementById("horario").innerHTML =
    `<option value="">Seleccione</option>` +
    horarios.map(h => `<option value="${h.id}">${h.nombre} (${h.entrada} - ${h.salida})</option>`).join("");

  // Opciones de supervisor: empleados activos, excepto él mismo
  document.getElementById("supervisor").innerHTML =
    `<option value="">Sin supervisor</option>` +
    empleados
      .filter(e => e.activo && (!emp || e.id !== emp.id))
      .map(e => `<option value="${e.id}">${e.nombres} ${e.apellidos}</option>`).join("");

  // Llenar o limpiar los campos
  document.getElementById("codigo").value = emp ? emp.codigo : "E" + String(siguienteId()).padStart(3, "0");
  document.getElementById("dni").value = emp ? emp.dni : "";
  document.getElementById("nombres").value = emp ? emp.nombres : "";
  document.getElementById("apellidos").value = emp ? emp.apellidos : "";
  document.getElementById("area").value = emp ? emp.area : "";
  document.getElementById("cargo").value = emp ? emp.cargo : "";
  document.getElementById("horario").value = emp ? emp.idHorario : "";
  document.getElementById("supervisor").value = emp && emp.idSupervisor ? emp.idSupervisor : "";

  modal.classList.add("visible");
}

// ===== Guardar =====
document.getElementById("btnGuardar").addEventListener("click", () => {
  const datos = {
    codigo: document.getElementById("codigo").value,
    dni: document.getElementById("dni").value.trim(),
    nombres: document.getElementById("nombres").value.trim(),
    apellidos: document.getElementById("apellidos").value.trim(),
    area: document.getElementById("area").value,
    cargo: document.getElementById("cargo").value.trim(),
    idHorario: Number(document.getElementById("horario").value),
    idSupervisor: Number(document.getElementById("supervisor").value) || null
  };
  const error = document.getElementById("errorModal");

  // Validaciones (integridad de datos)
  if (!datos.dni || !datos.nombres || !datos.apellidos || !datos.area || !datos.cargo || !datos.idHorario) {
    error.textContent = "Completa todos los campos obligatorios.";
    return;
  }
  if (!/^\d{8}$/.test(datos.dni)) {
    error.textContent = "El DNI debe tener exactamente 8 dígitos.";
    return;
  }
  const dniRepetido = empleados.some(e => e.dni === datos.dni && e.id !== idEditando);
  if (dniRepetido) {
    error.textContent = "Ya existe un empleado con ese DNI.";
    return;
  }

  if (idEditando) {
    Object.assign(buscarEmpleado(idEditando), datos);
    mostrarAlerta(`Empleado ${datos.nombres} ${datos.apellidos} actualizado.`, "exito");
  } else {
    empleados.push({ id: siguienteId(), ...datos, activo: true });
    mostrarAlerta(`Empleado ${datos.nombres} ${datos.apellidos} registrado.`, "exito");
  }

  guardarEmpleados();
  modal.classList.remove("visible");
  mostrar();
});

// ===== Acciones de la tabla (delegación de eventos) =====
document.getElementById("tablaEmpleados").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;

  const emp = buscarEmpleado(Number(boton.dataset.id));

  if (boton.dataset.accion === "editar") {
    abrirModal(emp);
  }

  if (boton.dataset.accion === "estado") {
    if (emp.id === usuarioActivo.idEmpleado) {
      mostrarAlerta("No puedes desactivar tu propia cuenta.", "error");
      return;
    }
    const accion = emp.activo ? "desactivar" : "activar";
    if (confirm(`¿Deseas ${accion} a ${emp.nombres} ${emp.apellidos}?`)) {
      emp.activo = !emp.activo;
      guardarEmpleados();
      mostrarAlerta(`Empleado ${emp.activo ? "activado" : "desactivado"}.`, emp.activo ? "exito" : "advertencia");
      mostrar();
    }
  }
});

document.getElementById("btnNuevo").addEventListener("click", () => abrirModal());
document.getElementById("btnCancelar").addEventListener("click", () => modal.classList.remove("visible"));
buscador.addEventListener("input", mostrar);
filtroActivo.addEventListener("change", mostrar);

mostrar();