# StudyHubApp

Plataforma web para estudiantes que centraliza asignaturas, tareas, planificación, IA y herramientas de estudio en un solo lugar. Construida con Angular 21, TailwindCSS 4 y conexión en tiempo real con Socket.IO.

## Características

- **Autenticación completa**: registro, inicio de sesión, verificación de email, recuperación y restablecimiento de contraseña, y callback de autenticación externa (OAuth).
- **Dashboard**: panel principal con el resumen de la vida académica.
- **Asignaturas y tareas**: gestión de materias, detalle de asignatura y de cada tarea.
- **Profesor IA**: asistente con perfiles de profesor por materia, estilos de enseñanza y niveles de dificultad, con renderizado de Markdown y LaTeX (KaTeX).
- **Roadmaps**: rutas de aprendizaje listables y detalladas paso a paso para cada objetivo.
- **Grupos de estudio**: creación, exploración de grupos y detalle de cada grupo.
- **Riesgo académico**: análisis de riesgo académico, historial y recálculo por asignaturas.
- **Temporizador de estudio**: herramienta de concentración con técnicas de estudio.
- **Agenda**: organización de citas y eventos académicos.
- **CV**: módulo de currículum para perfilar el perfil profesional.
- **Notificaciones**: centro de notificaciones.
- **Perfil**: gestión de la cuenta.
- **Laboratorio**: módulo experimental con carga diferida (lazy loading).
- **Guardas de autenticación**, interceptores HTTP y pipes/helpers compartidos.

## Stack

| Capa        | Tecnología                          |
|-------------|-------------------------------------|
| Frontend    | Angular 21, TypeScript 5.9, RxJS    |
| Estilos     | TailwindCSS 4, PostCSS              |
| Iconos      | @ng-icons/lucide, @ng-icons/core    |
| Tiempo real | Socket.IO                           |
| Contenido   | marked, dompurify, KaTeX (LaTeX)    |
| Server-side | Angular SSR + Express 5             |
| Pruebas     | Vitest, jsdom                       |

## Requisitos

- Node.js (recomendado >= 20)
- npm (o el package manager de tu preferencia)

## Instalación y ejecución

```bash
npm install
```

Servidor de desarrollo:

```bash
ng serve
```

Abre `http://localhost:4200/`. La aplicación se recarga automáticamente al modificar los archivos fuente.

## Build

```bash
ng build
```

Los artefactos se generan en `dist/`.

## Tests

```bash
ng test
```

Ejecuta los unit tests con Vitest.

## Configuración

- Variables de entorno en `.env` (por ejemplo `BASE_URL` para la URL base del backend).
- La API del backend apunta a `https://study-hub-backend-sigma.vercel.app`.

## Estructura del proyecto

```
src/
├── app/
│   ├── components/   # Vistas y componentes funcionales
│   ├── services/     # Servicios HTTP y de estado
│   ├── guards/       # Guardas de autenticación
│   ├── interceptors/ # Interceptores HTTP
│   ├── pipes/        # Pipes reutilizables
│   ├── utils/        # Utilidades (ej. caché)
│   └── app.routes.ts # Definición de rutas
├── server.ts         # Servidor SSR (Express)
└── main.ts           # Punto de entrada del navegador
```

## Licencia

Privado — uso personal/proyecto académico.