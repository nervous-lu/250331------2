<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'


// 获取用户信息
const tksKey = localStorage.getItem('tks') || ''
const userInfo = JSON.parse(localStorage.getItem('userInfo_' + tksKey) || '{}')

const router = useRouter()

const leaderboardData = reactive({
  loading: true,
  participants: [],
  userRank: null
})

const fetchLeaderboard = async () => {
  leaderboardData.loading = true
  try {
    const res = await axios.get('http://47.108.172.140:9001/ans250416/leaderboard', {
      params: { user_id: userInfo.phone, tks: tksKey }
    })

    const { leaderboard, current_user_rank } = res.data?.data || {}

    leaderboardData.participants = (leaderboard || []).map(item => ({
      rank: item.rank,
      name: item.name,
      team: item.team_label,
      score: item.score,
      timeUsed: item.time_used,
      submittedAt: item.submitted_at,
      isCurrentUser: item.phone === userInfo.phone
    }))

    leaderboardData.userRank = current_user_rank || leaderboardData.participants.find(p => p.isCurrentUser)

    if (!leaderboardData.userRank) {
      leaderboardData.userRank = {
        rank: '-',
        total: leaderboardData.participants.length
      }
    }
  } catch (e) {
    console.error('排行榜加载失败', e)
    ElMessage.error('排行榜加载失败')
  } finally {
    leaderboardData.loading = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(fetchLeaderboard)
</script>

<template>
  <div class="leaderboard-container">
    <div class="leaderboard-card">
      <h1 class="text-center">排行榜</h1>

      <div class="leaderboard-header">
        <div class="header-item rank">排名</div>
        <div class="header-item name">用户名</div>
        <div class="header-item team">队伍</div>
        <div class="header-item score">得分</div>
        <div class="header-item time">用时</div>
      </div>

      <div v-loading="leaderboardData.loading" class="leaderboard-list">
        <div 
          v-for="(participant, index) in leaderboardData.participants" 
          :key="index+1"
          class="leaderboard-item"
          :class="{ 'current-user': participant.isCurrentUser }"
        >
          <div class="item-rank">
            <span v-if="index+1 <= 3" class="top-rank">{{ index+1 }}</span>
            <span v-else>{{ index+1 }}</span>
          </div>
          <div class="item-name">{{ participant.name }}</div>
          <div class="item-team">{{ participant.team }}</div>
          <div class="item-score">{{ participant.score }}</div>
          <div class="item-time">{{ participant.timeUsed }}秒</div>
        </div>

        <div v-if="!leaderboardData.loading && leaderboardData.participants.length === 0" class="no-data">
          暂无排行榜数据
        </div>
      </div>

      <div v-if="leaderboardData.userRank && !leaderboardData.loading" class="user-rank-info">
        您的排名: <span class="highlight">{{ leaderboardData.userRank.rank || '-' }}</span>
        / {{ leaderboardData.participants.length }}
      </div>

      <div class="text-center mt-20">
        <button class="primary-btn" @click="goBack">返回首页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-container {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  padding: 16px;
  background: #f7f8fa;
}

@media (min-width: 768px) {
  .leaderboard-container {
    max-width: 800px;
    padding: 24px;
  }
}

.leaderboard-card {
  background: white;
  border-radius: 10px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.leaderboard-header {
  display: flex;
  font-weight: bold;
  color: #333;
  border-bottom: 1px solid #ddd;
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.header-item {
  font-size: 14px;
  padding: 0 10px;
}

.header-item.rank { width: 17%; text-align: center; }
.header-item.name { width: 26%; }
.header-item.team { width: 25%; }
.header-item.score { width: 17%; text-align: right; }
.header-item.time { width: 17%; text-align: right; }

.leaderboard-list {
  min-height: 300px;
}

.leaderboard-item {
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.leaderboard-item:hover {
  background-color: #f9f9f9;
}

.item-rank, .item-name, .item-team, .item-score, .item-time {
  padding: 0 10px;
}

.item-rank { width: 17%; text-align: center; }
.item-name { width: 26%; }
.item-team { width: 25%; }
.item-score { width: 17%; text-align: right; }
.item-time { width: 17%; text-align: right; color: #999; }

.current-user {
  background-color: #e8f4ff;
  font-weight: bold;
}

.team-red { border-left: 4px solid #f56c6c; }
.team-blue { border-left: 4px solid #409eff; }
.team-yellow { border-left: 4px solid #e6a23c; }

.top-rank {
  display: inline-block;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #ffce3d;
  color: #fff;
  font-weight: bold;
  line-height: 28px;
}

.user-rank-info {
  margin-top: 16px;
  text-align: center;
  font-weight: 500;
}

.highlight {
  color: #409eff;
  font-size: 18px;
  font-weight: bold;
}

.no-data {
  text-align: center;
  color: #999;
  margin-top: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.primary-btn {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.primary-btn:hover {
  background-color: #66b1ff;
}
</style>
