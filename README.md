# Jamber Corp — Gestión de Gastos de Locales

> Plataforma web para automatizar la distribución de gastos de agua y luz entre locales comerciales. Elimina el trabajo manual de calcular cuánto paga cada local por mes.

![Preview](public/images/preview.png)

---

## El Problema que Resuelve

En muchos negocios con múltiples locales (panaderías, spas, academias, etc.) que comparten una sola factura de agua o luz, el propietario debe **calcular manualmente** cuánto corresponde pagar a cada local según su consumo de medidor. Este proceso es propenso a errores, lento y difícil de auditar.

**Jamber Corp** digitaliza y automatiza ese proceso completo.

---

## Funcionalidades

- **Dashboard** — Vista general con total del mes, comparativa vs mes anterior, gráfico histórico de 6 meses y distribución por local
- **Registro de Gastos** — Ingresa la factura mensual de luz o agua, las lecturas de cada medidor y el sistema calcula automáticamente cuánto paga cada local
- **Distribución inteligente** — Soporta locales con múltiples medidores; la diferencia de consumo se asigna automáticamente a la residencia
- **Generación de Reportes** — Exporta el detalle de costos por local como imagen (PNG) para compartir o archivar
- **Reporte Especial por Local** — Genera un reporte específico para locales tipo "profesor" con formato independiente
- **Autenticación segura** — Login con contraseña hasheada (bcrypt) y sesión mediante cookie HTTP-only
- **Roles** — Soporte para perfiles `admin` y `user`
- **Calendario** — Visualiza qué meses tienen gastos registrados

---

## Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Lenguaje | TypeScript 5 |
| Base de Datos | MongoDB Atlas |
| ORM | Mongoose 9 |
| Auth | bcryptjs + Cookie HTTP-only |
| Iconos | Lucide React |
| Notificaciones | react-hot-toast |
| Reportes | html2canvas-pro |
| Imágenes | Cloudinary |
| Fuentes | Google Fonts — Outfit |

---

## Screenshots

| Login | Dashboard | Gastos |
|-------|-----------|--------|
| ![Login](public/images/screenshot-login.png) | ![Dashboard](public/images/screenshot-dashboard.png) | ![Gastos](public/images/screenshot-gastos.png) |

---

## Instalación y uso local

### Requisitos
- Node.js 18+
- Una base de datos en [MongoDB Atlas](https://cloud.mongodb.com) (gratis)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/jamber-corp.git
cd jamber-corp
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local` con tu URI de MongoDB y credenciales de Cloudinary (opcional).

### 4. Inicializar usuarios demo

Una sola vez, ejecuta en tu navegador o con curl:

```bash
curl -X POST http://localhost:3000/api/auth/init
```

Esto crea los usuarios de prueba en la base de datos.

### 5. Levantar el servidor

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## Credenciales Demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `chopchop` | `123` | user |

---

## Estructura del Proyecto

```
jamber-corp/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, logout, inicialización
│   │   ├── gastos/        # CRUD de registros de gastos
│   │   └── locales/       # CRUD de locales comerciales
│   ├── gastos/            # Página de gestión de gastos
│   ├── login/             # Página de autenticación
│   └── page.tsx           # Dashboard principal
├── components/
│   ├── DashboardLayout.tsx
│   ├── Sidebar.tsx
│   └── gastos/GastoCard.tsx
├── lib/
│   ├── db/mongodb.ts      # Conexión a MongoDB con cache
│   └── models/            # Esquemas Mongoose (User, Local, Gasto)
├── middleware.ts           # Protección de rutas con cookie
├── types/                 # Interfaces TypeScript
└── utils/                 # Generación de reportes
```

---

## Deploy

El proyecto está listo para desplegarse en **Vercel** con un click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Solo necesitas configurar las variables de entorno en el panel de Vercel.

---

## Licencia

MIT
