# FinanzasPro: Gestor Financiero Personal

Una aplicación Full-Stack diseñada para el control exhaustivo de finanzas personales. Permite la gestión de presupuestos mensuales, seguimiento de gastos recurrentes y visualización de datos anuales mediante una interfaz moderna y reactiva.

---

## Características Principales

### Gestión y Control

- **Dashboard Mensual:** Visualización detallada de ingresos, gastos y balance neto con indicadores de salud financiera.
- **Resumen Anual:** Perspectiva macroeconómica con gráficos de evolución por categorías y ahorro total acumulado.
- **Gestión de Presupuestos:** Sistema de barras de progreso para monitorizar el gasto en tiempo real frente a los límites definidos por categoría.

### Automatización y Configuración

- **Gastos Fijos (Plantillas):** Sistema para definir gastos e ingresos recurrentes (alquiler, nómina, suscripciones) e importarlos mensualmente con un solo clic.
- **Categorización Dinámica:** Creación, edición y eliminación de categorías personalizadas con techos de gasto.
- **Metas de Ahorro:** Cálculo automático del progreso de ahorro basado en el histórico total de transacciones.

### Tecnología y Diseño

- **Interfaz Glassmorphism:** Diseño limpio utilizando transparencias y sombras suaves para jerarquizar la información.
- **Gráficos Interactivos:** Visualización de datos mediante Recharts (Donut charts para distribución mensual y Bar charts para evolución anual).

---

## Stack Tecnológico

La aplicación sigue una arquitectura cliente-servidor (REST API).

**Backend**

- **Language:** Python 3.12+
- **Framework:** FastAPI
- **ORM:** SQLAlchemy
- **Database:** SQLite (Autogenerada)
- **Data Processing:** Pandas

**Frontend**

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS
- **Visualization:** Recharts
- **Icons:** Lucide React
- **HTTP Client:** Axios

---

## Guía de Instalación

Sigue estos pasos para desplegar la aplicación en entorno local.

### 1. Configuración del Backend

Navega a la carpeta del servidor e instala las dependencias de Python.

```bash
cd backend

# 1. Crear entorno virtual (Recomendado)
python3 -m venv venv

# 2. Activar el entorno
# En Linux/Mac:
source venv/bin/activate
# En Windows:
# .\venv\Scripts\activate

# 3. Instalar librerías
pip install fastapi uvicorn sqlalchemy pydantic pandas python-multipart
```

### 2. Configuración del Frontend

En una nueva terminal, navega a la carpeta del cliente e instala las dependencias de Node.js.

```Bash
cd frontend
```

# Instalar todas las dependencias listadas en package.json

```bash
npm install
```

# Ejecución

Para utilizar la aplicación, debes mantener ambos servidores (Backend y Frontend) en ejecución simultánea.

## Terminal 1: Backend

```Bash
cd backend
uvicorn main:app --reload
```

El servidor API iniciará en: https://www.google.com/search?q=http://127.0.0.1:8000

## Terminal 2: Frontend

```Bash
cd frontend
npm run dev
```

La interfaz de usuario iniciará en: http://localhost:5173

# Manual de Uso

## Configuración Inicial

Antes de registrar transacciones, se recomienda configurar los datos maestros desde el botón de Configuración (⚙️) situado en la barra superior:

    Definir Meta: Establece el objetivo de ahorro global.

    Plantillas: Registra los gastos fijos (Alquiler, Gimnasio) y los ingresos fijos (Nómina), asignando obligatoriamente una categoría.

    Categorías: Crea nuevas categorías o ajusta los presupuestos mensuales de las existentes.

## Flujo de Trabajo Mensual

    Selecciona el mes y año en la barra de navegación superior.

    Pulsa "Importar Fijos" para cargar automáticamente las plantillas configuradas en ese mes específico.

    Utiliza el formulario "Nuevo Movimiento" para registrar los gastos variables del día a día.

# Vista Anual

Pulsa el botón "Ver Año" en la barra de navegación para cambiar al modo de resumen anual, donde podrás ver gráficos de barras con la evolución de gastos por categoría y los totales acumulados.
Mantenimiento de Datos

La base de datos es un archivo local (finanzas.db) ubicado en la carpeta backend.
Para reiniciar la aplicación de fábrica (borrar todos los datos):

    Detén el proceso del backend (Ctrl + C).

    Elimina el archivo de base de datos:

```Bash
rm backend/finanzas.db
```

    Reinicia el backend. El sistema regenerará el archivo automáticamente con la configuración por defecto.
