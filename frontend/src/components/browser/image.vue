<template>
  <div class="image-container">
    <img :src="formattedImageData" alt="Displaying image" />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  content: {
    type: [Array, String], // Allow both Array and String types
    required: true,
    validator(value) {
      // Accept arrays, non-empty strings, or null/undefined
      return Array.isArray(value) || typeof value === 'string' || value == null;
    }
  },
  // 增加一个 prop 来指定图片类型，默认为 'image/jpeg'
  imageType: {
    type: String,
    default: 'image/jpeg' // 根据你的实际图片类型调整，'image/png', 'image/gif' 等
  }
});

// 使用 computed 属性来动态生成完整的 Data URI
const formattedImageData = computed(() => {
  // Handle null, undefined, or empty content
  if (!props.content) {
    return '';
  }
  
  let base64Data = '';
  
  // Handle different content types
  if (Array.isArray(props.content)) {
    // Array case - get the last item if array is not empty
    if (props.content.length === 0) {
      return '';
    }
    base64Data = props.content[props.content.length - 1];
  } else if (typeof props.content === 'string') {
    // String case - use directly
    base64Data = props.content;
  } else {
    // Fallback for other types
    console.warn("ImageDisplay component received unsupported content type:", typeof props.content);
    return '';
  }

  // Validate the base64Data
  if (!base64Data || base64Data.trim() === '') {
    return '';
  }

  // 拼接 Data URI 前缀和 Base64 数据
  // 确保 base64Data 不包含任何 Data URI 前缀，如果包含，需要先移除
  if (base64Data.startsWith('data:')) {
    // 如果传进来的 Base64 字符串已经包含了 Data URI 前缀，则直接使用
    return base64Data;
  } else {
    // 否则，手动添加前缀
    return `data:${props.imageType};base64,${base64Data}`;
  }
});
</script>

<style lang="scss" scoped>
.image-container {
  width: 100%;
  display: flex;
  justify-content: center;
  
  img {
    max-width: 100%;
    height: auto;
    object-fit: contain;
    border: 1px solid #dadada;
  }
}
</style>