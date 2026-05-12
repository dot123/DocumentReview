const PDFDocument = require('pdfkit');
const fs = require('fs');

function formatDateTime(date) {
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// 中文字体路径 (macOS系统自带)
const FONT_PATH = 'fonts/ChineseFont.ttf';
const FONT_NAME = 'ChineseFont';

// 生成审核报告数据
function buildReportData(record, file) {
  const summary = record.risk_summary || {};
  const details = (record.results && record.results.details) || { high: [], medium: [], low: [] };

  return {
    reportTitle: '文书审核报告',
    fileInfo: {
      name: file.original_name,
      type: file.file_type,
      size: formatFileSize(file.file_size),
      reviewTime: formatDateTime(record.created_at),
      duration: record.duration,
    },
    riskSummary: {
      total: summary.total || 0,
      high: summary.high || 0,
      medium: summary.medium || 0,
      low: summary.low || 0,
    },
    riskLevel: summary.high > 0 ? '高风险' : (summary.medium > 0 ? '中风险' : (summary.total > 0 ? '低风险' : '无风险')),
    details,
    aiSummary: (record.results && record.results.ai && record.results.ai.summary) || '',
    generatedAt: formatDateTime(new Date()),
  };
}

// 生成PDF报告
function generatePdf(reportData) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: reportData.reportTitle,
        Author: '文书审核系统',
      },
    });

    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // 注册中文字体
    try {
      doc.registerFont(FONT_NAME, FONT_PATH);
      doc.font(FONT_NAME);
    } catch(e) {
      console.warn('中文字体加载失败，使用默认字体:', e.message);
      doc.font('Helvetica');
    }

    // 标题
    doc.fontSize(22).text(reportData.reportTitle, { align: 'center' });
    doc.moveDown(0.5);

    // 分隔线
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#1890ff');
    doc.moveDown(1);

    // 文件信息
    doc.fontSize(14).text('一、文件信息', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`文件名称：${reportData.fileInfo.name}`);
    doc.text(`文件类型：${reportData.fileInfo.type}`);
    doc.text(`文件大小：${reportData.fileInfo.size}`);
    doc.text(`审核时间：${reportData.fileInfo.reviewTime}`);
    doc.text(`审核耗时：${reportData.fileInfo.duration}秒`);
    doc.moveDown(1);

    // 风险统计
    doc.fontSize(14).text('二、风险统计', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`综合风险等级：${reportData.riskLevel}`);
    doc.text(`风险总数：${reportData.riskSummary.total}`);
    doc.text(`  高风险：${reportData.riskSummary.high} 项`);
    doc.text(`  中风险：${reportData.riskSummary.medium} 项`);
    doc.text(`  低风险：${reportData.riskSummary.low} 项`);
    doc.moveDown(1);

    // 风险详情
    doc.fontSize(14).text('三、风险详情', { underline: true });
    doc.moveDown(0.5);

    const levels = [
      { key: 'high', label: '高风险', color: '#ff4d4f' },
      { key: 'medium', label: '中风险', color: '#faad14' },
      { key: 'low', label: '低风险', color: '#52c41a' },
    ];

    for (const level of levels) {
      const items = reportData.details[level.key] || [];
      if (items.length === 0) continue;

      doc.fontSize(12).fillColor(level.color).text(`${level.label} (${items.length}项)`);
      doc.fillColor('#000000');
      doc.moveDown(0.3);

      items.forEach((item, idx) => {
        doc.fontSize(11);
        // 检查是否需要换页
        if (doc.y > 700) {
          doc.addPage();
        }
        doc.text(`${idx + 1}. [${item.category}] ${item.rule_name}`);
        doc.fontSize(10).fillColor('#ff4d4f');
        doc.text(`   问题：${item.description}`);
        doc.fontSize(10).fillColor('#1890ff');
        doc.text(`   建议：${item.suggestion}`);
        if (item.ai_suggestion) {
          doc.fontSize(10).fillColor('#722ed1');
          doc.text(`   AI建议：${item.ai_suggestion}`);
        }
        doc.fillColor('#000000');
        doc.moveDown(0.5);
      });
    }

    // AI智能分析
    if (reportData.aiSummary) {
      if (doc.y > 650) { doc.addPage(); }
      doc.fontSize(14).fillColor('#722ed1').text('四、AI 智能分析', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333333');
      doc.text(reportData.aiSummary, { width: 495, lineGap: 4 });
      doc.moveDown(1);
    }

    // 声明
    doc.fontSize(10).fillColor('#999999');
    doc.text('声明：本报告由文书审核系统自动生成，审核结果仅供参考，不构成法律意见。');
    doc.text(`生成时间：${reportData.generatedAt}`);

    doc.end();
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

module.exports = { buildReportData, generatePdf };
