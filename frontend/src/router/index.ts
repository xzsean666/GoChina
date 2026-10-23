import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/talents',
      name: 'talents',
      component: () => import('@/views/TalentsView.vue'),
    },
    {
      path: '/faucet',
      name: 'faucet',
      component: () => import('@/views/FaucetView.vue'),
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inquiries',
      name: 'inquiries',
      redirect: '/chat',
    },
    {
      path: '/contracts',
      name: 'contracts',
      component: () => import('@/views/ContractsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    return { top: 0 };
  },
});

router.beforeEach((to, _from, next) => {
  if (typeof localStorage === 'undefined') {
    return next();
  }

  const token = localStorage.getItem('gc_token');
  const userJson = localStorage.getItem('gc_user');
  let user: any = null;
  if (userJson) {
    try {
      user = JSON.parse(userJson);
    } catch {
      user = null;
    }
  }

  if (to.meta.requiresAuth && !token) {
    return next({ path: '/' });
  }

  if (to.meta.requiresAdmin && (!token || user?.role !== 'admin')) {
    return next({ path: '/' });
  }

  next();
});

export default router;
