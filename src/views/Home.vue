<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
// 活动时间
const activityTime = ref({
  start: '',
  end: ''
})

// 获取活动时间
const fetchActivityTime = async () => {
  try {
    const response = await axios.get('http://47.108.172.140:9001/ans250416/activity-time')
    activityTime.value = response.data.data
  } catch (error) {
    console.error('获取活动时间失败:', error)
  }
}

// 检查用户是否已完成答题
const checkQuizStatus = async () => {

  const userInfo = localStorage.getItem('userInfo')
  let userInfoItem = null
  let completedQuiz = false

  if (userInfo) {
    try {
      userInfoItem = JSON.parse(userInfo)
      const res = await axios.get('http://47.108.172.140:9001/ans250416/checkQuizCompleted', {
        params: {
          user_id: userInfoItem.phone
        }
      })
      completedQuiz = res.data.data.completed
    } catch (error) {
      console.error('获取答题状态失败1:', error)
    }
  }

  
  if (completedQuiz) {
    // 用户已完成答题，直接跳转到结果页面
    router.push('/result')
    return true
  } else if (userInfo) {
    // 用户已注册但未完成答题，检查是否已开始答题
    const quizStarted = localStorage.getItem('quizStarted')
    if (quizStarted) {
      // 用户已开始答题但未完成，跳转到答题页面继续
      router.push('/quiz')
    } else {
      // 用户已注册但未开始答题，视为新用户
      localStorage.removeItem('userInfo')
      return false
    }
    return true
  }
  return false
}

const startActivity = async () => {
  // 检查当前时间是否在活动时间内
  const now = new Date()
  const startTime = new Date(activityTime.value.start)
  const endTime = new Date(activityTime.value.end)

  if (now < startTime) {
    alert('活动尚未开始，请稍后再来参与！')
    return
  }

  if (now > endTime) {
    alert('活动已结束，感谢您的关注！')
    return
  }

  // 等待检查用户状态完成
  const hasStatus = await checkQuizStatus()
  if (!hasStatus) {
    router.push('/register')
  }
}

onMounted(() => {
  fetchActivityTime()
  // 页面加载时检查用户状态
  checkQuizStatus()
})
</script>

<template>
  <div class="container">
    <div class="card">
      <h1 class="text-center">限时答题活动</h1>
      
      <div class="activity-info mb-20">
        <div class="activity-time">
          <p class="time-label">活动时间：</p>
          <p class="time-value">{{ activityTime.start }} 至 {{ activityTime.end }}</p>
        </div>
        <p>欢迎参加我们的限时答题活动！</p>
        <p>活动规则：</p>
        <ul>
          <li>选择您支持的队伍并填写基本信息</li>
          <li>回答20道题目，限时1分钟</li>
          <li>时间结束后将自动提交答案</li>
          <li>每位参与者只能参加一次</li>
          <li>根据得分情况进行排名</li>
        </ul>
      </div>
      
      <div class="text-center">
        <button class="primary-btn" @click="startActivity">开始参与</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  background-color: var(--bg-light);
  padding: 8px;
}

@media (min-width: 768px) {
  .container {
    max-width: 800px;
    padding: 12px;
  }
}

.activity-info {
  line-height: 1.5;
  font-size: 14px;
  margin: 12px 0;
}

.activity-time {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.time-label {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.time-value {
  color: #409eff;
  font-size: 18px;
  font-weight: 600;
}

@media (max-width: 480px) {
  .time-label {
    font-size: 14px;
  }
  .time-value {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .activity-info {
    font-size: 12px;
    margin: 8px 0;
  }
}

.activity-info ul {
  text-align: left;
  padding-left: 16px;
}

.activity-info li {
  margin-bottom: 6px;
}

.primary-btn {
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: var(--transition);
}

.primary-btn:hover {
  transform: translateY(-2px);
}

@media (max-width: 480px) {
  .primary-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}

h1 {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
}

@media (max-width: 480px) {
  h1 {
    font-size: 22px;
    margin-bottom: 12px;
  }
}
</style>