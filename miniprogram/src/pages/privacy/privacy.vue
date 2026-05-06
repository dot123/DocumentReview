<template>
  <view class="page">
    <view class="title">隐私协议</view>
    <view class="content">
      <view class="section">
        <text class="section-title">一、信息收集</text>
        <text class="section-text">本小程序仅收集必要的微信开放平台信息（微信昵称、头像）及用户主动提供的手机号码，用于用户身份识别和服务提供。不会收集位置、相册、通讯录等额外信息。</text>
      </view>

      <view class="section">
        <text class="section-title">二、信息使用</text>
        <text class="section-text">收集的信息仅用于：1）用户身份认证；2）提供文书审核服务；3）生成审核报告；4）改善服务质量。不会将用户信息用于本服务之外的任何用途。</text>
      </view>

      <view class="section">
        <text class="section-title">三、文件安全</text>
        <text class="section-text">用户上传的文书/合同文件采用加密传输（HTTPS/TLS），存储于腾讯云COS对象存储，启用服务端加密（SSE-COS）。每个用户的文件相互隔离，不可跨用户查看。用户可随时删除已上传的文件。</text>
      </view>

      <view class="section">
        <text class="section-title">四、数据存储</text>
        <text class="section-text">用户数据存储于位于中国大陆的腾讯云服务器。文件在审核完成后保留7天，用户主动删除或超过保留期限的文件将被永久清除。</text>
      </view>

      <view class="section">
        <text class="section-title">五、用户权利</text>
        <text class="section-text">用户有权随时：1）查看和编辑个人信息；2）删除已上传的文件；3）注销账号（注销后所有数据将被清除）；4）导出审核记录。如对本隐私协议有任何疑问，请联系客服。</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { padding: 30rpx; background: #fff; min-height: 100vh; }
.title { font-size: 36rpx; font-weight: bold; text-align: center; padding: 30rpx 0; }
.section { margin-bottom: 30rpx; }
.section-title { font-size: 30rpx; font-weight: bold; display: block; margin-bottom: 12rpx; }
.section-text { font-size: 28rpx; color: #333; line-height: 1.8; }
</style>
