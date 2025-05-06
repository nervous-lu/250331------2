<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()

// 队伍选项
const teamOptions = ref([])
const teamLoading = ref(false)

const fetchTeamOptions = async () => {
  teamLoading.value = true
  try {
    const res = await axios.get('http://47.108.172.140:9001/ans250416/teams')
    if (res.data.code === 200) {
      teamOptions.value = res.data.data.map(item => ({
        label: item.label,
        value: item.name
      }))
    } else {
      ElMessage.error(res.data.msg || '获取队伍列表失败')
    }
  } catch (err) {
    ElMessage.error('请求队伍列表失败，请稍后重试')
  } finally {
    teamLoading.value = false
  }
}

onMounted(fetchTeamOptions)

// 表单数据
const formData = reactive({
  name: '',
  phone: '',
  team: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入您的姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入您的手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  team: [{ required: true, message: '请选择您支持的队伍', trigger: 'change' }]
}

const formRef = ref(null)

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) {
      ElMessage.error('请完成所有必填项')
      return false
    }

    try {
      const res = await axios.post('http://47.108.172.140:9001/ans250416/register', {
        name: formData.name,
        phone: formData.phone,
        team: formData.team
      })

      if (res.data.code === 200) {
        const { user_id } = res.data.data
        const teamLabel = teamOptions.value.find(item => item.value === formData.team)?.label || '未知队伍'

        // 本地存储
        localStorage.setItem('userInfo', JSON.stringify({
          user_id,
          name: formData.name,
          phone: formData.phone,
          team: formData.team,
          teamLabel,
          registerTime: new Date().toISOString()
        }))
        localStorage.setItem('quizStarted', 'true')

        ElMessage.success('注册成功，即将进入答题页面')
        setTimeout(() => {
          router.push('/quiz')
        }, 1000)
      } else {
        ElMessage.error(res.data.msg || '注册失败')
      }
    } catch (error) {
      ElMessage.error('注册请求失败，请稍后再试')
    }
  })
}
</script>

<template>
  <div class="container">
    <div class="card">
      <h1 class="text-center">信息登记</h1>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-position="top"
        class="register-form"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入您的姓名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入您的手机号" />
        </el-form-item>

        <el-form-item label="支持的队伍" prop="team">
          <el-select
            v-model="formData.team"
            placeholder="请选择支持的队伍"
            class="team-select"
            :loading="teamLoading"
          >
            <el-option
              v-for="team in teamOptions"
              :key="team.value"
              :label="team.label"
              :value="team.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitForm" class="submit-btn">确认并开始答题</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
  padding: 2rem;
  box-sizing: border-box;
}

.register-form {
  margin-top: 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.team-select {
  width: 100%;
}

.submit-btn {
  width: 100%;
  margin-top: 1.5rem;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.el-form-item {
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  h1 {
    font-size: 1.5rem;
  }
}
</style>
