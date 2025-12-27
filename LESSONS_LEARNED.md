# RRHH2 - Lessons Learned

## Resumen del Proyecto

**Objetivo**: App de RRHH con fichajes, gestión de empleados y reportes.
**Duración**: Varias sesiones de desarrollo.
**Estado**: MVP funcional en staging.

---

## ❌ Problemas Encontrados

### 1. NEXTAUTH_URL - "Invalid URL: https://"

**Problema**: NextAuth fallaba con `TypeError: Invalid URL - input: 'https://'`

**Causa Raíz**:

- Código intentaba manipular `process.env.NEXTAUTH_URL` de forma "inteligente"
- Lógica compleja en `next.config.js` e `instrumentation.ts` causaba conflictos
- NextAuth ya lee `NEXTAUTH_URL` automáticamente

**Solución Final**:

```typescript
// Validación defensiva antes de NextAuth
function ensureValidNextAuthUrl(): void {
    const currentUrl = process.env.NEXTAUTH_URL || ''
    if (!isValidUrl(currentUrl)) {
        // Reconstruir desde RAILWAY_PUBLIC_DOMAIN
        const fixedUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        process.env.NEXTAUTH_URL = fixedUrl
    }
}
```

> [!TIP]
> **Lección**: No manipular variables de entorno manualmente. Configurarlas correctamente en Railway y dejar que las librerías las lean directamente.

---

### 2. Database Authentication Failed (P1000)

**Problema**: `Error: P1000: Authentication failed against database server`

**Causa**: `DATABASE_URL` con credenciales desactualizadas en Railway.

**Solución**: Actualizar la variable en Railway usando el valor actual de Postgres.

> [!IMPORTANT]
> **Lección**: Usar "Reference Variables" en Railway para que `DATABASE_URL` se actualice automáticamente cuando cambien las credenciales de Postgres.

---

### 3. Colores del Sidebar (bg-primary no funcionaba)

**Problema**: `bg-primary` mostraba color casi invisible.

**Causa**: Variables CSS en formato HSL sin `hsl()` wrapper no se aplicaban correctamente con Tailwind 4.

**Solución**: Usar color hex hardcodeado `bg-[#b32320]`.

> [!TIP]
> **Lección**: Cuando hay problemas con variables CSS, usar valores hardcodeados como fallback temporal.

---

## ✅ Qué Funcionó Bien

| Área | Detalle |
|------|---------|
| **Prisma + Railway** | Migraciones automáticas funcionan bien |
| **NextAuth Credentials** | Flujo de login admin estable |
| **PWA** | next-pwa se integró sin problemas |
| **Tailwind 4** | Nuevo sistema funciona, pero cuidado con CSS variables |

---

## 📋 Checklist para Próximos Proyectos

### Railway Setup

- [ ] Configurar `NEXTAUTH_URL` como variable de servicio (no código)
- [ ] Usar "Reference Variables" para `DATABASE_URL`
- [ ] Verificar conexión DB antes de deploy
- [ ] Tener staging y production con DBs separadas

### NextAuth

- [ ] **NO** manipular `process.env.NEXTAUTH_URL` en código
- [ ] Agregar `trustHost: true` en authOptions
- [ ] Usar `NEXTAUTH_SECRET` de al menos 32 caracteres

### Tailwind/CSS

- [ ] Probar colores en dev antes de deploy
- [ ] Si `bg-primary` falla, usar hex: `bg-[#b32320]`
- [ ] Mantener `globals.css` simple

### Git/Deploy

- [ ] Siempre probar en staging antes de production
- [ ] Commits atómicos y descriptivos
- [ ] No pushear a main/master directamente

---

## 🔧 Mejoras Sugeridas

1. **Testing**: Agregar tests E2E con Playwright
2. **Monitoring**: Integrar Sentry para errores en producción
3. **CI/CD**: Agregar GitHub Actions para lint/test antes de deploy
4. **DB Backups**: Configurar backups automáticos en Railway
5. **Docs**: Mantener README actualizado con setup local

---

## 📊 Tiempo Invertido en Debugging

| Issue | Tiempo Estimado |
|-------|-----------------|
| NEXTAUTH_URL | ~2 horas |
| Colores sidebar | ~30 min |
| Database auth | ~15 min |

> [!CAUTION]
> El 80% del tiempo de debugging fue por variables de entorno mal configuradas. **Verificar env vars ANTES de buscar bugs en código.**
