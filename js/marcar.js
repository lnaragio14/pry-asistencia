// ===== Datos del empleado que inició sesión =====
const empleado = buscarEmpleado(usuarioActivo.idEmpleado);
const horario = horarios.find(h => h.id === empleado.idHorario);

document.getElementById("datoNombre").textContent = `${empleado.nombres} ${empleado.apellidos}`;
document.getElementById("datoCodigo").textContent = empleado.codigo;
document.getElementById("datoHorario").textContent =
  `${horario.entrada} - ${horario.salida} (tolerancia ${horario.tolerancia} min)`;

// ===== Reloj en vivo =====
function actualizarReloj() {
  const ahora = new Date();
  document.getElementById("reloj").textContent = ahora.toLocaleTimeString("es-PE");
  document.getElementById("fecha").textContent = ahora.toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}
actualizarReloj();
setInterval(actualizarReloj, 1000);

// ===== Utilidades =====

// ===== RF-04: Token temporal =====
const VIGENCIA_SEGUNDOS = 60;
let tokenActual = null;
let intervaloToken = null;

function generarCodigo() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return codigo;
}

function tokenValido() {
  return tokenActual !== null
      && !tokenActual.usado
      && Date.now() < tokenActual.expira;
}

document.getElementById("btnToken").addEventListener("click", () => {
  tokenActual = {
    codigo: generarCodigo(),
    expira: Date.now() + VIGENCIA_SEGUNDOS * 1000,
    usado: false
  };

  const caja = document.getElementById("tokenCaja");
  caja.classList.remove("vencido");
  document.getElementById("tokenCodigo").textContent = tokenActual.codigo;

  clearInterval(intervaloToken);
  intervaloToken = setInterval(() => {
    const restante = Math.ceil((tokenActual.expira - Date.now()) / 1000);
    if (restante <= 0) {
      clearInterval(intervaloToken);
      caja.classList.add("vencido");
      document.getElementById("tokenEstado").textContent = "Token vencido. Genera uno nuevo.";
    } else {
      document.getElementById("tokenEstado").textContent = `Vence en ${restante} segundos`;
    }
  }, 1000);
});

// ===== RF-05 y RF-06: Registrar marcación con origen =====
let marcaciones = JSON.parse(sessionStorage.getItem("marcaciones")) || [];

function misMarcacionesHoy() {
  return marcaciones.filter(m => m.idEmpleado === empleado.id && m.fecha === hoy);
}

function registrarMarcacion(tipo) {
  
  const origenWeb = origenesMarcacion.find(o => o.nombre === "PLATAFORMA");
  if (!origenWeb.activo) {
    mostrarAlerta("La marcación desde la plataforma está deshabilitada por el administrador.", "error");
    return;
  }

  // RNF-02: validar el token antes de aceptar la operación
  if (!tokenValido()) {
    mostrarAlerta("Necesitas un token válido. Genera uno nuevo e intenta otra vez.", "error");
    return;
  }

  const delDia = misMarcacionesHoy();
  const tieneEntrada = delDia.some(m => m.tipo === "ENTRADA");
  const tieneSalida = delDia.some(m => m.tipo === "SALIDA");

  // Reglas de negocio
  if (tipo === "ENTRADA" && tieneEntrada) {
    mostrarAlerta("Ya registraste tu entrada hoy.", "error");
    return;
  }
  if (tipo === "SALIDA" && !tieneEntrada) {
    mostrarAlerta("Primero debes registrar tu entrada.", "error");
    return;
  }
  if (tipo === "SALIDA" && tieneSalida) {
    mostrarAlerta("Ya registraste tu salida hoy.", "error");
    return;
  }

  // Crear y guardar la marcación
  const hora = new Date().toTimeString().slice(0, 5); // "HH:MM"
  marcaciones.push({
    id: Date.now(),
    idEmpleado: empleado.id,
    fecha: hoy,
    hora: hora,
    tipo: tipo,
    origen: "PLATAFORMA",
    token: tokenActual.codigo
  });
  sessionStorage.setItem("marcaciones", JSON.stringify(marcaciones));

  // El token queda usado: no puede reutilizarse
  tokenActual.usado = true;
  clearInterval(intervaloToken);
  document.getElementById("tokenCaja").classList.add("vencido");
  document.getElementById("tokenEstado").textContent = "Token utilizado";

  // RF-08: detectar tardanza en la entrada
  if (tipo === "ENTRADA") {
    const minutosTarde = aMinutos(hora) - aMinutos(horario.entrada);
    if (minutosTarde > horario.tolerancia) {
      mostrarAlerta(`Entrada registrada a las ${hora} con tardanza de ${minutosTarde} minutos.`, "advertencia");
    } else {
      mostrarAlerta(`Entrada registrada a las ${hora}. ¡Llegaste puntual!`, "exito");
    }
  } else {
    mostrarAlerta(`Salida registrada a las ${hora}. ¡Buen trabajo hoy!`, "exito");
  }

  mostrarTabla();
}

document.getElementById("btnEntrada").addEventListener("click", () => registrarMarcacion("ENTRADA"));
document.getElementById("btnSalida").addEventListener("click", () => registrarMarcacion("SALIDA"));

// ===== Tabla de marcaciones del día =====
function mostrarTabla() {
  const tabla = document.getElementById("tablaMarcaciones");
  const delDia = misMarcacionesHoy();

  if (delDia.length === 0) {
    tabla.innerHTML = `<tr><td colspan="4">Aún no tienes marcaciones hoy.</td></tr>`;
    return;
  }

  tabla.innerHTML = delDia.map(m => `
    <tr>
      <td>${m.tipo === "ENTRADA" ? badgeEstado("PRESENTE").replace("Presente", "Entrada") : '<span class="badge badge-justificado">Salida</span>'}</td>
      <td>${m.hora}</td>
      <td>${m.origen}</td>
      <td>${m.token}</td>
    </tr>`).join("");
}
mostrarTabla();