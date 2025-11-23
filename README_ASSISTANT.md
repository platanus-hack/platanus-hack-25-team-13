# 🤖 OpenAI Assistants API - Resumen Ejecutivo

## 📌 TL;DR

Ahora MediSim usa **OpenAI Assistants API** para generar casos clínicos con RAG de documentos MINSAL.

**Ventajas:**
- ✅ Subes documentos **una sola vez**
- ✅ **No los vuelves a enviar** en cada request
- ✅ Funciona **perfecto en Vercel** (sin límites de memoria/timeout)
- ✅ **Más rápido** (5-15s vs 20-40s)
- ✅ **Más barato** (~50% menos)

## 🚀 Quick Start

### 1. Subir archivos (una sola vez)
```bash
# Coloca tus PDFs de guías MINSAL en data/medical-knowledge/
mkdir -p data/medical-knowledge
cp /path/to/guias/*.pdf data/medical-knowledge/

# Ejecuta el script para subir archivos
npx tsx scripts/upload-files.ts

# Copia los OPENAI_FILE_IDS al .env
# El script te mostrará la línea exacta a copiar
echo "OPENAI_FILE_IDS=file-xxx,file-yyy,file-zzz" >> .env
```

### 2. Los archivos YA ESTÁN en OpenAI
Una vez subidos, **NO se vuelven a subir nunca más**. El Assistant los usa directamente desde OpenAI cada vez que genera un caso.

### 3. Deploy
```bash
# Agrega los IDs a Vercel
vercel env add OPENAI_FILE_IDS

# Deploy
vercel --prod
```

**¡Eso es todo!** 🎉

## 🔑 Respuestas rápidas

### ¿Tengo que subir los archivos en cada deploy?
**No.** Los archivos viven en OpenAI permanentemente. Solo necesitas configurar `OPENAI_FILE_IDS` una sola vez.

### ¿Funciona en Vercel?
**Sí.** Perfectamente. Los archivos no están en tu deployment.

### ¿Es más caro?
**No.** Es ~50% más barato que enviar documentos en cada request.

### ¿Qué pasa si no configuro OPENAI_FILE_IDS?
El sistema lanzará un error pidiendo que subas los archivos primero.

### ¿Cómo actualizo los documentos?
```bash
# Reemplaza los PDFs en data/medical-knowledge/
cp nuevas-guias/*.pdf data/medical-knowledge/

# Vuelve a ejecutar el script
npx tsx scripts/upload-files.ts

# Actualiza OPENAI_FILE_IDS en .env con los nuevos IDs
```

### ¿Puedo ver los archivos subidos en OpenAI?
Sí: https://platform.openai.com/storage/files

## 📁 Archivos importantes

```
scripts/upload-files.ts          # Script para subir archivos (ejecutar una vez)
lib/assistant.ts                 # Lógica del Assistant y RAG
lib/orchestator/simulationEngine.ts  # Orquestador principal
lib/agents/caseCreatorAgent.ts   # Generación de casos
```

## 📊 Cómo funciona

### Setup (una sola vez)
```
Tus PDFs → Upload a OpenAI → Te da FILE_IDS → Guardas en .env
```

### Primera vez que se crea un caso (por servidor/deploy)
```
Request → Crea Assistant con FILE_IDS → Guarda ASSISTANT_ID en memoria
```

### Siguientes requests (usa Assistant ya creado)
```
Request → Assistant API (ya tiene PDFs) → RAG automático → Response
```

**Los PDFs nunca se cargan de nuevo.** Solo se usan los FILE_IDS para crear el Assistant, que luego se reutiliza en memoria.

## 🧪 Testing

```bash
# Primero sube los archivos (si no lo has hecho)
npx tsx scripts/upload-files.ts

# Configura el .env con los FILE_IDS que te dio el script

# Prueba en la UI
npm run dev
# → http://localhost:3000/landing
# → Selecciona especialidad "APS"
# → Genera un caso
# → Debe funcionar sin volver a subir archivos
```

## 💰 Costos

- **Setup inicial**: Gratis
- **Almacenamiento**: ~$0.20/GB/mes (típicamente <$1/mes)
- **Por caso generado**: ~$0.01-0.02 (vs $0.03-0.05 antes)

## 🆘 Si algo falla

### Error: "OPENAI_FILE_IDS no está configurado"
1. Verifica que ejecutaste `npx tsx scripts/upload-files.ts`
2. Copia la línea `OPENAI_FILE_IDS=...` que te dio el script al archivo `.env`
3. Reinicia el servidor

### Los archivos se suben cada vez
- Verifica que `OPENAI_FILE_IDS` esté en tu `.env`
- El código ya NO sube archivos en cada request, solo los usa por ID

### Ver archivos subidos en OpenAI
- Ve a: https://platform.openai.com/storage/files
- Busca archivos con `purpose: "assistants"`

---

**Hecho por:** Grupo 13 - Platanus Hack 25
**Fecha:** 2025-01-22
