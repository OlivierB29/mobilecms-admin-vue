# mobilecms-admin migration analysis

## Objective

This document maps the current Angular admin application in mobilecms-admin to the Vue workspace in mobilecms-admin-vue so the migration can be implemented incrementally without losing functionality.

## Source application inventory

The existing admin UI is a single Angular application with:

- Angular 16 + Angular Material
- Angular Router with hash-based routes
- Reactive forms and template-driven forms
- CKEditor 5 for rich-text content editing
- ngx-translate for i18n
- JWT-based authentication stored in localStorage
- REST calls to the Slim API through four backend areas:
  - auth API: login, public info, password reset
  - CMS API: content CRUD, metadata, templates, index rebuild
  - admin API: user and admin content operations
  - file API: uploads, thumbnails, file descriptions

## Main functional areas to migrate

| Area | Angular feature | Vue target |
| --- | --- | --- |
| Shell | AdminMainpageComponent, MenubuttonComponent | App layout with sidebar/top bar and router-view |
| Login | LoginComponent, ModifyPasswordComponent | Login page and password reset flow |
| Home | HomeComponent | Dashboard page with help dialog |
| Content list | RecordListComponent | Content list page with delete selection and rebuild action |
| Content editor | RecordComponent | Record editor page with autosave, publish, preview, delete |
| User management | UserListComponent, UserRecordComponent | User list and user editor pages |
| Media | EditMediaComponent, EditLinksComponent | Reusable attachment/media editor components |
| Dialogs | Help, delete, error, BBCode URL dialogs | Modal/dialog components |
| Translation | ngx-translate | Vue i18n setup |

## Existing Angular modules and their migration equivalents

### 1. Routing
Current Angular routes:

- /login
- /home
- /recordlist/:type
- /record/:type/:id
- /userlist
- /userrecord/:id

Vue Router should preserve the same route names and parameter structure.

### 2. Authentication and authorization
The current app relies on:

- localStorage entry currentUser
- SecurityService for auth status and role checks
- UserRouteAccessService as a route guard

In Vue, this should become:

- a Pinia auth store
- a route guard that redirects unauthenticated users to /login
- role-based access control for admin-only pages

### 3. Shared services to port
The following services are core and should be reimplemented in Vue:

- LoginService
- SecurityService
- ContentService
- AdminService
- UploadService
- LocaleService
- AlertService
- WindowService
- Log service

These should be grouped under src/services or src/composables.

### 4. UI components and pages
Recommended Vue structure:

- src/pages/LoginPage.vue
- src/pages/HomePage.vue
- src/pages/RecordListPage.vue
- src/pages/RecordEditorPage.vue
- src/pages/UserListPage.vue
- src/pages/UserEditorPage.vue
- src/components/layout/AppShell.vue
- src/components/dialogs/*
- src/components/record/*
- src/components/media/*

### 5. Data and API contracts
The Vue frontend should keep the same backend contracts used today:

- POST /authapi/authenticate
- POST /authapi/publicinfo
- POST /authapi/resetpassword
- GET /cmsapi/content
- GET /cmsapi/content/:type
- GET /cmsapi/content/:type/:id
- POST /cmsapi/content/:type
- DELETE /cmsapi/content/:type/:id
- GET /cmsapi/metadata/:type
- GET /cmsapi/template/:type
- POST /cmsapi/index/:type
- POST /cmsapi/deletelist/:type
- GET /adminapi/index/:type
- GET /adminapi/metadata/:type
- POST /adminapi/content/users
- POST /adminapi/content/users/:email
- GET /fileapi/basicupload/:type/:id
- POST /fileapi/thumbnails/:type/:id
- POST /fileapi/delete/:type/:id

## Recommended Vue stack

A practical migration stack is:

- Vue 3
- Vite
- Vue Router
- Pinia
- Vuetify (best fit for the existing Material-style UI)
- Vue I18n
- CKEditor 5 for rich text

## Important migration risks

1. CKEditor integration
   - The Angular version uses the official CKEditor component and custom toolbar behavior.
   - This should be reimplemented carefully in Vue to preserve the same editing experience.

2. Dialog-driven workflows
   - The Angular app relies heavily on modal dialogs for help, delete confirmation, and BBCode insertion.
   - Vue should preserve these as reusable modal components.

3. File upload and thumbnails
   - The current upload flow uses XMLHttpRequest with JWT headers.
   - This must be preserved exactly or adapted to fetch/FormData in Vue.

4. Autosave and record editing state
   - Record editing includes draft handling, autosave logic, and change detection.
   - This should be migrated as a composable to keep the logic testable.

## Suggested implementation order

1. Bootstrap the Vue application and routing shell.
2. Implement authentication, storage, and route guards.
3. Port the shared API services and common utilities.
4. Build the home and content-list pages.
5. Port the record editor and media attachment components.
6. Port user management pages and admin-only flows.
7. Add translations, dialogs, and final styling polish.

## Recommended first milestone

The first milestone should be a working admin shell with:

- login
- protected routes
- list of content types
- content list page
- record editor page

That gives a strong base for later user-management and media features.
