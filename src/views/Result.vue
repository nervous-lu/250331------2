<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()

// 从本地存储获取用户信息
const tksKey = localStorage.getItem('tks') || ''
const userInfo = JSON.parse(localStorage.getItem('userInfo_' + tksKey) || '{}')

// 答题结果（得分、用时、正确题数等）
const userData = ref({
  score: 0,
  correct_count: 0,
  time_used: 0
})

// 排名信息
const resultData = reactive({
  loading: false,
  rank: null,
  totalParticipants: 0
})

// 获取服务端答题结果和排名信息
const fetchRankInfo = async () => {
  try {
    resultData.loading = true
    const response = await axios.get('https://jcflans.z227.com/ans250416/leaderboard', {
      params: {
        user_id: userInfo.phone,
        tks: tksKey
      }
    })

    const res = response.data?.data || {}

    if (res.current_user_rank) {
      userData.value = {
        ...userData.value,
        ...res.current_user_rank
      }

      resultData.rank = res.current_user_rank.rank
      resultData.totalParticipants = res.leaderboard?.length || 0
    } else {
      resultData.rank = '-'
      resultData.totalParticipants = 0
    }
  } catch (error) {
    console.error('获取排名信息失败:', error)
    ElMessage.error('获取排名信息失败')
  } finally {
    resultData.loading = false
  }
}

// 跳转到排行榜页面
const viewLeaderboard = () => {
  router.push('/leaderboard')
}

onMounted(() => {
  fetchRankInfo()
})
</script>

<template>
  <div class="container">
    <div class="card">
      <h1 class="text-center">答题结果</h1>

      <div class="result-content" style="max-width: 500px; margin: 0 auto;">
        <div class="user-info-container">
          <div class="user-details">
            <h3>{{ userInfo.name || '未知用户' }}</h3>
            <span class="team-badge">
              支持队伍：{{ userInfo.team_label || userInfo.teamLabel || '未选择队伍' }}
            </span>
          </div>
        </div>

        <div class="result-container">
          <div class="score-circle">
            <span class="score-value">{{ userData.score || 0 }}</span>
            <span class="score-label">分数</span>
          </div>

          <div class="result-details">
            <div class="result-item">
              <span class="result-label">答对题目</span>
              <span class="result-value">{{ userData.correct_count || 0 }}</span>
            </div>

            <div class="result-item">
              <span class="result-label">用时</span>
              <span class="result-value">{{ userData.time_used || 60 }}秒</span>
            </div>

            <div class="result-item">
              <span class="result-label">排名</span>
              <span v-if="resultData.loading" class="result-value">加载中...</span>
              <span v-else class="result-value">{{ resultData.rank || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="result-message">
          <p v-if="userData.score >= 80">太棒了！你的表现非常出色！</p>
          <p v-else-if="userData.score >= 60">不错的表现！还有提升空间哦！</p>
          <p v-else>继续加油，相信你下次会做得更好！</p>
        </div>

        <div class="action-buttons">
          <el-button type="primary" @click="viewLeaderboard">查看排行榜</el-button>
        </div>
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
  background-color: #f8fafc;
}

@media (min-width: 768px) {
  .container {
    max-width: 800px;
  }
}

.user-info-container {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin-right: 15px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-details h3 {
  margin: 0 0 5px 0;
}

.team-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #000;
  display: inline-block;
  width: fit-content;
}

.team-red {
  background-color: #f56c6c;
}

.team-blue {
  background-color: #409eff;
}

.team-green {
  background-color: #67c23a;
}

.team-yellow {
  background-color: #e6a23c;
}

.team-gold {
  background-color: #ffd700;
}

.result-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 30px 0;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #409eff;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.score-value {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  margin-top: 5px;
}

.result-details {
  flex: 1;
  margin-left: 20px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.result-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.result-label {
  color: #606266;
}

.result-value {
  font-weight: 500;
  color: #303133;
}

.result-message {
  text-align: center;
  margin: 20px 0;
  padding: 10px;
  background-color: #f0f9eb;
  color: #67c23a;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}
</style>
