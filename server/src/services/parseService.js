const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// 解析Word文档
async function parseDocx(filePath) {
  const buffer = fs.readFileSync(filePath);
  try {
    const result = await mammoth.extractRawText({ buffer });
    return { text: (result.value || '').trim(), messages: result.messages };
  } catch (err) {
    // mammoth解析失败时，尝试作为纯文本读取
    const text = buffer.toString('utf8').trim();
    return { text: text || '(文件无法解析，可能为加密文档或格式不正确)', messages: [] };
  }
}

// 解析PDF文档
async function parsePdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = (data.text || '').trim();
  return { text, pageCount: data.numpages || 0, isScanned: text.length < 100, info: data.info || {} };
}

// 扫描版PDF OCR（预留）
async function parseScannedPdf(filePath) {
  return { text: '', pageCount: 0, isScanned: true, ocrNote: '扫描版PDF OCR需接入云OCR服务' };
}

// 主解析函数
async function parseFile(fileRecord) {
  const filePath = fileRecord.cos_key;
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }

  if (fileRecord.file_type === 'docx') {
    const { text } = await parseDocx(filePath);
    return { text, pageCount: 0, isScanned: false };
  }

  if (fileRecord.file_type === 'pdf') {
    const result = await parsePdf(filePath);
    if (result.isScanned) {
      return { text: result.text, pageCount: result.pageCount, isScanned: true };
    }
    return result;
  }

  throw new Error(`不支持的文件类型: ${fileRecord.file_type}`);
}

module.exports = { parseFile, parseDocx, parsePdf };
