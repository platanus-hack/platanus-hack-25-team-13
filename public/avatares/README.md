# Avatares del Paciente

Esta carpeta contiene las imágenes de avatares del paciente que cambian según el estado de la conversación.

## 📋 Imágenes Requeridas

Debes crear **8 imágenes** con los siguientes nombres exactos:

1. **`neutral.png`** - Expresión neutral (inicio de conversación, paciente tranquilo)
2. **`hablando.png`** - Paciente hablando/respondiendo (boca abierta, gesto de comunicación)
3. **`pensando.png`** - Paciente pensando (cuando el doctor está escribiendo, expresión reflexiva)
4. **`dolor.png`** - Expresión de dolor o malestar (ceño fruncido, gesto de incomodidad)
5. **`preocupado.png`** - Expresión preocupada (mirada seria, cejas fruncidas)
6. **`aliviado.png`** - Expresión aliviada (sonrisa suave, expresión relajada)
7. **`diagnostico.png`** - Expresión durante el diagnóstico (expresión seria pero esperanzada)
8. **`esperando.png`** - Esperando respuesta del doctor (expresión paciente, expectante)

## 🎨 Especificaciones Técnicas

- **Formato**: PNG con transparencia (fondo transparente)
- **Tamaño recomendado**: 512x512px o 1024x1024px
- **Resolución**: Mínimo 72 DPI, recomendado 150-300 DPI
- **Fondo**: Transparente (alpha channel)
- **Estilo**: Ilustración médica profesional, amigable y empática
- **Consistencia**: Todas las imágenes deben tener el mismo estilo y personaje

## 🛠️ Dónde Generar los Avatares

### Opción 1: Herramientas de IA (Recomendado)
- **Midjourney**: `https://midjourney.com` - Genera ilustraciones de alta calidad
- **DALL-E 3**: `https://openai.com/dall-e-3` - Via ChatGPT Plus o API
- **Stable Diffusion**: `https://stability.ai` - Open source, muy flexible
- **Leonardo.ai**: `https://leonardo.ai` - Gratis con límites, bueno para avatares

**Prompt sugerido para IA:**
```
Medical illustration of a friendly patient avatar, [expresión], 
professional medical style, clean background, transparent PNG, 
512x512px, empathetic and approachable, medical consultation setting
```

### Opción 2: Herramientas de Diseño
- **Figma**: `https://figma.com` - Diseño vectorial, exporta PNG
- **Adobe Illustrator**: Diseño profesional vectorial
- **Canva**: `https://canva.com` - Plantillas y diseño fácil
- **Procreate**: Para iPad, ilustración manual

### Opción 3: Recursos Gratuitos
- **OpenPeeps**: `https://openpeeps.com` - Avatares ilustrados gratuitos
- **Humaaans**: `https://humaaans.com` - Ilustraciones de personas
- **Undraw**: `https://undraw.co` - Ilustraciones médicas
- **Freepik**: `https://freepik.com` - Recursos gráficos (requiere atribución)

### Opción 4: Contratar un Diseñador
- **Fiverr**: `https://fiverr.com` - Busca "medical avatar illustration"
- **99designs**: `https://99designs.com` - Diseñadores profesionales
- **Upwork**: `https://upwork.com` - Freelancers especializados

## 📝 Instrucciones de Generación

### Si usas IA (Midjourney/DALL-E):
1. Genera cada expresión por separado
2. Usa el mismo "seed" o estilo base para mantener consistencia
3. Asegúrate de que el personaje sea el mismo en todas las imágenes
4. Exporta con fondo transparente

### Si usas diseño manual:
1. Crea un personaje base consistente
2. Modifica solo las expresiones faciales
3. Mantén la misma ropa, peinado y características físicas
4. Exporta cada variante como PNG transparente

## ✅ Checklist de Verificación

Antes de subir las imágenes, verifica:
- [ ] Todas las 8 imágenes están presentes
- [ ] Nombres exactos (case-sensitive): `neutral.png`, `hablando.png`, etc.
- [ ] Formato PNG con transparencia
- [ ] Mismo personaje en todas las imágenes
- [ ] Tamaño adecuado (512x512px o mayor)
- [ ] Calidad profesional y clara
- [ ] Expresiones distintas y reconocibles

## 🚀 Uso en la Aplicación

El componente `ChatAvatar` automáticamente selecciona la expresión apropiada según:
- El paso actual del proceso (Antecedentes, Consulta, Diagnóstico)
- El estado de la conversación (hablando, pensando, esperando)
- El contenido de los mensajes (dolor, preocupación, etc.)

No necesitas modificar código, solo coloca las imágenes en esta carpeta con los nombres correctos.

