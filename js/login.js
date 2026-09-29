// Usuarios simulados (equivalen a la tabla "usuario" de la BD)
const usuarios = [
  { correo: "empleado@empresa.com",   clave: "123456", rol: "EMPLEADO",      nombre: "Juan Pérez",  idEmpleado: 1 },
  { correo: "supervisor@empresa.com", clave: "123456", rol: "SUPERVISOR",    nombre: "María López", idEmpleado: 2 },
  { correo: "admin@empresa.com",      clave: "123456", rol: "ADMINISTRADOR", nombre: "Carlos Ruiz", idEmpleado: 3 }
];

const formLogin = document.getElementById("formLogin");
const mensajeError = document.getElementById("mensajeError");

formLogin.addEventListener("submit", function (evento) {
  evento.preventDefault(); // Evita que la página se recargue

  const correo = document.getElementById("correo").value.trim();
  const clave = document.getElementById("clave").value.trim();

  // 1. Validar campos vacíos
  if (correo === "" || clave === "") {
    mensajeError.textContent = "Completa el correo y la contraseña.";
    return;
  }

  // 2. Buscar el usuario
  const usuario = usuarios.find(u => u.correo === correo && u.clave === clave);

  if (!usuario) {
    mensajeError.textContent = "Correo o contraseña incorrectos.";
    return;
  }

  // 3. Guardar la sesión y redirigir
  sessionStorage.setItem("usuarioActivo", JSON.stringify(usuario));
  window.location.href = usuario.rol === "EMPLEADO"
    ? "pages/marcar.html"
    : "pages/dashboard.html";
});