# Платформа экологического обучения КТЖ

Полнофункциональная веб-платформа дистанционного экологического обучения персонала АО «НК «ҚТЖ» с русским и казахским интерфейсом.

## Архитектура

| Слой | Технологии |
|------|------------|
| Frontend | React 19, TypeScript, Vite, i18next |
| Backend | Node.js, Express 5, Prisma |
| БД | SQLite (dev) / PostgreSQL (prod через `DATABASE_URL`) |
| Безопасность | JWT в httpOnly-cookie, bcrypt, Helmet, rate limit, RBAC, audit log |

## Быстрый старт

```bash
npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

## Демо-аккаунты

| Логин | Пароль | Роль |
|-------|--------|------|
| `admin` | `Admin123!` | Администратор |
| `methodist` | `Method123!` | Методист / контент |
| `manager` | `Manager123!` | Руководитель подразделения |
| `asxhat` | `Employee123!` | Сотрудник |

## Роли и доступ (по ТЗ)

- **Сотрудник** — курсы, тесты, сертификаты, результаты, уведомления
- **Методист** — загрузка материалов, тесты, настройки
- **Руководитель** — отчёты своего подразделения
- **Администратор** — полный доступ, управление пользователями

## Безопасность

- Пароли хешируются bcrypt (cost 12)
- Сессия в httpOnly + SameSite=strict cookie
- Rate limit на login (20 попыток / 15 мин)
- Проверка MIME-типов и расширений при загрузке (PDF, DOCX, PPTX, MP4, AVI, до 2 ГБ)
- Разграничение прав по ролям на каждом API-эндпоинте
- Журнал действий пользователей (audit log)

## Production

1. Скопируйте `.env.example` → `.env`
2. Задайте сильный `JWT_SECRET` (64+ символов)
3. Укажите PostgreSQL: `DATABASE_URL="postgresql://..."`
4. Установите `NODE_ENV=production`
5. Сборка и запуск:

```bash
npm run build
npm run build:server
NODE_ENV=production node dist-server/index.js
```

В production Express раздаёт статику из `dist/` и обслуживает SPA.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Frontend + backend одновременно |
| `npm run dev:client` | Только Vite |
| `npm run dev:server` | Только API |
| `npm run build` | Сборка frontend |
| `npm run db:seed` | Демо-данные |
| `npm run db:push` | Применить схему БД |

## Соответствие ТЗ

- ✅ Административный модуль (материалы, тесты, пользователи, отчёты, настройки)
- ✅ Модуль учебных материалов с прогрессом
- ✅ Модуль тестирования с блокировкой до просмотра материала
- ✅ Личный кабинет с сертификатами
- ✅ Отчётность с выгрузкой CSV
- ✅ RU / KK интерфейс
- ✅ Адаптивный дизайн по макету (#1A5C38)
