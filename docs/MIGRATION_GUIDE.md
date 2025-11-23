# Guía de Migración a OpenAI Assistants API

## 🎯 ¿Qué cambió?

Antes generábamos casos clínicos enviando los documentos MINSAL en cada request.
Ahora los documentos se suben **una sola vez** a OpenAI y se reutilizan automáticamente.

## ✅ Ventajas de la migración

1. **Más rápido**: No carga documentos en cada request
2. **Más barato**: Menos tokens procesados repetidamente
3. **Compatible con Vercel**: Sin límites de memoria/timeout
4. **Más simple**: Solo necesitas el `ASSISTANT_ID`
5. **RAG automático**: OpenAI maneja la búsqueda en documentos

## 📦 Archivos nuevos

```
platanus-hack-25-team-13/
├── scripts/
│   └── setup-assistant.ts          # Script de configuración (ejecutar una vez)
├── lib/agents/
│   ├── assistantHelper.ts          # Funciones para usar el Assistant
│   └── caseCreatorAgent.ts         # Actualizado con soporte para Assistant
└── docs/
    ├── ASSISTANT_SETUP.md          # Guía completa de setup
    └── MIGRATION_GUIDE.md          # Este archivo
```

## 🚀 Migración en 3 pasos

### Paso 1: Preparar documentos MINSAL

```bash
# Crear carpeta docs si no existe
mkdir docs

# Copiar tus PDFs de guías MINSAL
cp /path/to/guias/*.pdf docs/
```

### Paso 2: Ejecutar script de setup

```bash
npx tsx scripts/setup-assistant.ts
```

Esto subirá los documentos y te dará un `ASSISTANT_ID`.

### Paso 3: Agregar ID al .env

```bash
# Copiar el ID generado a tu .env
echo "OPENAI_ASSISTANT_ID=asst_xxxxx" >> .env
```

**¡Listo!** Tu aplicación ahora usa el Assistant automáticamente.

## 🔄 Comportamiento actual

El sistema ahora funciona así:

```typescript
// Si OPENAI_ASSISTANT_ID está configurado → usa Assistant API (RAG)
// Si no está configurado → usa Chat Completion tradicional (fallback)

// Tu código NO necesita cambios
const case = await generateClinicalCase({
  specialty: "aps",
  difficulty: "medium"
});
// ↑ Automáticamente elige el mejor método
```

## 📊 Comparación

### Antes (Chat Completion)
```typescript
Request
  ↓
Load MINSAL docs from disk (5-10 MB)
  ↓
Create embeddings (~20-30s)
  ↓
Query vector DB
  ↓
Send context + prompt to LLM
  ↓
Response
```
⏱️ **Tiempo**: 20-40 segundos
💰 **Costo**: ~$0.03-0.05 por caso

### Después (Assistant API)
```typescript
Request
  ↓
Call Assistant API (docs ya están en OpenAI)
  ↓
RAG automático
  ↓
Response
```
⏱️ **Tiempo**: 5-15 segundos
💰 **Costo**: ~$0.01-0.02 por caso

## 🧪 Testing

### Test local
```bash
# Generar un caso de prueba
npm run dev

# Ir a http://localhost:3000/landing
# Seleccionar especialidad y generar caso
```

### Test del Assistant directamente
```bash
npx tsx -e "
  import('./lib/agents/assistantHelper.js')
    .then(m => m.testAssistant())
"
```

## 🚨 Rollback (si algo falla)

Si necesitas volver al método anterior:

```bash
# Opción 1: Eliminar ASSISTANT_ID del .env
# El sistema automáticamente usa Chat Completion

# Opción 2: Forzar Chat Completion en el código
const case = await generateClinicalCase({
  specialty: "aps",
  difficulty: "medium",
  useAssistant: false // ← Forzar método tradicional
});
```

## 📝 Checklist de migración

- [ ] Ejecutar `npx tsx scripts/setup-assistant.ts`
- [ ] Copiar `ASSISTANT_ID` a `.env`
- [ ] Reiniciar servidor de desarrollo
- [ ] Probar generar un caso en `/landing`
- [ ] Verificar logs: debe decir "🤖 Generando caso con Assistant API"
- [ ] Deploy a Vercel con `OPENAI_ASSISTANT_ID` en env vars

## 🆘 Problemas comunes

### "OPENAI_ASSISTANT_ID no está configurado"
✅ Ejecuta el script de setup y agrega el ID al .env

### "Error subiendo archivos"
✅ Verifica que los PDFs sean válidos (<512MB cada uno)

### "Run falló con status: failed"
✅ Revisa los logs en OpenAI Dashboard
✅ El sistema automáticamente hace fallback a Chat Completion

### "No genera casos con información de MINSAL"
✅ Verifica que los PDFs se hayan subido correctamente
✅ Revisa `.assistant-config.json` para ver los file IDs

## 🎓 Recursos

- [Setup completo](./ASSISTANT_SETUP.md) - Guía detallada
- [OpenAI Assistants Docs](https://platform.openai.com/docs/assistants/overview)
- [OpenAI Dashboard](https://platform.openai.com/assistants) - Ver tu Assistant

## 💡 Tips para producción

1. **Ejecuta setup en CI/CD**: Automatiza la creación del Assistant
2. **Versionado de documentos**: Usa nombres con fecha (`guia-aps-2025.pdf`)
3. **Monitorea costos**: Revisa OpenAI Dashboard regularmente
4. **Backup del ASSISTANT_ID**: Guárdalo en gestores de secretos
5. **Testing**: Siempre prueba después de actualizar documentos

---

**¿Dudas?** Revisa el código o contacta al equipo de desarrollo.
