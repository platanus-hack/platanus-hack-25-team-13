# API de Búsqueda de Exámenes Médicos

## Endpoint: `/api/generar-examen`

Busca imágenes de exámenes médicos en la estructura de carpetas usando búsqueda eficiente tipo binaria.

### Método: POST

### Parámetros del Body:

```json
{
  "tipo": "ecografia",              // Requerido
  "clasificacion": "abdominal",     // Opcional (depende del tipo)
  "subclasificacion": "colelitiasis" // Opcional (depende del tipo)
}
```

### Parámetros:

- **tipo** (requerido): Tipo de examen
  - `radiografia`
  - `ecografia`
  - `laboratorio`
  - `electrocardiograma`
  - `tomografia`
  - `resonancia`
  - `examen_fisico`

- **clasificacion** (opcional): Clasificación del examen
  - Para `radiografia`: `torax`, `abdomen`, `extremidades`
  - Para `ecografia`: `abdominal`, `pelvica`, `cardiaca`
  - Para `laboratorio`: `hemograma`, `bioquimica`, `coagulacion`
  - Para `tomografia`: `torax`, `abdomen`
  - Para `resonancia`: `cerebral`, `columna`
  - Para `examen_fisico`: `garganta`, `ojo`, `piel`
  - Para `electrocardiograma`: no requiere clasificación

- **subclasificacion** (opcional): Subclasificación específica
  - Ejemplos: `normal`, `neumonia`, `colelitiasis`, `taquicardia`, etc.

### Ejemplos de Uso:

#### 1. Ecografía abdominal con colelitiasis:
```json
{
  "tipo": "ecografia",
  "clasificacion": "abdominal",
  "subclasificacion": "colelitiasis"
}
```

#### 2. Radiografía de tórax normal:
```json
{
  "tipo": "radiografia",
  "clasificacion": "torax",
  "subclasificacion": "normal"
}
```

#### 3. Electrocardiograma con taquicardia (sin clasificación):
```json
{
  "tipo": "electrocardiograma",
  "subclasificacion": "taquicardia"
}
```

#### 4. Resonancia cerebral normal:
```json
{
  "tipo": "resonancia",
  "clasificacion": "cerebral",
  "subclasificacion": "normal"
}
```

### Respuesta Exitosa (200):

```json
{
  "success": true,
  "data": {
    "imageUrl": "/examenes/ecografia/abdominal/colelitiasis/imagen.jpeg",
    "tipo": "ecografia",
    "clasificacion": "abdominal",
    "subclasificacion": "colelitiasis",
    "timestamp": "2025-11-22T17:30:00.000Z"
  }
}
```

### Respuesta de Error (404):

```json
{
  "error": "Imagen no encontrada",
  "details": {
    "tipo": "ecografia",
    "clasificacion": "abdominal",
    "subclasificacion": "colelitiasis"
  }
}
```

### Respuesta de Error (400):

```json
{
  "error": "El parámetro 'tipo' es requerido"
}
```

## Estructura de Carpetas

Las imágenes se buscan en la siguiente estructura:

```
/public/examenes/
  ├── {tipo}/
  │   ├── {clasificacion}/          (opcional)
  │   │   ├── {subclasificacion}/   (opcional)
  │   │   │   └── imagen.{ext}
```

### Extensiones Soportadas:

- `.jpg`
- `.jpeg`
- `.png`
- `.webp`

### Algoritmo de Búsqueda:

1. **Búsqueda del tipo**: Verifica si existe `/public/examenes/{tipo}/`
2. **Búsqueda de clasificación**: Si se proporciona, busca `/public/examenes/{tipo}/{clasificacion}/`
3. **Búsqueda de subclasificación**: Si se proporciona, busca `/public/examenes/{tipo}/{clasificacion}/{subclasificacion}/`
4. **Búsqueda de imagen**: Busca archivos con nombre `imagen.{ext}` o cualquier archivo de imagen en el directorio final

### Ventajas de la Búsqueda:

- **Eficiente**: Búsqueda directa en el sistema de archivos (O(1) por nivel)
- **Rápida**: No requiere indexación previa
- **Escalable**: Funciona con cualquier cantidad de imágenes
- **Flexible**: Soporta diferentes estructuras según el tipo de examen

