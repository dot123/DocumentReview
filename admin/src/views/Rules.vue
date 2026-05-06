<template>
  <div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3>规则管理</h3>
      <el-button type="primary" @click="openDialog()">新增规则</el-button>
    </div>

    <!-- 筛选 -->
    <el-form :inline="true" :model="filter" style="margin-bottom:16px">
      <el-form-item label="分类">
        <el-input v-model="filter.category" placeholder="输入分类" clearable />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="filter.rule_type" placeholder="全部" clearable>
          <el-option label="关键词匹配" value="keyword" />
          <el-option label="正则匹配" value="regex" />
          <el-option label="条件组合" value="condition" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级">
        <el-select v-model="filter.risk_level" placeholder="全部" clearable>
          <el-option label="高风险" value="high" />
          <el-option label="中风险" value="medium" />
          <el-option label="低风险" value="low" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadList">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="list" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="规则名称" />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ typeMap[row.rule_type] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="riskTagType[row.risk_level]" size="small">{{ riskLabel[row.risk_level] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="关键词" min-width="200">
        <template #default="{ row }">
          <template v-if="row.keywords">
            <el-tag v-for="(k, i) in parseKeywords(row.keywords)" :key="i" size="small" style="margin:2px">{{ k }}</el-tag>
          </template>
          <template v-if="row.pattern">
            <el-tag type="warning" size="small">{{ row.pattern }}</el-tag>
          </template>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="70">
        <template #default="{ row }">
          <el-switch :modelValue="row.is_active" @change="toggleActive(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteRule(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top:16px;justify-content:flex-end"
      v-model:current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadList"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" />
        </el-form-item>
        <el-form-item label="规则类型" required>
          <el-select v-model="form.rule_type" style="width:100%">
            <el-option label="关键词匹配" value="keyword" />
            <el-option label="正则匹配" value="regex" />
            <el-option label="条件组合" value="condition" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词" v-if="form.rule_type !== 'regex'">
          <el-input v-model="keywordInput" placeholder="输入关键词后回车" @keyup.enter="addKeyword">
            <template #append>
              <el-button @click="addKeyword">添加</el-button>
            </template>
          </el-input>
          <div style="margin-top:8px">
            <el-tag
              v-for="(k, i) in (Array.isArray(form.keywords) ? form.keywords : [])"
              :key="i"
              closable
              @close="removeKeyword(i)"
              style="margin:2px"
            >{{ k }}</el-tag>
          </div>
        </el-form-item>
        <el-form-item label="正则表达式" v-if="form.rule_type === 'regex'">
          <el-input v-model="form.pattern" placeholder="如: \d{17}[\dXx] 匹配身份证号" />
        </el-form-item>
        <el-form-item label="风险等级" required>
          <el-select v-model="form.risk_level" style="width:100%">
            <el-option label="高风险" value="high" />
            <el-option label="中风险" value="medium" />
            <el-option label="低风险" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="修改建议">
          <el-input v-model="form.suggestion" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '../api';

const list = ref([]);
const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const filter = reactive({ category: '', rule_type: '', risk_level: '' });

const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref(null);
const keywordInput = ref('');
const form = reactive({
  name: '', category: '通用', rule_type: 'keyword', keywords: [],
  pattern: '', risk_level: 'medium', description: '', suggestion: '',
});

const dialogTitle = computed(() => editingId.value ? '编辑规则' : '新增规则');

const typeMap = { keyword: '关键词', regex: '正则', condition: '条件' };
const riskLabel = { high: '高风险', medium: '中风险', low: '低风险' };
const riskTagType = { high: 'danger', medium: 'warning', low: 'success' };

onMounted(() => loadList());

async function loadList() {
  loading.value = true;
  try {
    const res = await api.getRules({ ...filter, page: page.value, pageSize: pageSize.value });
    list.value = res.data.list;
    total.value = res.data.total;
  } catch (_) {}
  loading.value = false;
}

function parseKeywords(kw) {
  if (!kw) return [];
  return Array.isArray(kw) ? kw : (typeof kw === 'string' ? JSON.parse(kw) : []);
}

function openDialog(row) {
  editingId.value = row?.id || null;
  if (row) {
    Object.assign(form, {
      name: row.name, category: row.category, rule_type: row.rule_type,
      keywords: parseKeywords(row.keywords), pattern: row.pattern || '',
      risk_level: row.risk_level, description: row.description || '', suggestion: row.suggestion || '',
    });
  } else {
    Object.assign(form, {
      name: '', category: '通用', rule_type: 'keyword', keywords: [],
      pattern: '', risk_level: 'medium', description: '', suggestion: '',
    });
  }
  keywordInput.value = '';
  dialogVisible.value = true;
}

function addKeyword() {
  if (!keywordInput.value.trim()) return;
  const kw = form.keywords || [];
  if (!Array.isArray(kw)) form.keywords = [];
  form.keywords.push(keywordInput.value.trim());
  keywordInput.value = '';
}

function removeKeyword(index) {
  form.keywords.splice(index, 1);
}

async function saveRule() {
  if (!form.name) { ElMessage.warning('请输入规则名称'); return; }
  saving.value = true;
  try {
    const data = { ...form };
    if (data.rule_type !== 'regex') delete data.pattern;
    if (data.rule_type === 'regex') data.keywords = null;

    if (editingId.value) {
      await api.updateRule(editingId.value, data);
      ElMessage.success('更新成功');
    } else {
      await api.createRule(data);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch (_) {}
  saving.value = false;
}

async function toggleActive(row) {
  try {
    await api.batchToggleRules({ ids: [row.id], is_active: !row.is_active });
    row.is_active = !row.is_active;
  } catch (_) {}
}

async function deleteRule(row) {
  await ElMessageBox.confirm('确定删除该规则？', '提示', { type: 'warning' });
  try {
    await api.deleteRule(row.id);
    ElMessage.success('已删除');
    loadList();
  } catch (_) {}
}
</script>
