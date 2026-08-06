import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomePage from '../pages/HomePage.vue';
import LoginPage from '../pages/LoginPage.vue';
import RecordListPage from '../pages/RecordListPage.vue';
import RecordEditorPage from '../pages/RecordEditorPage.vue';
import UserListPage from '../pages/UserListPage.vue';
import UserEditorPage from '../pages/UserEditorPage.vue';
import { useAuthStore } from '../stores/auth';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', component: LoginPage },
  { path: '/home', component: HomePage, meta: { requiresAuth: true } },
  { path: '/recordlist/:type', component: RecordListPage, meta: { requiresAuth: true } },
  { path: '/record/:type/:id', component: RecordEditorPage, meta: { requiresAuth: true } },
  { path: '/userlist', component: UserListPage, meta: { requiresAuth: true } },
  { path: '/userrecord/:id', component: UserEditorPage, meta: { requiresAuth: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login');
    return;
  }
  next();
});

export default router;
