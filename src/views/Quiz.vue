<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')


// 答题状态
const quizState = reactive({
  loading: true,
  submitting: false,
  timeRemaining: 60, // 秒
  questions: [],
  answers: {},
  timer: null,
  currentQuestionIndex: 0
})


// 获取题目数据
const fetchQuestions = async () => {
  try {
    const response = await axios.get('http://47.108.172.140:9001/ans250416/questions')
    const rawList = response.data.data

    quizState.questions = rawList.map((q, index) => ({
      id: q.id,
      content: q.question,
      options: JSON.parse(q.options),
      correctAnswer: q.correct_answer,
      score: q.score
    }))

    quizState.loading = false
    startTimer()
  } catch (error) {
    console.error('获取题目失败:', error)
    ElMessage.error('获取题目失败，请刷新页面重试')
    quizState.loading = false
  }
}


// 选择答案
const selectAnswer = (questionId, answerText) => {
  const question = quizState.questions.find(q => q.id === questionId)
  const index = question.options.indexOf(answerText)

  if (index !== -1) {
    const answerLetter = String.fromCharCode(65 + index) // A = 65
    quizState.answers[questionId] = answerLetter
  }
}

// 切换下一题
const nextQuestion = () => {
  if (quizState.currentQuestionIndex < quizState.questions.length - 1) {
    quizState.currentQuestionIndex++
  }
}

// 计时器
const startTimer = () => {
  quizState.timer = setInterval(() => {
    if (quizState.timeRemaining > 0) {
      quizState.timeRemaining--
    } else {
      clearInterval(quizState.timer)
      submitAnswers(true)
    }
  }, 1000)
}

// 提交答案
const submitAnswers = async (isTimeout = false) => {
  if (quizState.submitting) return

  if (!isTimeout && Object.keys(quizState.answers).length < quizState.questions.length) {
    try {
      await ElMessageBox.confirm(
        `您还有${quizState.questions.length - Object.keys(quizState.answers).length}道题未回答，确定要提交吗？`,
        '提交确认',
        {
          confirmButtonText: '确定提交',
          cancelButtonText: '继续答题',
          type: 'warning'
        }
      )
    } catch (e) {
      return
    }
  }

  try {
    quizState.submitting = true

    let correctCount = 0
    quizState.questions.forEach(question => {
      if (quizState.answers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / quizState.questions.length) * 100)

    localStorage.setItem('quizResult', JSON.stringify({
      score,
      correctCount,
      totalQuestions: quizState.questions.length,
      timeUsed: 60 - quizState.timeRemaining,
      submitTime: new Date().toISOString(),
      isTimeout
    }))

    const response = await axios.post('http://47.108.172.140:9001/ans250416/submitResult', {
      user_id: userInfo.phone,
      team: userInfo.team,
      answers: quizState.answers,
      score,
      correct_count: correctCount,
      time_used: 60 - quizState.timeRemaining
    })

    localStorage.setItem('quizResult', JSON.stringify(response.data))
    ElMessage.success(isTimeout ? '时间到，已自动提交答案' : '提交成功')
    router.push('/result')
  } catch (error) {
    console.error('提交答案失败:', error)
    ElMessage.error('提交答案失败，请重试')
    quizState.submitting = false
  }
}

// 计算属性
const progress = computed(() => {
  const total = quizState.questions.length
  return total ? Math.floor((Object.keys(quizState.answers).length / total) * 100) : 0
})

const formattedTime = computed(() => {
  const m = Math.floor(quizState.timeRemaining / 60).toString().padStart(2, '0')
  const s = (quizState.timeRemaining % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

// 生命周期
onMounted(async () => {
  fetchQuestions()
})

onBeforeUnmount(() => {
  if (quizState.timer) {
    clearInterval(quizState.timer)
  }
})
</script>

<template>
  <div class="container">
    <div class="card quiz-header">
      <div class="quiz-info">
        <div class="user-info">
          <span>{{ userInfo.name }}</span>
          <span class="team-badge" :class="`team-${userInfo.team}`">{{ userInfo.teamLabel }}</span>
        </div>
        <div class="timer" :class="{ 'warning': quizState.timeRemaining <= 10 }">
          <i class="el-icon-time"></i>
          <span>{{ formattedTime }}</span>
        </div>
      </div>
      <el-progress 
        :percentage="progress" 
        :format="() => `${Object.keys(quizState.answers).length}/${quizState.questions.length}`"
        :stroke-width="15"
        status="success"
      />
    </div>

    <div v-if="quizState.loading" class="card loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <template v-else>
      <div class="card question-card">
        <div class="question-header">
          <span class="question-number">{{ quizState.currentQuestionIndex + 1 }}/{{ quizState.questions.length }}</span>
          <h3 class="question-title">{{ quizState.questions[quizState.currentQuestionIndex].content }}</h3>
        </div>
        <div class="options-container">
          <div 
            v-for="(option, index) in quizState.questions[quizState.currentQuestionIndex].options" 
            :key="index"
            class="option-item"
            :class="{ 
  'selected': quizState.answers[quizState.questions[quizState.currentQuestionIndex].id] 
    === String.fromCharCode(65 + index) 
}"

            @click="selectAnswer(quizState.questions[quizState.currentQuestionIndex].id, option)"
          >
            {{ option }}
          </div>
        </div>
      </div>

      <div class="card submit-container">
        <el-button 
          v-if="quizState.currentQuestionIndex < quizState.questions.length - 1"
          type="primary" 
          size="large" 
          @click="nextQuestion"
          :disabled="!quizState.answers[quizState.questions[quizState.currentQuestionIndex].id]"
        >
          下一题
        </el-button>
        <el-button 
          v-else
          type="success" 
          size="large" 
          @click="submitAnswers"
          :loading="quizState.submitting"
        >
          提交答案
        </el-button>
      </div>
    </template>
  </div>
</template>


<style scoped>
.container {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f8fafc;
}

@media (min-width: 768px) {
  .container {
    max-width: 800px;
  }
}

.quiz-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
}

.quiz-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 500;
  color: #1e293b;
}

.team-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.team-red {
  background-color: #ef4444;
}

.team-blue {
  background-color: #3b82f6;
}

.team-green {
  background-color: #10b981;
}

.team-yellow {
  background-color: #f59e0b;
}

.timer {
  font-size: 28px;
  font-weight: bold;
  color: #3b82f6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.timer.warning {
  color: #ef4444;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.loading-container {
  padding: 40px;
  text-align: center;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.question-card {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.question-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
}

.question-number {
  background-color: #3b82f6;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 16px;
  color: #fff;
  margin-right: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question-title {
  margin: 12px 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.6;
  color: #1e293b;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.option-item {
  padding: 18px 24px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 18px;
  color: #334155;
  background-color: #ffffff;
}

.option-item:hover {
  border-color: #93c5fd;
  background-color: #f1f5f9;
  transform: translateY(-3px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.option-item.selected {
  border-color: #3b82f6;
  background-color: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.15);
}

.submit-container {
  text-align: center;
  padding: 24px;
  position: sticky;
  bottom: 0;
  background: #ffffff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  border-top: 1px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
}

.submit-btn {
  width: 100%;
  max-width: 320px;
  height: 56px;
  font-size: 18px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
  
  .quiz-header, .question-card, .submit-container {
    padding: 20px;
  }
  
  .question-title {
    font-size: 18px;
  }
  
  .option-item {
    padding: 16px 20px;
    font-size: 16px;
  }
}

</style>