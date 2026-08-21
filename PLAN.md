# Akademija Ibn Usejmin - Implementation Plan

## Project Summary

**Akademija Ibn Usejmin** is a comprehensive educational platform for Islamic studies, designed to replace fragmented Google Forms-based workflows with a centralized, automated system.

### Current Problem

- Teacher Hajrudin shares YouTube lesson videos daily
- Students receive daily questions via Google Forms
- Weekly tests are manually compiled from the week's questions
- End-of-book tests and certificates are managed manually
- Attendance tracking is manual
- No centralized notification system
- Multiple courses (semesters) running with different student groups

### Solution

A PWA-based learning management system that:

- Delivers daily lessons with embedded YouTube videos
- Manages daily questions with immediate feedback
- Auto-generates weekly tests (with manual override option)
- Tracks attendance with customizable rules
- Issues certificates automatically upon course completion
- Sends push notifications for lessons, reminders, and teacher alerts
- Supports threaded Q&A with teacher moderation

### Tech Stack (Established)

- **Runtime**: Bun
- **Framework**: Hono v4.11.1 (SSR-first JSX)
- **Database**: SQLite with Drizzle ORM
- **Auth**: better-auth (email/password, OAuth later)
- **Testing**: Playwright (acceptance) + Vitest (unit)
- **UI**: Native web components extending `ParsedHTMLElement`
- **CSS**: Native CSS with design tokens

---

## User Roles

| Role        | Description                                                                                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| **Admin**   | Developer (you). Full system access, user management                                                             |
| **Teacher** | Hajrudin (and potential others). Creates courses, books, lessons. Reviews applications and Q&A. Views attendance |
| **Student** | Registers, applies to courses, watches lessons, answers questions, takes tests, receives certificates            |

---

## Implementation Plan

### Phase 1: User Roles & Registration

#### Story 1.1: User Roles

```
AS A system
I WANT to distinguish between admin, teacher, and student users
SO THAT access control can be enforced

Acceptance Criteria:
- User table has a `role` column with values: admin, teacher, student
- Navigation and dashboards adapt based on role
- Role-based route protection middleware
```

#### Story 1.2: Student Registration

```
AS A student
I WANT to register with my full name and phone number
SO THAT the teacher can identify and contact me

Acceptance Criteria:
- Registration form requires: email, password, full name, phone number
- All fields validated before submission
- User record stores name and phone
- New users default to student role
```

---

### Phase 2: Content Management

#### Story 2.1: Programs

```
AS A teacher
I WANT to create programs (e.g., "Akademija Ibn Usejmin", "Arapski jezik")
SO THAT I can organize multiple related courses/subjects under one umbrella

Acceptance Criteria:
- Program has a name and description
- Programs are created by teachers
- Programs contain multiple courses/subjects
- Students enroll in programs, not individual courses
```

#### Story 2.2: Courses/Subjects (predmeti nastave)

```
AS A teacher
I WANT to create courses within a program
SO THAT I can organize content into subjects like "Aqeedah", "Fiqh", "Nahw"

Acceptance Criteria:
- Course has a name and description
- Course belongs to a program
- Course can have an optional textbook (kitab) associated
- Teacher can reorder courses within a program
- [TO BE DEFINED] Courses can have prerequisites (e.g., "Nahw 2" requires "Nahw 1")
```

#### Story 2.3: Textbooks

```
AS A teacher
I WANT to create and manage textbooks (kitab)
SO THAT I can associate them with courses

Acceptance Criteria:
- Teacher can create textbook with title, author, and description
- Teacher can edit textbook details
- Teacher can view list of textbooks
- Textbooks can be associated with courses
```

#### Story 2.4: Lessons

```
AS A teacher
I WANT to create lessons within a course
SO THAT students have structured content to study

Acceptance Criteria:
- Teacher can add lesson with title and YouTube URL
- Lessons have an order within the course
- Teacher can reorder lessons via drag-and-drop
- Lessons belong to a specific course (predmet)
```

#### Story 2.5: Questions Management

```
AS A teacher
I WANT to add questions to each lesson
SO THAT students can test their understanding

Acceptance Criteria:
- Four question types: single answer (radio), multiple answers (checkbox), radio-grid, checkbox-grid
- Questions can be reordered
- Correct answers are marked
- Questions belong to a specific lesson
```

---

### Phase 3: Program Applications & Enrollment

#### Story 3.1: Student Applies to Program

```
AS A student
I WANT to apply for access to a program
SO THAT I can start learning

Acceptance Criteria:
- Student sees list of available programs
- Student can submit application to a program
- Application status: pending, approved, rejected
```

#### Story 3.2: Teacher Reviews Applications

```
AS A teacher
I WANT to approve or reject student applications
SO THAT I can control who joins my programs

Acceptance Criteria:
- Teacher sees list of pending applications
- Teacher can approve application (creates enrollment)
- Teacher can reject application
- Teacher sees student name, email, phone
```

#### Story 3.3: Enrollment

```
AS A system
I WANT to track student enrollments in programs
SO THAT students can access program content

Acceptance Criteria:
- Approved application creates enrollment
- Enrollment tracks start date and status
- Teacher can view enrolled students
```

---

### Phase 4: Daily Lesson Flow

#### Story 4.1: Lesson Availability

```
AS A student
I WANT lessons to be released one per day
SO THAT I can follow a structured learning pace

Acceptance Criteria:
- Lessons become available based on enrollment start date
- Lesson 1 available on start date, Lesson 2 on start date + 1, etc.
- Unavailable lessons show as locked
- Dashboard shows current available lesson
```

#### Story 4.2: Lesson Completion

```
AS A student
I WANT to mark that I've watched the lesson
SO THAT I can access the questions

Acceptance Criteria:
- Video displayed via YouTube embed
- Checkbox "I have listened to this lesson"
- Checking reveals the questions (honor system)
- Completion is recorded with timestamp
```

#### Story 4.3: Question Answering

```
AS A student
I WANT to answer daily questions with immediate feedback
SO THAT I can verify my understanding

Acceptance Criteria:
- Questions display after marking lesson watched
- Submit answers and see correct/incorrect immediately
- All answers saved to database
- Cannot change answers after submission
```

---

### Phase 5: Testing System

#### Story 5.1: Weekly Tests

```
AS A student
I WANT to take a weekly test
SO THAT I can consolidate my learning

Acceptance Criteria:
- Weekly test generated from that week's lesson questions
- Teacher can optionally select specific questions
- Test available during defined window
- Score calculated and saved
```

#### Story 5.2: Final Test

```
AS A student
I WANT to take a final test at the end of the book
SO THAT I can qualify for a certificate

Acceptance Criteria:
- Final test has passing threshold (configurable %)
- Failed test allows retry after 1 week
- Student can continue to next book regardless of pass/fail
- Passing enables certificate generation
```

---

### Phase 6: Q&A System

#### Story 6.1: Student Questions

```
AS A student
I WANT to ask questions on lessons
SO THAT I can clarify my understanding

Acceptance Criteria:
- Question form on each lesson
- Questions are anonymous to other students
- Teacher sees student identity
- Questions require teacher approval before visible
```

#### Story 6.2: Threaded Replies

```
AS A participant
I WANT to reply to questions
SO THAT discussions can develop

Acceptance Criteria:
- Anyone can reply to approved questions
- All replies require teacher approval
- Threaded display
```

---

### Phase 7: Attendance Tracking

#### Story 7.1: Attendance Rules

```
AS A teacher
I WANT to define attendance rules per course
SO THAT I can enforce course requirements

Acceptance Criteria:
- Configurable max consecutive missed days
- Automatic violation detection
- Teacher notified of violations
- Teacher can acknowledge violations
```

---

### Phase 8: PWA & Push Notifications

#### Story 8.1: PWA Setup

```
AS A student
I WANT to install the app on my phone
SO THAT I have easy access to lessons

Acceptance Criteria:
- Web manifest with app metadata
- App installable via browser prompt
- Offline shell for basic navigation
- Service worker caches static assets
```

#### Story 8.2: Push Notifications

```
AS A student
I WANT to receive notifications for new lessons
SO THAT I don't miss daily content

Acceptance Criteria:
- New lesson available (daily at course schedule)
- Missed lesson reminder (24h after release)
- Teacher: attendance violation detected
- Teacher: new Q&A question submitted
```

---

### Phase 9: Certificates

#### Story 9.1: Certificate Generation

```
AS A student
I WANT to download my completion certificate
SO THAT I have proof of my achievement

Acceptance Criteria:
- Certificate available after passing final test
- Fixed professional template
- PDF download
- Includes: student name, book title, completion date, teacher signature
```

---

### Phase 10: Internationalization

#### Story 10.1: i18n Framework

```
AS A system
I WANT to support multiple languages
SO THAT the platform can expand internationally

Acceptance Criteria:
- Translation keys for all UI strings
- Bosnian as default language
- Language preference stored in cookie
- Route localization support (TODO.md)
```

---

### Phase 11: OAuth Authentication (Future)

#### Story 11.1: Social Login

```
AS A student
I WANT to sign in with Google, Apple, or Facebook
SO THAT I don't need to remember another password

Acceptance Criteria:
- OAuth buttons appear on login and register pages
- Successful OAuth creates account or links to existing (by email)
- New OAuth users prompted to add phone number if missing
- OAuth can be used for subsequent logins
```

---

## Additional Features (Future Enhancements)

### Student Experience

1. **Progress Dashboard** - Visual overview of book completion percentage
2. **Streak Tracking** - Consecutive days of lesson completion
3. **Lesson Bookmarks** - Mark lessons to revisit
4. **Notes** - Personal notes on each lesson
5. **Search** - Search across lesson content and Q&A

### Teacher Tools

6. **Analytics Dashboard** - Class-wide progress visualization
7. **Batch Enrollment** - Import students via CSV
8. **Announcement System** - Broadcast messages to course
9. **Export** - Download grades and attendance as CSV

### Platform

10. **Email Notifications** - Fallback for push notification failures
11. **Dark Mode** - System preference detection
12. **Offline Lessons** - Cache lesson content for offline viewing
13. **Video Timestamp Markers** - Link Q&A to specific video moments
14. **Spaced Repetition** - Re-test missed questions at intervals

---

## Critical Files Reference

| Purpose              | File Path                                          |
| -------------------- | -------------------------------------------------- |
| Database schema      | `src/db/schema.ts`                                 |
| Auth configuration   | `src/auth/index.ts`                                |
| Route definitions    | `src/routes.ts`                                    |
| Test adapter pattern | `tests/acceptance/adapters/auth-session.ts`        |
| Component pattern    | `src/ui/organisms/test-maker/test-maker.tsx`       |
| Web component base   | `src/ui/generic-components/parsed-html-element.ts` |
| CSS design tokens    | `src/ui/main.css`                                  |
| Test fixtures        | `tests/acceptance/fixtures.ts`                     |
