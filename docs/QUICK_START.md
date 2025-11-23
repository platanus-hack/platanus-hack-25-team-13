# 🚀 Quick Start - OpenAI Assistants API

## ✅ Checklist de implementación

### Paso 1: Preparar documentos
```bash
mkdir docs
cp /ruta/guias-minsal/*.pdf docs/
```
✅ Coloca tus PDFs de guías MINSAL en `docs/`

### Paso 2: Setup del Assistant
```bash
npm run setup:assistant
```
✅ Ejecuta el script una sola vez
✅ Copia el `ASSISTANT_ID` que te devuelve

### Paso 3: Configurar .env
```bash
# Agrega esta línea a tu .env
OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
```
✅ Pega el ID en `.env`

### Paso 4: Reiniciar servidor
```bash
npm run dev
```
✅ Reinicia el servidor de desarrollo

### Paso 5: Probar
```bash
# Abrir navegador
http://localhost:3000/landing

# O test directo
npm run test:assistant
```
✅ Genera un caso en la UI
✅ Verifica logs: debe decir "🤖 Generando caso con Assistant API"

### Paso 6: Deploy (Vercel)
```bash
# Agregar variable de entorno
vercel env add OPENAI_ASSISTANT_ID

# Deploy
vercel --prod
```
✅ Agrega el ID a las env vars de Vercel
✅ Deploy normalmente

## 🎉 ¡Listo!

Tu aplicación ahora:
- ✅ Usa documentos MINSAL pre-cargados
- ✅ No sube archivos en cada request
- ✅ Es más rápida (~3x)
- ✅ Es más barata (~50% menos)
- ✅ Funciona en Vercel sin problemas

## 📝 Comandos útiles

```bash
# Setup inicial
npm run setup:assistant

# Actualizar documentos
npm run update:assistant

# Probar Assistant
npm run test:assistant

# Desarrollo
npm run dev
```

## 🆘 Si algo falla

**El Assistant no funciona:**
- Verifica que `OPENAI_ASSISTANT_ID` esté en `.env`
- Reinicia el servidor (`npm run dev`)
- Prueba con `npm run test:assistant`

**No genera casos con info MINSAL:**
- Verifica que los PDFs se subieron: revisa `.assistant-config.json`
- Verifica que los PDFs sean válidos (no escaneados como imágenes)

**Quiero volver al método anterior:**
```bash
# Opción 1: Elimina OPENAI_ASSISTANT_ID del .env
# Opción 2: Fuerza el fallback en el código
generateClinicalCase({ useAssistant: false })
```

## 📚 Más información

- [Setup completo](./ASSISTANT_SETUP.md) - Guía detallada paso a paso
- [Migración](./MIGRATION_GUIDE.md) - Comparación antes/después
- [README](../README_ASSISTANT.md) - Resumen ejecutivo

---

**¿Preguntas?** Revisa la documentación o contacta al equipo.
