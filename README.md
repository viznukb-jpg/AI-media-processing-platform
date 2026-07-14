# AI Media Processing Platform

Ця платформа є повноцінним full-stack рішенням для завантаження медіафайлів з мобільного пристрою та їх фонової обробки.

## Архітектура
- **Mobile (Expo / React Native)**: Мобільний додаток з маршрутизацією, авторизацією та відображенням прогресу в реальному часі.
- **Web API (Next.js)**: REST API для роботи з базою даних, генерації S3 Presigned URLs та постановки задач в чергу.
- **Worker (Node.js + BullMQ)**: Окремий фоновий процес, який імітує обробку штучним інтелектом та генерує мініатюри через `sharp`.
- **Database (PostgreSQL + Prisma)**: Джерело правди для користувачів та задач.
- **Queue (Redis)**: Черга задач для забезпечення надійності та можливості масштабування.
- **Storage (AWS S3)**: Хмарне сховище для оригінальних та оброблених файлів.

## Як запустити локально

### 1. Інфраструктура
Цей проєкт налаштований для використання **Neon PostgreSQL** та **AWS S3** як хмарних рішень. 
Для локальної роботи черги (BullMQ) необхідний **Redis**. Ви можете підняти його локально:
```bash
docker-compose up -d
```
*Docker Compose запустить лише Redis, як визначено у конфігурації.*

### 2. Встановлення залежностей
```bash
npm install
```

### 3. База даних (Prisma)
Створіть файли `.env` на основі `.env.example` у папках `packages/db`, `apps/web-api` та `apps/worker`.
```bash
cd packages/db
npx prisma db push
```

### 4. Запуск Backend (API)
```bash
cd apps/web-api
npm run dev
```

### 5. Запуск Worker
```bash
cd apps/worker
npm run dev
```

### 6. Запуск Mobile
Перед запуском не забудьте вказати локальну IP-адресу вашого комп'ютера у `apps/mobile/utils/auth-client.ts`.
```bash
cd apps/mobile
npm run ios
# або
npm run start
```
