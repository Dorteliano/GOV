# PRD: Majestic RP Government Portal

## Original Problem Statement
Создать сайт для организации Government на проекте Majestic Roleplay GTA V. Сайт с анимациями в стиле правительства США, в черном цвете. Возможность добавлять информацию о министерствах, их руководителях и составе.

## User Personas
- **Администраторы**: Управляют контентом сайта (министерства, новости, законы)
- **Игроки Majestic RP**: Просматривают информацию о правительстве

## Core Requirements
- JWT авторизация для админов
- CRUD для министерств (министр + 3 зама + состав)
- Счетчик дней в должности
- Загрузка изображений
- Новости и объявления
- Законодательство/документы
- Темная тема с золотыми акцентами

## Tech Stack
- Frontend: React + framer-motion + Tailwind CSS
- Backend: FastAPI + MongoDB
- Auth: JWT tokens

## What's Been Implemented (Feb 22, 2026)
### Backend
- JWT auth (register/login/me)
- Ministries CRUD with minister & deputies
- News CRUD
- Legislation CRUD
- Image upload (base64)

### Frontend
- Home page with parallax hero
- Ministries list & detail pages
- News page with preview panel
- Legislation page with search & status badges
- Login/Register page
- Admin panel (sidebar navigation)
- Ministry Manager (create/edit with 3 deputies)
- News Manager
- Legislation Manager
- Dark theme with gold accents (#D4AF37)
- Framer-motion animations
- Days in position counter

## Prioritized Backlog
### P0 (Critical) - DONE
- ✅ User authentication
- ✅ Ministry management with hierarchy
- ✅ Days counter

### P1 (High)
- Role-based access control (multiple admins)
- Ministry staff detailed profiles
- Document file attachments

### P2 (Medium)
- Public announcement system
- Calendar integration
- Activity logs

## Next Tasks
1. Add more ministry templates/presets
2. Implement notifications for new legislation
3. Add Discord webhook integration
