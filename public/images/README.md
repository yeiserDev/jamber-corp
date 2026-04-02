# 📁 Carpeta de Imágenes - Jamber Corp

Esta carpeta contiene todas las imágenes públicas del proyecto que se pueden acceder desde la web.

## 📂 Estructura de Carpetas

```
public/images/
├── logos/          # Logos de la empresa y marcas
├── transportes/    # Imágenes relacionadas con transportes y viajes
├── gastos/         # Imágenes y evidencias de gastos
└── avatars/        # Fotos de perfil y avatares de usuarios
```

## 🔗 Cómo Usar las Imágenes

### En componentes React/Next.js:

```tsx
import Image from "next/image";

// Opción 1: Usando el componente Image de Next.js (recomendado)
<Image
  src="/images/logos/jamber-logo.png"
  alt="Jamber Corp Logo"
  width={200}
  height={100}
/>

// Opción 2: Usando una etiqueta img normal
<img
  src="/images/transportes/camion.jpg"
  alt="Camión de transporte"
/>
```

### En CSS:

```css
.banner {
  background-image: url('/images/logos/background.jpg');
}
```

## 📝 Convenciones de Nombres

- Usa nombres descriptivos en minúsculas
- Separa palabras con guiones: `camion-azul.jpg`
- Incluye el propósito: `avatar-usuario-1.png`
- Formato recomendado:
  - Fotos: `.jpg` o `.webp`
  - Logos/iconos: `.png` o `.svg`

## ⚡ Optimización

- Comprime las imágenes antes de subirlas
- Usa formatos modernos como `.webp` cuando sea posible
- Para logos, prefiere `.svg` (escalables sin pérdida de calidad)

## 🎯 Ejemplos de Uso por Carpeta

### `/logos/`
- Logo de Jamber Corp
- Logos de partners o clientes
- Iconos de la aplicación

### `/transportes/`
- Fotos de camiones y vehículos
- Imágenes de rutas
- Capturas de guías de remisión

### `/gastos/`
- Comprobantes y facturas
- Fotos de evidencias de gastos
- Screenshots de servicios

### `/avatars/`
- Fotos de perfil de usuarios
- Avatares predeterminados
- Imágenes de equipo

---

**Nota**: Todas las imágenes en la carpeta `public/` son accesibles públicamente en la web.