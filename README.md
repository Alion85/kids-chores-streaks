# Chore Streaks 👨‍👩‍👧‍👦✨

App para que padres asignen tareas a niños y estos construyan rachas (streaks).

## MVP (v1)

- Login con rol: **Padre** o **Niño**
- Registro e inicio de sesión con Supabase Auth
- Creación de perfil (`profiles`) con rol
- Redirección automática según rol
- Padres crean tareas (diarias/semanales)
- Niños marcan tareas como completadas
- Rachas automáticas por tarea

## Stack

- **Frontend móvil**: Expo + React Native + Expo Router
- **Backend**: Supabase (Auth + Postgres + RLS)
- **Repo**: GitHub

## Estructura

- `app/` rutas de la app (auth/parent/child)
- `lib/` utilidades (cliente Supabase + auth)
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
4. En Supabase, correr el SQL de `supabase/schema.sql`.
5. Levantar app:
   ```bash
   npm run start
   ```

## Flujo actual

- `/` revisa sesión actual y rol en `profiles`.
- Si no hay sesión: va a `/(auth)`.
- `/(auth)/register?role=parent|child` crea usuario + perfil.
- `/(auth)/login` inicia sesión y redirige por rol.

## Próximo paso recomendado

Implementar CRUD de tareas (padres) y listado/completado (niños).
