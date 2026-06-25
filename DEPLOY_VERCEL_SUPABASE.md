Краткое руководство: бесплатный деплой фронтенда на Vercel и использование Supabase для БД и хранилища

1) Цель
- Развернуть фронтенд (Vite + React) на Vercel (free).
- Использовать Supabase (free) для Postgres (DATABASE_URL) и Storage (замена `uploads/`).
- Бэкенд (Express + Prisma) можно оставить на бесплатном хосте (Railway / Render) или адаптировать к serverless — ниже варианты.

2) Быстрая последовательность (минимально):
- Создать проект в Supabase: https://app.supabase.com
- В Project -> Settings -> Database -> Connection string: скопировать `DATABASE_URL` (Postgres)
- В Storage создать bucket, настроить публичный доступ или политики.
- В Project -> Settings -> API взять `url` и `anon`/`service_role` ключ (service_role — для серверных загрузок).
- На Vercel: создать проект, подключить репозиторий. В Settings -> Environment Variables добавить:
  - `DATABASE_URL` = (Supabase Postgres connection string)
  - `SUPABASE_URL` = (Supabase project URL)
  - `SUPABASE_SERVICE_ROLE_KEY` = (service_role key) — НИКОГДА не храните в клиенте
  - любые JWT/SECRET, например `JWT_SECRET` используемый в `server`

3) Что деплоить на Vercel
- Рекомендую деплоить только фронтенд на Vercel (самый простой и надёжный путь).
- Бэкенд (Express + Prisma) оставляем на бесплатном хосте для Node (Railway/Render). Alternately — рефактор в Vercel serverless (сложнее).

4) Пример `vercel.json` (в корне репозитория)
```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build" }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://<YOUR_BACKEND_URL>/api/$1"
    },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

Замените `<YOUR_BACKEND_URL>` на URL вашего задеплоенного сервера, например `https://my-backend.up.railway.app`.

Примечание: в Vercel UI в настройках проекта укажите команду сборки `npm run build` и `output Directory` = `dist`.

5) Заменяем локальные `uploads/` на Supabase Storage (серверная часть)
- Установите библиотеку на сервере (где работает Express):
```bash
npm install @supabase/supabase-js
```
- Пример минимальной функции загрузки (замена `multer` дискового хранения):
```ts
// server/src/storageSupabase.ts
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function uploadFileFromDisk(localPath: string, destName?: string, contentType?: string) {
  const bucket = process.env.SUPABASE_BUCKET ?? 'uploads'
  const buffer = await fs.readFile(localPath)
  const filePath = destName ?? path.basename(localPath)
  const { error } = await supabase.storage.from(bucket).upload(filePath, buffer, {
    contentType,
  })
  if (error) throw error
  const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
  return publicUrl
}
```

Если вы предпочитаете — можно не менять `multer.diskStorage` сразу: просто загружать файл на Supabase после сохранения на диск и удалить локальную копию.

6) Prisma и миграции
- В продакшне запускайте миграции один раз с `prisma migrate deploy` или `prisma db push` локально/CI.
- Убедитесь, что `DATABASE_URL` в Vercel/Railway указывает на Supabase Postgres.

7) Хостинг бэкенда (бесплатные варианты)
- Railway: быстрый деплой Node, есть free квота — подойдёт для теста.
- Render: также поддерживает бесплатный Web Service (ограничения).
- Если хотите всё на Vercel, потребуется рефакторинг Express -> serverless handlers (api/). Это можно сделать, но сложнее.

8) Тестирование после деплоя
- Деплойте фронтенд на Vercel: проверьте, что фронтенд использует корректный API URL (в `src/api/client.ts` или `.env` переменных).
- Проверьте загрузку файлов — они должны появиться в Supabase Storage.

9) Полезные команды локально
```powershell
npm run build
npm run dev:server   # локально для сервера
npm run dev:client   # локально для фронтенда
```

Если хотите — я могу прямо сейчас добавить `server/src/storageSupabase.ts` и изменить `server/src/routes/admin.ts` чтобы файлы автоматически заливались в Supabase и локальная копия удалялась. Скажите, делать это автоматически?
