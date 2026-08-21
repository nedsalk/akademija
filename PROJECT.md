# Akademija Ibn Usejmin

A comprehensive educational platform for Islamic studies, centralizing the learning experience for teacher Hajrudin's academy.

## Project Vision

Replace fragmented Google Forms-based workflows with a modern, centralized learning management system. Students access daily video lessons, answer questions with immediate feedback, take weekly and final tests, and receive certificates upon completion.

## Core Workflow

```
Teacher                          Student
   |                                |
   |  Creates Course                |
   |  (semester grouping books)     |
   |                                |
   |  Creates Books                 |
   |  with Lessons & Questions      |
   |                                |
   |                         Registers (name, phone, email, password)
   |                                |
   |                         Applies to course
   |                                |
   |  Reviews application   ---->   Approved → Enrolled
   |                                |
   |  ---- Daily Cycle ----        |
   |                                |
   |  Lesson released       <---->  Watches video
   |  (auto, daily)                 Marks "listened"
   |                                Answers questions
   |                                (immediate feedback)
   |                                |
   |  ---- Weekly ----             |
   |                                |
   |  Reviews Q&A           <---->  Takes weekly test
   |  Monitors attendance           |
   |                                |
   |  ---- End of Book ----        |
   |                                |
   |  Sets final test       <---->  Takes final test
   |                                Downloads certificate
   |                                (if passed)
```

## User Roles

| Role        | Capabilities                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Admin**   | Full system access, user management, role assignment                                                                          |
| **Teacher** | Create courses/books/lessons/questions, review applications and Q&A, monitor attendance                                       |
| **Student** | Register (name, phone, email, password), apply to courses, watch lessons, answer questions, take tests, download certificates |

## Features

### Content Management

- **Courses**: Semesters that group multiple books (e.g., "Semester 1")
- **Books**: Organized collections of lessons within a course
- **Lessons**: YouTube video + daily questions
- **Questions**: 4 types - single answer, multiple answers, radio-grid, checkbox-grid

### Learning Flow

- **Daily Lessons**: Released one per day from enrollment start date
- **Honor System**: Student checks "I listened" to reveal questions
- **Immediate Feedback**: See correct/incorrect after each answer

### Assessment

- **Weekly Tests**: Auto-generated from week's questions (or teacher-selected)
- **Final Test**: Passing threshold for certificate eligibility
- **Retry**: Failed final test can be retried after 1 week

### Communication

- **Q&A**: Students ask questions on lessons (anonymous to others)
- **Threaded**: Replies with teacher moderation

### Attendance

- **Custom Rules**: Teacher defines per cohort (e.g., max 3 missed days)
- **Automatic Detection**: System tracks violations
- **Notifications**: Teacher alerted to violations

### Certificates

- **Automatic**: Generated upon passing final test
- **Professional Template**: Academy branding
- **PDF Download**: On-demand generation

### Notifications (PWA)

- New lesson available (daily)
- Missed lesson reminder (24h)
- Attendance violation (teacher)
- New Q&A question (teacher)

## Tech Stack

| Layer         | Technology                                |
| ------------- | ----------------------------------------- |
| Runtime       | Bun                                       |
| Framework     | Hono (SSR-first JSX)                      |
| Database      | SQLite + Drizzle ORM                      |
| Auth          | better-auth (email/password, OAuth later) |
| Testing       | Playwright (acceptance) + Vitest (unit)   |
| UI            | Native web components + CSS               |
| Notifications | Web Push API                              |

## Architecture Principles

### SSR-First

- JSX compiles to static HTML strings
- No React event handlers in JSX
- Forms use native `action` attributes
- Web components only enhance pre-rendered HTML

### ATDD (Acceptance Test-Driven Development)

- Write failing acceptance tests first
- Tests read like specifications
- Domain adapters abstract UI selectors
- Never mock what you own

### Event Delegation

- Single listener on parent elements
- `data-action` attributes for routing
- Works with dynamically added content

### Progressive Enhancement

- Core functionality works without JS
- Web components add interactivity
- PWA adds installability and push

## Database Schema Overview

```
Authentication & Users:
  user (+ role, phone columns)
  session
  account
  verification

Content:
  course
  course_book
  book
  lesson
  question
  question_option
  question_row

Enrollment:
  course_application
  enrollment

Progress:
  lesson_progress
  question_response

Testing:
  weekly_test
  weekly_test_question
  final_test
  test_attempt
  test_attempt_answer

Q&A:
  lesson_question
  lesson_question_reply

System:
  attendance_violation
  certificate
  push_subscription
  notification
```

## Development Commands

```bash
# Development server
bun run dev

# Format and lint
bunx biome check --write .

# Run acceptance tests
bunx playwright test

# Run unit tests
bunx vitest run

# Database migrations
bunx drizzle-kit generate
bunx drizzle-kit push
```

## Project Structure

```
src/
  index.tsx           # Main Hono app
  routes.ts           # Type-safe route definitions
  auth/               # better-auth configuration
  db/                 # Drizzle schema and migrations
  ui/
    Main.tsx          # Root layout
    atoms/            # Basic styled elements
    organisms/        # Feature components
    generic-components/  # Reusable web components

tests/
  acceptance/
    *.spec.ts         # Playwright tests
    adapters/         # Domain DSL for tests
    fixtures.ts       # Test setup
  unit/
    *.test.ts         # Vitest tests
```

## Implementation Phases

1. **User Roles & Registration** - Roles, name/phone fields for students
2. **Content Management** - Courses, books, lessons, questions CRUD
3. **Course Applications & Enrollment** - Student applies, teacher approves
4. **Daily Lesson Flow** - Video + questions with feedback
5. **Testing System** - Weekly and final tests
6. **Q&A System** - Threaded discussions with moderation
7. **Attendance Tracking** - Rules and violation detection
8. **PWA & Notifications** - Installability, push notifications
9. **Certificates** - PDF generation
10. **Internationalization** - i18n framework
11. **OAuth Authentication** - Google, Apple, Facebook login

## Future Enhancements

- Progress dashboard with visualizations
- Streak tracking for motivation
- Lesson bookmarks and notes
- Search across content
- Analytics for teachers
- Batch enrollment via CSV
- Email notification fallback
- Dark mode
- Offline lesson viewing
- Video timestamp markers for Q&A
- Spaced repetition for missed questions
