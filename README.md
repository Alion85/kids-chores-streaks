# Chore Streaks 👨‍👩‍👧‍👦✨

App para que padres asignen tareas a niños y estos construyan rachas (streaks).

## MVP (v1)

- Login con rol: **Padre** o **Niño**
- Padres crean tareas (diarias/semanales)
- Niños marcan tareas como completadas
- Rachas automáticas por tarea
- Panel simple de progreso

## Stack

- **Frontend móvil**: Expo + React Native + Expo Router
- **Backend**: Supabase (Auth + Postgres + RLS)
- **Repo**: GitHub

## Estructura

- `app/` rutas de la app (auth/parent/child)
- `lib/` utilidades (cliente Supabase)
- `supabase/schema.sql` modelo de datos inicial
- `docs/roadmap.md` fases de producto

## Configuración rápida

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Completar `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
4. Levantar app:
   ```bash
   npm run start
   ```

## Crear repo en GitHub (cuando estés logueado)

```bash
gh auth login
git init
git add .
git commit -m "feat: scaffold MVP chores + streaks"
gh repo create kids-chores-streaks --public --source=. --remote=origin --push
```

