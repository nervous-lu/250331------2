// 关键 localStorage 访问已全部拼接 tks 字段
import { createRouter, createWebHistory } from 'vue-router'
import axios from 'axios'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '活动首页' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { title: '信息登记' }
  },
  {
    path: '/quiz',
    name: 'Quiz',
    component: () => import('../views/Quiz.vue'),
    meta: { title: '答题页面' }
  },
  {
    path: '/result',
    name: 'Result',
    component: () => import('../views/Result.vue'),
    meta: { title: '答题结果' }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/Leaderboard.vue'),
    meta: { title: '排行榜' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '限时答题活动'

  const tksKey = localStorage.getItem('tks') || ''
  const userInfo = localStorage.getItem('userInfo_' + tksKey)
  let completedQuiz = false
  let userInfoItem = null

  if (userInfo) {
    try {
      userInfoItem = JSON.parse(userInfo)
      const res = await axios.get('http://47.108.172.140:9001/ans250416/checkQuizCompleted', {
        params: {
          user_id: userInfoItem.phone,
          tks: userInfoItem.tks
        }
      })
      completedQuiz = res.data.data.completed
    } catch (error) {
      console.error('获取答题状态失败:', error)
    }
  }

  console.log('completedQuiz2:', completedQuiz)

  // 如果用户已完成答题，且尝试访问注册页或答题页，则重定向到结果页
  if (completedQuiz && (to.name === 'Register' || to.name === 'Quiz')) {
    console.log('用户已完成答题，重定向到结果页')
    return next({ name: 'Result' })
  }

  // 如果用户已注册但尚未完成答题，且尝试重新访问首页
  console.log('路由跳转前变量检查:', { userInfo, completedQuiz, toName: to.name, fromName: from.name });
  if (userInfo && !completedQuiz && to.name === 'Home' && from.name !== '') {
    console.log('触发跳转到答题页:', { userInfo, completedQuiz, toName: to.name, fromName: from.name });
    return next({ name: 'Quiz' })
  }

  // 未注册的用户不能直接访问答题页
  if (!userInfo && to.name === 'Quiz') {
    return next({ name: 'Register' })
  }

  return next()
})

export default router