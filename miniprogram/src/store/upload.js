import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUploadStore = defineStore('upload', () => {
  const uploading = ref(false);
  const progress = ref(0);
  const currentFile = ref(null);

  function startUpload(file) {
    uploading.value = true;
    progress.value = 0;
    currentFile.value = file;
  }

  function updateProgress(p) {
    progress.value = p;
  }

  function finishUpload() {
    uploading.value = false;
    progress.value = 100;
    currentFile.value = null;
  }

  function reset() {
    uploading.value = false;
    progress.value = 0;
    currentFile.value = null;
  }

  return { uploading, progress, currentFile, startUpload, updateProgress, finishUpload, reset };
});
