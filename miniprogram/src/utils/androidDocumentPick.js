/**
 * Android App-Plus：系统文档选择器 + 复制到应用私有目录，供 uni.getFileSystemManager().readFile 使用。
 * 仅应在 APP-PLUS 构建中、且由 #ifdef APP-PLUS 包裹的 import 引用。
 */

const REQUEST_CODE = 0xd071;

const DEFAULT_EXTS = ['.pdf', '.doc', '.docx'];

function fileExtFromName(lowerName) {
  const m = lowerName.match(/(\.[a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '.bin';
}

function queryOpenableMeta(main, uri) {
  const resolver = main.getContentResolver();
  const cursor = resolver.query(uri, null, null, null, null);
  let name = '';
  let size = 0;
  if (cursor) {
    try {
      if (cursor.moveToFirst()) {
        const OpenableColumns = plus.android.importClass('android.provider.OpenableColumns');
        const ni = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
        const si = cursor.getColumnIndex(OpenableColumns.SIZE);
        if (ni >= 0) name = cursor.getString(ni) || '';
        if (si >= 0) size = cursor.getLong(si);
      }
    } finally {
      cursor.close();
    }
  }
  return { name, size };
}

/** file:/// 前缀去掉，供 java.nio.file.Paths 使用 */
function toFsPath(plusUrl) {
  return String(plusUrl || '').replace(/^file:\/\//, '');
}

/**
 * 使用 Files.copy(InputStream, Path)，需 API 26+（Android 8+）
 */
function copyContentUriToDoc(main, uri, ext) {
  const Build = plus.android.importClass('android.os.Build');
  if (Build.VERSION.SDK_INT < 26) return '';

  const resolver = main.getContentResolver();
  let is = null;
  try {
    is = resolver.openInputStream(uri);
    if (!is) return '';

    const base = plus.io.convertLocalFileSystemURL('_doc/');
    const sep = base.endsWith('/') ? '' : '/';
    const rel = `pick_${Date.now()}${ext}`;
    const pathStr = toFsPath(`${base}${sep}${rel}`);

    const Paths = plus.android.importClass('java.nio.file.Paths');
    const Files = plus.android.importClass('java.nio.file.Files');
    const StandardCopyOption = plus.android.importClass('java.nio.file.StandardCopyOption');
    const path = Paths.get(pathStr);
    Files.copy(is, path, StandardCopyOption.REPLACE_EXISTING);
    return pathStr.startsWith('/') ? `file://${pathStr}` : `${base}${sep}${rel}`;
  } finally {
    if (is) {
      try {
        plus.android.invoke(is, 'close');
      } catch (e) {}
    }
  }
}

function getDataColumn(main, uri, selection, selectionArgs) {
  const resolver = main.getContentResolver();
  const proj = ['_data'];
  const cursor = resolver.query(uri, proj, selection, selectionArgs, null);
  let filePath = '';
  if (cursor) {
    try {
      if (cursor.moveToFirst()) {
        const idx = cursor.getColumnIndexOrThrow(proj[0]);
        filePath = cursor.getString(idx);
      }
    } finally {
      cursor.close();
    }
  }
  return filePath || '';
}

/** 尝试解析可本地直接 readFile 的绝对路径（部分 content:// 可解析） */
function tryResolveRealPath(main, uri) {
  const scheme = plus.android.invoke(uri, 'getScheme');
  if (scheme === 'file') {
    return plus.android.invoke(uri, 'getPath') || '';
  }

  const Build = plus.android.importClass('android.os.Build');
  if (Build.VERSION.SDK_INT < 19) return '';

  const DocumentsContract = plus.android.importClass('android.provider.DocumentsContract');
  if (!DocumentsContract.isDocumentUri(main, uri)) {
    if (scheme === 'content') return getDataColumn(main, uri, null, null);
    return '';
  }

  const docId = DocumentsContract.getDocumentId(uri);
  const authority = plus.android.invoke(uri, 'getAuthority');
  const parts = docId.split(':');
  if (parts.length < 2) {
    return getDataColumn(main, uri, null, null);
  }
  const type = parts[0];
  const id = parts.slice(1).join(':');

  const AUTH_MEDIA = 'com.android.providers.media.documents';
  const AUTH_DOWNLOAD = 'com.android.providers.downloads.documents';
  const AUTH_EXTERNAL = 'com.android.externalstorage.documents';

  if (authority === AUTH_EXTERNAL && type === 'primary') {
    const Environment = plus.android.importClass('android.os.Environment');
    const root = Environment.getExternalStorageDirectory();
    const abs = `${plus.android.invoke(root, 'getAbsolutePath')}/${id}`;
    return abs;
  }

  if (authority === AUTH_MEDIA) {
    const MediaStore = plus.android.importClass('android.provider.MediaStore');
    let mediaUri = null;
    if (type === 'image') mediaUri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
    else if (type === 'video') mediaUri = MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
    else if (type === 'audio') mediaUri = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
    else {
      try {
        mediaUri = MediaStore.Files.getContentUri('external');
      } catch (e) {
        return '';
      }
    }
    return getDataColumn(main, mediaUri, '_id=?', [id]);
  }

  if (authority === AUTH_DOWNLOAD) {
    const ContentUris = plus.android.importClass('android.content.ContentUris');
    const UriCls = plus.android.importClass('android.net.Uri');
    const raw = ContentUris.parseId(uri);
    const base = UriCls.parse('content://downloads/public_downloads');
    const dl = ContentUris.withAppendedId(base, raw);
    return getDataColumn(main, dl, null, null);
  }

  return '';
}

function normalizePickPath(p) {
  if (!p) return '';
  if (p.startsWith('file://')) return p;
  if (p.startsWith('/')) return `file://${p}`;
  return p;
}

/**
 * @param {string[]} acceptLowerExts 如 ['.pdf','.doc','.docx']
 */
export function pickAndroidDocument(acceptLowerExts = DEFAULT_EXTS) {
  return new Promise((resolve, reject) => {
    const main = plus.android.runtimeMainActivity();
    const Intent = plus.android.importClass('android.content.Intent');
    const intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
    intent.addCategory(Intent.CATEGORY_OPENABLE);
    intent.setType('*/*');
    try {
      intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
    } catch (e) {}

    const Activity = plus.android.importClass('android.app.Activity');
    const prev = main.onActivityResult;

    main.onActivityResult = (requestCode, resultCode, data) => {
      if (requestCode !== REQUEST_CODE) {
        if (typeof prev === 'function') prev.call(main, requestCode, resultCode, data);
        return;
      }

      const finish = () => {
        main.onActivityResult = prev;
      };

      if (typeof prev === 'function') prev.call(main, requestCode, resultCode, data);

      if (resultCode !== Activity.RESULT_OK) {
        finish();
        reject(new Error('cancel'));
        return;
      }

      const uri = data.getData();
      if (!uri) {
        finish();
        reject(new Error('no file'));
        return;
      }

      try {
        const meta = queryOpenableMeta(main, uri);
        let name = meta.name || 'document';
        const lower = name.toLowerCase();
        const allowed = acceptLowerExts.some((ext) => lower.endsWith(ext));
        if (!allowed) {
          finish();
          uni.showToast({ title: '仅支持 Word(.docx) 和 PDF 文件', icon: 'none' });
          reject(new Error('bad type'));
          return;
        }

        const ext = fileExtFromName(lower);
        let localPath = tryResolveRealPath(main, uri);
        localPath = normalizePickPath(localPath);
        if (!localPath || localPath.length < 8) {
          const copied = copyContentUriToDoc(main, uri, ext);
          localPath = copied ? normalizePickPath(copied) : '';
        }

        if (!localPath) {
          finish();
          uni.showToast({ title: '无法读取所选文件，请换用「文件」中的副本重试', icon: 'none' });
          reject(new Error('no local path'));
          return;
        }

        let size = meta.size || 0;
        finish();

        if (size <= 0) {
          uni.getFileInfo({
            filePath: localPath,
            success: (r) => resolve({ name, size: r.size || 0, path: localPath }),
            fail: () => resolve({ name, size: 0, path: localPath }),
          });
        } else {
          resolve({ name, size, path: localPath });
        }
      } catch (err) {
        finish();
        reject(err);
      }
    };

    main.startActivityForResult(intent, REQUEST_CODE);
  });
}
