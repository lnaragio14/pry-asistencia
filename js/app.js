// ===== 1. Verificar sesión y permisos =====
const usuarioActivo = JSON.parse(sessionStorage.getItem("usuarioActivo"));

if (!usuarioActivo) {
  window.location.href = "../index.html";
}

// Cada página indica qué roles pueden verla con data-roles en el <body>
const rolesPermitidos = document.body.dataset.roles.split(",");
if (!rolesPermitidos.includes(usuarioActivo.rol)) {
  alert("No tienes permiso para acceder a esta página.");
  history.back();
}

// ===== 2. Menú según el rol =====
const menus = {
  EMPLEADO: [
    { texto: "Marcar asistencia", url: "marcar.html" },
    { texto: "Mi asistencia",     url: "mi-asistencia.html" },
    { texto: "Horas extras",      url: "horas-extras.html" }
  ],
  SUPERVISOR: [
    { texto: "Dashboard",             url: "dashboard.html" },
    { texto: "Marcar asistencia",     url: "marcar.html" },
    { texto: "Asistencia del equipo", url: "equipo.html" },
    { texto: "Aprobar horas extras",  url: "aprobaciones.html" }
  ],
  ADMINISTRADOR: [
    { texto: "Dashboard",  url: "dashboard.html" },
    { texto: "Empleados",  url: "empleados.html" },
    { texto: "Horarios",   url: "horarios.html" },
    { texto: "Integraciones",   url: "integraciones.html" },
    { texto: "Exportar datos", url: "exportar.html" }
  ]
};

const paginaActual = window.location.pathname.split("/").pop();
const menu = document.getElementById("menu");

menus[usuarioActivo.rol].forEach(opcion => {
  const enlace = document.createElement("a");
  enlace.href = opcion.url;
  enlace.textContent = opcion.texto;
  if (opcion.url === paginaActual) enlace.classList.add("activo");
  menu.appendChild(enlace);
});

// ===== 3. Datos del usuario en la barra superior =====
document.getElementById("nombreUsuario").textContent = usuarioActivo.nombre;
document.getElementById("rolUsuario").textContent = usuarioActivo.rol;

// ===== 4. Cerrar sesión =====
document.getElementById("btnSalir").addEventListener("click", () => {
  sessionStorage.removeItem("usuarioActivo");
  window.location.href = "../index.html";
});

// ===== 5. Utilidades compartidas =====
function badgeEstado(estado) {
  const estilos = {
    PRESENTE:    { clase: "badge-presente",    texto: "Presente" },
    TARDANZA:    { clase: "badge-tardanza",    texto: "Tardanza" },
    AUSENTE:     { clase: "badge-falta",       texto: "Falta" },
    JUSTIFICADO: { clase: "badge-justificado", texto: "Justificado" },
    PERMISO:     { clase: "badge-permiso",     texto: "Permiso" },
    INCOMPLETA:  { clase: "badge-incompleta",  texto: "Incompleta" }
  };
  const e = estilos[estado];
  return `<span class="badge ${e.clase}">${e.texto}</span>`;
}

function buscarEmpleado(id) {
  return empleados.find(emp => emp.id === id);
}

// ===== Solicitudes de horas extras (compartidas entre pantallas) =====
function obtenerSolicitudes() {
  return JSON.parse(sessionStorage.getItem("solicitudes")) || solicitudesHorasExtra;
}

function guardarSolicitudes(lista) {
  sessionStorage.setItem("solicitudes", JSON.stringify(lista));
}

function badgeSolicitud(estado) {
  const estilos = {
    PENDIENTE: "badge-tardanza",
    APROBADA:  "badge-presente",
    RECHAZADA: "badge-falta"
  };
  const texto = estado.charAt(0) + estado.slice(1).toLowerCase();
  return `<span class="badge ${estilos[estado]}">${texto}</span>`;
}

function aMinutos(hora) {            // "08:15" -> 495
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function mostrarAlerta(texto, tipo) {  // tipo: exito | error | advertencia
  const alerta = document.getElementById("alerta");
  alerta.textContent = texto;
  alerta.className = `alerta alerta-${tipo} visible`;
}

const hoy = new Date().toLocaleDateString("en-CA"); // AAAA-MM-DD

// ===== RF-07: Procesar la jornada de un empleado a partir de sus marcaciones =====
function procesarJornada(idEmpleado) {
  const emp = buscarEmpleado(idEmpleado);
  const horario = horarios.find(h => h.id === emp.idHorario);
  const marcaciones = JSON.parse(sessionStorage.getItem("marcaciones")) || [];
  const delDia = marcaciones.filter(m => m.idEmpleado === idEmpleado && m.fecha === hoy);

  const entrada = delDia.find(m => m.tipo === "ENTRADA");
  const salida = delDia.find(m => m.tipo === "SALIDA");

  if (!entrada) return null;

  let horas = 0;
  let estado = "INCOMPLETA";

  if (salida) {
    horas = (aMinutos(salida.hora) - aMinutos(entrada.hora)) / 60;
    const minutosTarde = aMinutos(entrada.hora) - aMinutos(horario.entrada);
    estado = minutosTarde > horario.tolerancia ? "TARDANZA" : "PRESENTE";
  }

  return {
    idEmpleado: idEmpleado,
    fecha: hoy,
    entrada: entrada.hora,
    salida: salida ? salida.hora : null,
    horas: Number(horas.toFixed(1)),
    estado: estado
  };
}

// ===== Guardar cambios del administrador =====
function guardarEmpleados() {
  sessionStorage.setItem("empleados", JSON.stringify(empleados));
}

function guardarHorarios() {
  sessionStorage.setItem("horarios", JSON.stringify(horarios));
}

function badgeActivo(activo) {
  return activo
    ? `<span class="badge badge-presente">Activo</span>`
    : `<span class="badge badge-incompleta">Inactivo</span>`;
}

function guardarOrigenes() {
  sessionStorage.setItem("origenes", JSON.stringify(origenesMarcacion));
}