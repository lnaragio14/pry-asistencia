const form = document.getElementById("formHorario");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
let idEditando = null;

// ===== Listado =====
function mostrar() {
  const tabla = document.getElementById("tablaHorarios");

  tabla.innerHTML = horarios.map(h => {
    const asignados = empleados.filter(e => e.idHorario === h.id && e.activo).length;
    const jornada = (aMinutos(h.salida) - aMinutos(h.entrada)) / 60;
    return `
      <tr>
        <td>${h.nombre}</td>
        <td>${h.entrada} - ${h.salida}</td>
        <td>${jornada} h</td>
        <td>${h.dias}</td>
        <td>${h.tolerancia} min</td>
        <td>${asignados}</td>
        <td><button class="btn btn-secundario btn-sm" data-id="${h.id}">Editar</button></td>
      </tr>`;
  }).join("");
}

// ===== Volver al modo "nuevo" =====
function limpiarFormulario() {
  form.reset();
  document.getElementById("tolerancia").value = 10;
  idEditando = null;
  document.getElementById("tituloForm").textContent = "Nuevo horario";
  btnCancelarEdicion.style.display = "none";
}

// ===== Guardar =====
form.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    entrada: document.getElementById("entrada").value,
    salida: document.getElementById("salida").value,
    dias: document.getElementById("dias").value,
    tolerancia: Number(document.getElementById("tolerancia").value)
  };

  // Validaciones
  if (!datos.nombre || !datos.entrada || !datos.salida) {
    mostrarAlerta("Completa todos los campos obligatorios.", "error");
    return;
  }
  if (aMinutos(datos.salida) <= aMinutos(datos.entrada)) {
    mostrarAlerta("La hora de salida debe ser mayor que la de entrada.", "error");
    return;
  }
  if (!Number.isInteger(datos.tolerancia) || datos.tolerancia < 0 || datos.tolerancia > 30) {
    mostrarAlerta("La tolerancia debe ser un número entero entre 0 y 30 minutos.", "error");
    return;
  }
  const nombreRepetido = horarios.some(
    h => h.nombre.toLowerCase() === datos.nombre.toLowerCase() && h.id !== idEditando
  );
  if (nombreRepetido) {
    mostrarAlerta("Ya existe un horario con ese nombre.", "error");
    return;
  }

  if (idEditando) {
    Object.assign(horarios.find(h => h.id === idEditando), datos);
    mostrarAlerta(`Horario "${datos.nombre}" actualizado.`, "exito");
  } else {
    const nuevoId = Math.max(...horarios.map(h => h.id)) + 1;
    horarios.push({ id: nuevoId, ...datos });
    mostrarAlerta(`Horario "${datos.nombre}" registrado. Ya puedes asignarlo en Empleados.`, "exito");
  }

  guardarHorarios();
  limpiarFormulario();
  mostrar();
});

// ===== Editar (delegación de eventos) =====
document.getElementById("tablaHorarios").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;

  const h = horarios.find(x => x.id === Number(boton.dataset.id));
  idEditando = h.id;

  document.getElementById("nombre").value = h.nombre;
  document.getElementById("entrada").value = h.entrada;
  document.getElementById("salida").value = h.salida;
  document.getElementById("dias").value = h.dias;
  document.getElementById("tolerancia").value = h.tolerancia;

  document.getElementById("tituloForm").textContent = `Editar horario: ${h.nombre}`;
  btnCancelarEdicion.style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

btnCancelarEdicion.addEventListener("click", limpiarFormulario);

mostrar();