let horarios = [
  { id: 1, nombre: "Turno mañana", entrada: "08:00", salida: "17:00", dias: "LUN-VIE", tolerancia: 10 },
  { id: 2, nombre: "Turno tarde",  entrada: "14:00", salida: "22:00", dias: "LUN-SAB", tolerancia: 10 }
];

let empleados = [
  { id: 1, codigo: "E001", nombres: "Juan",   apellidos: "Pérez",  dni: "71234567", area: "Ventas",      cargo: "Asesor",        activo: true, idHorario: 1, idSupervisor: 2 },
  { id: 2, codigo: "E002", nombres: "María",  apellidos: "López",  dni: "72345678", area: "Ventas",      cargo: "Supervisora",   activo: true, idHorario: 1, idSupervisor: null },
  { id: 3, codigo: "E003", nombres: "Carlos", apellidos: "Ruiz",   dni: "73456789", area: "Sistemas",    cargo: "Administrador", activo: true, idHorario: 1, idSupervisor: null },
  { id: 4, codigo: "E004", nombres: "Ana",    apellidos: "Torres", dni: "74567890", area: "Ventas",      cargo: "Asesora",       activo: true, idHorario: 2, idSupervisor: 2 },
  { id: 5, codigo: "E005", nombres: "Luis",   apellidos: "Gómez",  dni: "75678901", area: "Ventas",      cargo: "Asesor",        activo: true, idHorario: 1, idSupervisor: 2 },
  { id: 6, codigo: "E006", nombres: "Rosa",   apellidos: "Díaz",   dni: "76789012", area: "Operaciones", cargo: "Analista",      activo: true, idHorario: 1, idSupervisor: 2 }
];

// Asistencia del día (resultado del procesamiento de jornada)
const asistenciasHoy = [
  { idEmpleado: 1, entrada: "08:05", salida: "17:02", horas: 8.9, estado: "PRESENTE" },
  { idEmpleado: 2, entrada: "07:55", salida: "17:00", horas: 9.1, estado: "PRESENTE" },
  { idEmpleado: 3, entrada: "08:00", salida: "17:10", horas: 9.2, estado: "PRESENTE" },
  { idEmpleado: 4, entrada: "14:25", salida: "22:00", horas: 7.6, estado: "TARDANZA" },
  { idEmpleado: 5, entrada: null,    salida: null,    horas: 0,   estado: "AUSENTE" },
  { idEmpleado: 6, entrada: null,    salida: null,    horas: 0,   estado: "PERMISO" }
];

const solicitudesHorasExtra = [
  { id: 1, idEmpleado: 1, fecha: "2026-09-28", inicio: "17:00", fin: "19:00", horas: 2,   motivo: "Cierre de ventas del mes", estado: "PENDIENTE" },
  { id: 2, idEmpleado: 4, fecha: "2026-09-27", inicio: "22:00", fin: "23:30", horas: 1.5, motivo: "Inventario",               estado: "APROBADA" },
  { id: 3, idEmpleado: 5, fecha: "2026-09-26", inicio: "17:00", fin: "18:00", horas: 1,   motivo: "Atención de cliente",      estado: "PENDIENTE" }
];

// Historial de días anteriores (tabla "asistencia" de la BD)
const historialAsistencia = [
  { idEmpleado: 1, fecha: "2026-09-16", entrada: "07:58", salida: "17:05", horas: 9.1,  estado: "PRESENTE" },
  { idEmpleado: 1, fecha: "2026-09-17", entrada: "08:22", salida: "17:00", horas: 8.6,  estado: "TARDANZA" },
  { idEmpleado: 1, fecha: "2026-09-18", entrada: "07:55", salida: "17:01", horas: 9.1,  estado: "PRESENTE" },
  { idEmpleado: 1, fecha: "2026-09-21", entrada: null,    salida: null,    horas: 0,    estado: "AUSENTE" },
  { idEmpleado: 1, fecha: "2026-09-22", entrada: "08:03", salida: "17:10", horas: 9.1,  estado: "PRESENTE" },
  { idEmpleado: 1, fecha: "2026-09-23", entrada: null,    salida: null,    horas: 0,    estado: "JUSTIFICADO" },
  { idEmpleado: 1, fecha: "2026-09-24", entrada: "08:15", salida: "17:00", horas: 8.8,  estado: "TARDANZA" },
  { idEmpleado: 1, fecha: "2026-09-25", entrada: "07:59", salida: "17:30", horas: 9.5,  estado: "PRESENTE" },
  { idEmpleado: 1, fecha: "2026-09-28", entrada: "08:05", salida: "19:00", horas: 10.9, estado: "PRESENTE" },
  { idEmpleado: 4, fecha: "2026-09-28", entrada: "14:02", salida: "22:00", horas: 8.0, estado: "PRESENTE" },
  { idEmpleado: 5, fecha: "2026-09-28", entrada: "08:30", salida: "17:00", horas: 8.5, estado: "TARDANZA" },
  { idEmpleado: 6, fecha: "2026-09-28", entrada: "08:00", salida: "17:00", horas: 9.0, estado: "PRESENTE" }
];

// Orígenes de marcación (tabla "origen_marcacion")
let origenesMarcacion = [
  { id: 1, nombre: "PLATAFORMA", descripcion: "Marcación desde la aplicación web",
    tipo: "INTERNO", activo: true, endpoint: "", apiKey: "", ultimaPrueba: null },
  { id: 2, nombre: "QR_TOKEN", descripcion: "Código QR con token temporal",
    tipo: "INTERNO", activo: true, endpoint: "", apiKey: "", ultimaPrueba: null },
  { id: 3, nombre: "BIOMETRICO_SIMULADO", descripcion: "Nube del proveedor del huellero de la sede principal",
    tipo: "SALIENTE", activo: false, endpoint: "", apiKey: "", ultimaPrueba: null },
  { id: 4, nombre: "API_EXTERNA", descripcion: "CRM de la empresa que envía marcaciones",
    tipo: "ENTRANTE", activo: false, endpoint: "", apiKey: "", ultimaPrueba: null }
];

// Si el administrador hizo cambios, se usan los datos guardados en la sesión
empleados = JSON.parse(sessionStorage.getItem("empleados")) || empleados;
horarios = JSON.parse(sessionStorage.getItem("horarios")) || horarios;
origenesMarcacion = JSON.parse(sessionStorage.getItem("origenes")) || origenesMarcacion;