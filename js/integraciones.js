const ENDPOINT_PROPIO = "https://asistencia.empresa.com/api/v1/marcaciones";

const modalConfig = document.getElementById("modalConfig");
const modalSimular = document.getElementById("modalSimular");
const cfgNombre = document.getElementById("cfgNombre");
const cfgTipo = document.getElementById("cfgTipo");
const cfgDescripcion = document.getElementById("cfgDescripcion");
const cfgEndpoint = document.getElementById("cfgEndpoint");
const cfgApiKey = document.getElementById("cfgApiKey");
const btnGenerar = document.getElementById("btnGenerar");
const btnMostrar = document.getElementById("btnMostrar");

let idEditando = null;
let idSimulando = null;

// ===== Utilidades =====
function buscarOrigen(id) {
  return origenesMarcacion.find(o => o.id === id);
}

function enmascarar(clave) {
  return clave ? clave.slice(0, 6) + "••••••••" + clave.slice(-4) : "No configurada";
}

function badgeTipo(tipo) {
  const estilos = {
    INTERNO:  { clase: "badge-incompleta",  texto: "Interno" },
    ENTRANTE: { clase: "badge-justificado", texto: "Entrante" },
    SALIENTE: { clase: "badge-permiso",     texto: "Saliente" }
  };
  return `<span class="badge ${estilos[tipo].clase}">${estilos[tipo].texto}</span>`;
}

function urlValida(texto) {
  try {
    return new URL(texto).protocol === "https:";
  } catch {
    return false;
  }
}

function estaConfigurado(o) {
  if (o.tipo === "INTERNO") return true;
  if (o.tipo === "ENTRANTE") return o.apiKey !== "";
  return o.endpoint !== "" && o.apiKey !== "";
}

function generarClave() {
  const caracteres = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let clave = "ak_";
  for (let i = 0; i < 32; i++) {
    clave += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return clave;
}

// ===== Tarjetas de orígenes =====
function mostrarOrigenes() {
  document.getElementById("listaOrigenes").innerHTML = origenesMarcacion.map(o => {
    const datos = o.tipo === "INTERNO"
      ? `<p class="origen-dato"><span>Integración interna: no requiere credenciales.</span></p>`
      : `<p class="origen-dato"><span>Endpoint:</span> ${o.endpoint || "No configurado"}</p>
         <p class="origen-dato"><span>API key:</span> <code class="codigo-clave">${enmascarar(o.apiKey)}</code></p>
         <p class="origen-dato"><span>Última prueba:</span> ${o.ultimaPrueba ?? "Nunca"}</p>`;

    const botonesExternos = o.tipo === "INTERNO" ? "" : `
      <button class="btn btn-secundario btn-sm" data-accion="configurar" data-id="${o.id}">Configurar</button>
      <button class="btn btn-secundario btn-sm" data-accion="probar" data-id="${o.id}">Probar conexión</button>`;

    const botonSimular = o.tipo === "ENTRANTE"
      ? `<button class="btn btn-primario btn-sm" data-accion="simular" data-id="${o.id}">Simular envío</button>`
      : "";

    return `
      <div class="card origen-card">
        <div class="origen-encabezado">
          <h3>${o.nombre}</h3>
          <div>${badgeTipo(o.tipo)} ${badgeActivo(o.activo)}</div>
        </div>
        <p class="texto-secundario">${o.descripcion}</p>
        ${datos}
        <div class="acciones-tabla">
          ${botonesExternos}
          ${botonSimular}
          <button class="btn ${o.activo ? "btn-eliminar" : "btn-exito"} btn-sm" data-accion="estado" data-id="${o.id}">
            ${o.activo ? "Desactivar" : "Activar"}
          </button>
        </div>
      </div>`;
  }).join("");
}

// ===== Tabla de marcaciones externas (trazabilidad RF-06) =====
function mostrarMarcacionesExternas() {
  const marcaciones = JSON.parse(sessionStorage.getItem("marcaciones")) || [];
  const externas = marcaciones
    .filter(m => m.origen !== "PLATAFORMA")
    .sort((a, b) => b.id - a.id);

  const tabla = document.getElementById("tablaExternas");
  if (externas.length === 0) {
    tabla.innerHTML = `<tr><td colspan="5">Aún no se reciben marcaciones de orígenes externos.</td></tr>`;
    return;
  }

  tabla.innerHTML = externas.map(m => {
    const emp = buscarEmpleado(m.idEmpleado);
    return `
      <tr>
        <td>${emp.nombres} ${emp.apellidos}</td>
        <td>${m.fecha.split("-").reverse().join("/")}</td>
        <td>${m.hora}</td>
        <td>${m.tipo}</td>
        <td>${badgeTipo(buscarOrigenPorNombre(m.origen)?.tipo ?? "INTERNO")} ${m.origen}</td>
      </tr>`;
  }).join("");
}

function buscarOrigenPorNombre(nombre) {
  return origenesMarcacion.find(o => o.nombre === nombre);
}

// ===== Activar / desactivar =====
function cambiarEstado(o) {
  if (!o.activo && !estaConfigurado(o)) {
    mostrarAlerta(`Configura las credenciales de ${o.nombre} antes de activarlo.`, "error");
    return;
  }
  if (o.activo && o.nombre === "PLATAFORMA" &&
      !confirm("Si desactivas este origen, nadie podrá marcar desde la web. ¿Continuar?")) {
    return;
  }

  o.activo = !o.activo;
  guardarOrigenes();
  mostrarAlerta(`${o.nombre} ${o.activo ? "activado" : "desactivado"}.`, o.activo ? "exito" : "advertencia");
  mostrarOrigenes();
}

// ===== Probar conexión (simulada) =====
function probarConexion(o, boton) {
  if (!estaConfigurado(o)) {
    mostrarAlerta(`Faltan credenciales en ${o.nombre}.`, "error");
    return;
  }
  if (o.tipo === "SALIENTE" && !urlValida(o.endpoint)) {
    mostrarAlerta("El endpoint debe ser una URL válida que empiece con https://", "error");
    return;
  }

  boton.disabled = true;
  boton.textContent = "Probando...";

  // En el sistema real, aquí el backend haría una petición al endpoint
  setTimeout(() => {
    o.ultimaPrueba = new Date().toLocaleString("es-PE");
    guardarOrigenes();
    mostrarAlerta(`Conexión con ${o.nombre} exitosa (respuesta 200 OK, simulada).`, "exito");
    mostrarOrigenes();
  }, 1200);
}

// ===== Modal de configuración =====
function ajustarCampos() {
  const entrante = cfgTipo.value === "ENTRANTE";

  cfgEndpoint.readOnly = entrante;
  cfgApiKey.readOnly = entrante;
  cfgApiKey.type = entrante ? "text" : "password";
  if (entrante) cfgEndpoint.value = ENDPOINT_PROPIO;

  btnGenerar.style.display = entrante ? "inline-block" : "none";
  btnMostrar.style.display = entrante ? "none" : "inline-block";
  btnMostrar.textContent = "Mostrar";

  document.getElementById("cfgAyuda").textContent = entrante
    ? "Entrante: genera una clave y copia el endpoint y la clave en la configuración del sistema externo."
    : "Saliente: ingresa la URL y la API key que te entregó el proveedor del sistema externo.";
}

function abrirConfig(o = null) {
  idEditando = o ? o.id : null;
  document.getElementById("tituloConfig").textContent = o ? `Configurar ${o.nombre}` : "Nuevo origen";
  document.getElementById("errorConfig").textContent = "";

  cfgNombre.value = o ? o.nombre : "";
  cfgNombre.readOnly = o !== null;   // El identificador no se cambia
  cfgTipo.value = o ? o.tipo : "ENTRANTE";
  cfgTipo.disabled = o !== null;     // La dirección tampoco
  cfgDescripcion.value = o ? o.descripcion : "";
  cfgEndpoint.value = o ? o.endpoint : "";
  cfgApiKey.value = o ? o.apiKey : "";

  ajustarCampos();
  modalConfig.classList.add("visible");
}

cfgTipo.addEventListener("change", () => {
  cfgEndpoint.value = "";
  cfgApiKey.value = "";
  ajustarCampos();
});

btnGenerar.addEventListener("click", () => {
  if (cfgApiKey.value && !confirm("Se reemplazará la clave actual y el sistema externo dejará de funcionar hasta actualizarla. ¿Continuar?")) {
    return;
  }
  cfgApiKey.value = generarClave();
});

btnMostrar.addEventListener("click", () => {
  const oculto = cfgApiKey.type === "password";
  cfgApiKey.type = oculto ? "text" : "password";
  btnMostrar.textContent = oculto ? "Ocultar" : "Mostrar";
});

document.getElementById("btnGuardarConfig").addEventListener("click", () => {
  const error = document.getElementById("errorConfig");
  const nombre = cfgNombre.value.trim().toUpperCase().replace(/\s+/g, "_");
  const descripcion = cfgDescripcion.value.trim();
  const tipo = cfgTipo.value;
  const endpoint = cfgEndpoint.value.trim();
  const apiKey = cfgApiKey.value.trim();

  // Validaciones
  if (!nombre || !descripcion) {
    error.textContent = "Completa el nombre y la descripción.";
    return;
  }
  if (!/^[A-Z0-9_]+$/.test(nombre)) {
    error.textContent = "El nombre solo admite letras, números y guion bajo.";
    return;
  }
  if (origenesMarcacion.some(o => o.nombre === nombre && o.id !== idEditando)) {
    error.textContent = "Ya existe un origen con ese nombre.";
    return;
  }
  if (tipo === "ENTRANTE" && !apiKey) {
    error.textContent = "Genera una API key para este origen.";
    return;
  }
  if (tipo === "SALIENTE" && !urlValida(endpoint)) {
    error.textContent = "El endpoint debe ser una URL válida que empiece con https://";
    return;
  }
  if (tipo === "SALIENTE" && apiKey.length < 16) {
    error.textContent = "La API key debe tener al menos 16 caracteres.";
    return;
  }

  if (idEditando) {
    const o = buscarOrigen(idEditando);
    const cambioCredenciales = o.endpoint !== endpoint || o.apiKey !== apiKey;
    Object.assign(o, {
      descripcion, endpoint, apiKey,
      ultimaPrueba: cambioCredenciales ? null : o.ultimaPrueba
    });
    mostrarAlerta(
      cambioCredenciales ? `Credenciales de ${nombre} actualizadas. Vuelve a probar la conexión.` : `${nombre} actualizado.`,
      "exito"
    );
  } else {
    const nuevoId = Math.max(...origenesMarcacion.map(o => o.id)) + 1;
    origenesMarcacion.push({ id: nuevoId, nombre, descripcion, tipo, activo: false, endpoint, apiKey, ultimaPrueba: null });
    mostrarAlerta(`Origen ${nombre} registrado como inactivo. Pruébalo y actívalo cuando esté listo.`, "exito");
  }

  guardarOrigenes();
  modalConfig.classList.remove("visible");
  mostrarOrigenes();
});

// ===== Modal de simulación (HU-11) =====
function abrirSimular(o) {
  idSimulando = o.id;
  document.getElementById("simDetalle").textContent = `POST ${ENDPOINT_PROPIO} · Origen: ${o.nombre}`;
  document.getElementById("simEmpleado").innerHTML = empleados
    .filter(e => e.activo)
    .map(e => `<option value="${e.id}">${e.codigo} - ${e.nombres} ${e.apellidos}</option>`).join("");
  document.getElementById("simClave").value = o.apiKey;
  document.getElementById("errorSimular").textContent = "";
  modalSimular.classList.add("visible");
}

document.getElementById("btnEnviarSimular").addEventListener("click", () => {
  const o = buscarOrigen(idSimulando);
  const error = document.getElementById("errorSimular");
  const idEmpleado = Number(document.getElementById("simEmpleado").value);
  const tipo = document.getElementById("simTipo").value;
  const claveEnviada = document.getElementById("simClave").value.trim();

  // Validaciones que haría la API real
  if (claveEnviada !== o.apiKey) {
    error.textContent = "401 No autorizado: la API key no es válida.";
    return;
  }
  if (!o.activo) {
    error.textContent = "403 Prohibido: este origen está desactivado por el administrador.";
    return;
  }

  const marcaciones = JSON.parse(sessionStorage.getItem("marcaciones")) || [];
  const delDia = marcaciones.filter(m => m.idEmpleado === idEmpleado && m.fecha === hoy);
  const tieneEntrada = delDia.some(m => m.tipo === "ENTRADA");
  const tieneSalida = delDia.some(m => m.tipo === "SALIDA");

  if ((tipo === "ENTRADA" && tieneEntrada) || (tipo === "SALIDA" && tieneSalida)) {
    error.textContent = `409 Conflicto: el empleado ya tiene una ${tipo.toLowerCase()} registrada hoy.`;
    return;
  }
  if (tipo === "SALIDA" && !tieneEntrada) {
    error.textContent = "409 Conflicto: no existe una entrada previa para registrar la salida.";
    return;
  }

  // La marcación se guarda con su origen (trazabilidad)
  marcaciones.push({
    id: Date.now(),
    idEmpleado: idEmpleado,
    fecha: hoy,
    hora: new Date().toTimeString().slice(0, 5),
    tipo: tipo,
    origen: o.nombre,
    token: "—"
  });
  sessionStorage.setItem("marcaciones", JSON.stringify(marcaciones));

  modalSimular.classList.remove("visible");
  mostrarAlerta(`201 Creado: marcación de ${tipo.toLowerCase()} recibida desde ${o.nombre}.`, "exito");
  mostrarMarcacionesExternas();
});

// ===== Eventos =====
document.getElementById("listaOrigenes").addEventListener("click", (evento) => {
  const boton = evento.target.closest("button");
  if (!boton) return;

  const o = buscarOrigen(Number(boton.dataset.id));
  const acciones = {
    configurar: () => abrirConfig(o),
    probar:     () => probarConexion(o, boton),
    simular:    () => abrirSimular(o),
    estado:     () => cambiarEstado(o)
  };
  acciones[boton.dataset.accion]();
});

document.getElementById("btnNuevo").addEventListener("click", () => abrirConfig());
document.getElementById("btnCancelarConfig").addEventListener("click", () => modalConfig.classList.remove("visible"));
document.getElementById("btnCancelarSimular").addEventListener("click", () => modalSimular.classList.remove("visible"));

mostrarOrigenes();
mostrarMarcacionesExternas();