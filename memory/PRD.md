# PRD: Majestic RP Government Portal

## Original Problem Statement
Создать сайт для организации Government на проекте Majestic Roleplay GTA V. Сайт с анимациями в стиле правительства США, в черном цвете. Возможность добавлять информацию о министерствах, их руководителях и составе.

## User Personas
- **Губернатор (Super Admin)**: Полный доступ, управление ролями и пользователями
- **Администраторы с ролями**: Доступ согласно выданным правам
- **Игроки Majestic RP**: Просматривают информацию о правительстве

## Core Requirements
- ✅ JWT авторизация для админов
- ✅ Супер-админ (Губернатор) с полными правами
- ✅ Система ролей с кодами доступа
- ✅ CRUD для министерств (министр + 3 зама + состав)
- ✅ Счетчик дней в должности
- ✅ Загрузка изображений
- ✅ Новости и объявления
- ✅ Законодательство/документы
- ✅ Темная тема с золотыми акцентами
- ✅ Кастомный герб на главной странице

## Tech Stack
- Frontend: React + framer-motion + Tailwind CSS
- Backend: FastAPI + MongoDB
- Auth: JWT tokens + Role-based access control

## What's Been Implemented (Feb 22, 2026)

### Backend
- JWT auth with governor/role system
- Role CRUD with auto-generated access codes
- Permission-based API protection
- Ministries CRUD with minister & deputies
- News CRUD, Legislation CRUD
- Image upload (base64)
- User management

### Frontend
- Home page with custom emblem
- Login page with tabs (Вход/Регистрация)
- Governor registration (one-time)
- Registration by access code
- Admin panel with sidebar navigation
- Role Manager (create/edit/delete roles, regenerate codes)
- User list with ability to delete
- Permission-based navigation (users see only allowed sections)
- Ministry/News/Legislation managers
- Dark theme with gold accents (#D4AF37)
- Framer-motion animations

## Role System
- **Губернатор**: Full access (created with secret code GOV-MAJESTIC-2024)
- **Custom Roles**: Created by Governor with specific permissions:
  - can_manage_ministries
  - can_manage_news
  - can_manage_legislation
  - can_manage_roles
  - can_delete

## Prioritized Backlog
### P0 (Critical) - DONE
- ✅ User authentication
- ✅ Ministry management with hierarchy
- ✅ Days counter
- ✅ Role-based access control
- ✅ Custom emblem

### P1 (High)
- Discord Bot integration (sync news from Discord channel)
- Discord webhook notifications

### P2 (Medium)
- Public announcement system
- Activity logs
- Two-factor auth

## Credentials
- Governor Secret: GOV-MAJESTIC-2024

## Next Tasks
1. Discord Bot integration (requires bot token)
2. Discord webhook for new legislation notifications
