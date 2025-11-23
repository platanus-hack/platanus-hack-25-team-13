# OpenAI Assistant Setup - Guía Completa

Esta guía explica cómo configurar OpenAI Assistants API para MediSim, lo que te permite:
- ✅ Subir documentos MINSAL una sola vez
- ✅ Usar RAG automático sin configuración en cada request
- ✅ Deploy en Vercel sin problemas de memoria/timeout
- ✅ Menor latencia y costos optimizados

## 📋 Prerrequisitos

1. **API Key de OpenAI** con acceso a Assistants API
2. **Documentos MINSAL** en formato PDF o TXT
3. **Node.js 18+** y npm/pnpm instalado

## 🚀 Setup Inicial (Una sola vez)

### Paso 1: Preparar documentos

Crea la carpeta `docs/` en la raíz del proyecto y coloca tus archivos de guías MINSAL:

```bash
mkdir docs
# Copia tus PDFs de guías MINSAL aquí
# Ejemplo:
# - guia-aps-cardiovascular.pdf
# - guia-aps-diabetes.pdf
# - guia-aps-salud-mental.pdf
```

### Paso 2: Configurar variables de entorno

Asegúrate de tener tu API key en `.env`:

```bash
OPENAI_API_KEY=sk-...
```

### Paso 3: Ejecutar el script de setup

```bash
npx tsx scripts/setup-assistant.ts
```

Este script:
1. ✅ Sube todos los PDFs/TXT de `docs/` a OpenAI
2. ✅ Crea el Assistant con instrucciones pre-configuradas
3. ✅ Vincula los archivos al Assistant
4. ✅ Te devuelve el `ASSISTANT_ID`

**Output esperado:**
```
🚀 Iniciando setup de OpenAI Assistant...

📁 Archivos encontrados: 3
   - guia-aps-cardiovascular.pdf
   - guia-aps-diabetes.pdf
   - guia-aps-salud-mental.pdf

📤 Subiendo guia-aps-cardiovascular.pdf...
   ✅ Subido: file-abc123

📤 Subiendo guia-aps-diabetes.pdf...
   ✅ Subido: file-def456

📤 Subiendo guia-aps-salud-mental.pdf...
   ✅ Subido: file-ghi789

🤖 Creando Assistant...
✅ Assistant creado exitosamente!

============================================================
📋 INFORMACIÓN DEL ASSISTANT
============================================================
ID del Assistant: asst_xxxxxxxxxxxxx
Nombre: MediSim Case Generator
Modelo: gpt-4-turbo-preview
Archivos vinculados: 3

📎 IDs de archivos:
   1. file-abc123 (guia-aps-cardiovascular.pdf)
   2. file-def456 (guia-aps-diabetes.pdf)
   3. file-ghi789 (guia-aps-salud-mental.pdf)

============================================================
🔑 VARIABLES DE ENTORNO
============================================================
Agrega esta línea a tu archivo .env:

OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx

============================================================

✅ Setup completado!
💡 Ahora puedes usar el Assistant en tu aplicación con solo el ASSISTANT_ID
💡 Los archivos quedan almacenados en OpenAI permanentemente

📝 Configuración guardada en: .assistant-config.json
```

### Paso 4: Agregar ASSISTANT_ID al .env

Copia el ID generado a tu archivo `.env`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
```

## ✅ ¡Listo! Ya puedes usar el Assistant

Tu aplicación ahora usará automáticamente el Assistant API cuando esté configurado.

## 🔄 Actualizando documentos

Si necesitas actualizar las guías MINSAL:

```bash
# 1. Reemplaza los archivos en docs/
cp nuevas-guias/*.pdf docs/

# 2. Ejecuta el script de actualización
npx tsx scripts/setup-assistant.ts update
```

Esto:
- Sube los nuevos archivos
- Actualiza el Assistant existente con los nuevos IDs
- **No necesitas cambiar el ASSISTANT_ID**

## 🧪 Probando el Assistant

Puedes verificar que todo funciona:

```typescript
// En tu código
import { testAssistant } from "@/lib/agents/assistantHelper";

await testAssistant(); // Devuelve true si funciona
```

O directamente en la consola:

```bash
npx tsx -e "import('./lib/agents/assistantHelper.js').then(m => m.testAssistant())"
```

## 📊 Cómo funciona

### Antes (Sin Assistant API)
```
Request → API Route → Load docs → Create embeddings → Query → LLM → Response
           ^cada request carga docs (lento, costoso)
```

### Después (Con Assistant API)
```
Setup (una vez):
  Docs → Upload to OpenAI → Create Assistant → Get ASSISTANT_ID

Production (cada request):
  Request → API Route → Assistant API (ya tiene docs) → Response
                         ^instantáneo, sin cargar docs
```

## 💰 Costos

- **Setup inicial**: ~$0 (los uploads son gratis)
- **Almacenamiento**: $0.20/GB/mes (casi nada, típicamente <$1/mes)
- **Uso del Assistant**:
  - Mismo costo que chat completions
  - + tokens del contexto recuperado (RAG)
  - Ejemplo: ~$0.01-0.02 por caso generado

## 🚀 Deploy en Vercel

1. Agrega `OPENAI_ASSISTANT_ID` a las variables de entorno de Vercel:
   ```bash
   vercel env add OPENAI_ASSISTANT_ID
   # Pega: asst_xxxxxxxxxxxxx
   ```

2. Deploy normalmente:
   ```bash
   vercel --prod
   ```

**¡Eso es todo!** Los archivos están en OpenAI, no en tu deployment de Vercel.

## ❓ Troubleshooting

### "OPENAI_ASSISTANT_ID no está configurado"
- Asegúrate de haber ejecutado el script de setup
- Verifica que el ID esté en `.env`
- Reinicia el servidor de desarrollo

### "Error subiendo archivos"
- Verifica que los archivos sean PDF o TXT válidos
- Verifica que no excedan 512MB por archivo
- Verifica tu API key de OpenAI

### "Run falló con status: failed"
- Revisa los logs del Assistant en OpenAI Dashboard
- Puede ser un problema con el formato del prompt
- Intenta con el fallback (Chat Completion)

### Fallback a Chat Completion
Si el Assistant falla, el sistema automáticamente usa Chat Completion tradicional:
```typescript
// En caseCreatorAgent.ts
generateClinicalCase({
  useAssistant: false // Forzar Chat Completion
});
```

## 📚 Recursos adicionales

- [OpenAI Assistants API Docs](https://platform.openai.com/docs/assistants/overview)
- [File Search (RAG)](https://platform.openai.com/docs/assistants/tools/file-search)
- [OpenAI Dashboard](https://platform.openai.com/assistants) - Ver tus Assistants

## 🔒 Seguridad

- ✅ Los archivos se almacenan en OpenAI (encriptados)
- ✅ Solo tu API key puede acceder al Assistant
- ✅ Los archivos no son públicos
- ✅ Puedes eliminar archivos/assistant cuando quieras:
  ```bash
  # Eliminar Assistant
  curl https://api.openai.com/v1/assistants/{assistant_id} \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -X DELETE
  ```

## 💡 Tips

1. **Organiza tus documentos**: Usa nombres descriptivos para los PDFs
2. **Actualiza regularmente**: Mantén las guías MINSAL actualizadas
3. **Monitorea costos**: Revisa tu usage en OpenAI Dashboard
4. **Usa el fallback**: Ten siempre Chat Completion como backup

---

¿Preguntas? Revisa el código en:
- `scripts/setup-assistant.ts` - Script de setup
- `lib/agents/assistantHelper.ts` - Funciones helper
- `lib/agents/caseCreatorAgent.ts` - Integración
