<template>
  <div class="sidebar-footer">
    <div class="footer-actions">
      <!-- <button class="footer-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </button>
      <button class="footer-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        </svg>
      </button>
      <button class="footer-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      </button> -->
      <!-- 设置 -->
      <button class="footer-button " id="setting" @click="toSetting">
        <svg t="1744338498135" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="5527" width="20" height="20">
          <path
            d="M439.816 101.851c-8.631-16.952-28.007-25.48-46.337-20.396-70.066 19.435-133.165 55.501-184.82 103.628-12.909 12.028-16.413 31.094-8.623 46.926 5.374 10.92 8.414 23.234 8.414 36.376 0 45.555-36.833 82.347-82.1 82.347-0.381 0-0.762-0.003-1.142-0.008-17.691-0.253-33.448 11.147-38.74 28.031C73.159 421.209 66 466.344 66 513.078c0 30.844 3.118 61.001 9.07 90.156 4.1 20.082 22.714 33.816 43.111 31.808a83.069 83.069 0 0 1 8.169-0.399c45.267 0 82.1 36.791 82.1 82.346 0 20.276-7.254 38.74-19.334 53.086-13.177 15.649-12.423 38.718 1.748 53.472 52.742 54.916 119.403 96.417 194.376 118.784 20.888 6.231 42.918-5.408 49.543-26.174 10.616-33.275 41.714-57.212 78.217-57.212s67.601 23.937 78.217 57.212c6.625 20.766 28.655 32.405 49.543 26.174 74.973-22.367 141.634-63.868 194.376-118.784 14.17-14.755 14.924-37.823 1.748-53.471-12.08-14.346-19.334-32.811-19.334-53.087 0-45.554 36.834-82.346 82.1-82.346 2.773 0 5.496 0.135 8.169 0.399 20.397 2.008 39.011-11.726 43.111-31.808 5.951-29.155 9.07-59.312 9.07-90.156 0-46.734-7.16-91.869-20.468-134.323-5.292-16.884-21.049-28.285-38.741-28.031-0.379 0.005-0.76 0.008-1.141 0.008-45.266 0-82.1-36.792-82.1-82.347 0-13.142 3.04-25.456 8.414-36.376 7.79-15.832 4.286-34.898-8.623-46.926-51.655-48.127-114.754-84.193-184.82-103.628-18.33-5.084-37.706 3.444-46.337 20.396-13.648 26.806-41.357 44.97-73.184 44.97-31.827 0-59.536-18.164-73.184-44.97zM288.45 268.385c0-14.471-1.9-28.535-5.47-41.936 31.114-25.118 66.377-45.232 104.576-59.156 29.686 36.285 74.82 59.528 125.444 59.528 50.624 0 95.758-23.243 125.444-59.528 38.199 13.924 73.462 34.038 104.576 59.156a162.748 162.748 0 0 0-5.47 41.936c0 79.513 57.113 145.772 132.604 159.667 6.434 27.261 9.846 55.723 9.846 85.026 0 14.581-0.845 28.951-2.485 43.065-79.109 10.814-139.965 78.769-139.965 160.846 0 26.162 6.201 50.922 17.202 72.84-30.829 27.076-66.197 49.043-104.786 64.612-28.717-45.337-79.271-75.496-136.966-75.496-57.695 0-108.249 30.159-136.966 75.496-38.589-15.569-73.957-37.536-104.787-64.612 11.002-21.918 17.203-46.678 17.203-72.84 0-82.077-60.856-150.032-139.965-160.846A373.007 373.007 0 0 1 146 513.078c0-29.304 3.411-57.765 9.845-85.026 75.492-13.894 132.605-80.154 132.605-159.667zM513 336c-97.202 0-176 78.798-176 176s78.798 176 176 176 176-78.798 176-176-78.798-176-176-176zM409 512c0-57.438 46.562-104 104-104s104 46.562 104 104-46.562 104-104 104-104-46.562-104-104z"
            fill="#666" p-id="5528"></path>
        </svg>
      </button>
      <!-- 登录 -->
       <button class="login" v-if="isLogined" @click="toLogin">
         {{ $t('auth.login') }}
       </button>
       <button class="login" v-else @click="toLoginOut">
         {{ $t('auth.logOut') }}
       </button>
    </div>

  </div>
</template>

<script setup>
import { ref,computed,onMounted,nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import service from '@/services/default-model-setting'
import { useI18n } from 'vue-i18n'

const router = useRouter();
const opShow = ref(true);

const { t } = useI18n()
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import tr from '@/locals/lang/tr';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const tour = async () => {
  const tourDriver = driver({
    animate: true,
    showProgress: true,
    prevBtnText: t('setting.prevStep'),
    nextBtnText: t('setting.nextStep'),
    doneBtnText: t('setting.doneStep'),
    steps: [
      {
        element: '#setting',
        popover: {
          side: 'bottom',
          title: t('setting.settingModel'),
          description: t('setting.settingModelTips'),
          onNextClick: async () => {
            nextTick(() => { 
              //设置缓存 结束引导
              localStorage.setItem('tour_end', 'true');
              tourDriver.moveNext()
            })
          },
        }
      }
    ]
  });

  tourDriver.drive();
}

//checkModel

//检查是否配置模型
async function checkModel() { 
  //判断有没有 localStorage.setItem('tour_end', 'true');
  if(localStorage.getItem('tour_end') == 'true'){
    localStorage.setItem('tour', 'false');
    return;
  }
  let res =  await service.checkModel();
  if(res.has_default_platform && res.has_enabled_platform && res.has_search_setting){
    localStorage.setItem('tour', 'false');
  }else{
    localStorage.setItem('tour', 'true');
    tour();
  }
}

onMounted(() => {
  nextTick(() => {
    checkModel();
  });
});
//判断有没有登录
const isLogined = computed(() => {
  const token = localStorage.getItem('access_token');
  if(token){
    return false;
  }
  return true;
});
const toLogin = () => {
  router.push({ path: '/auth' });
};

const  toLoginOut = () => {
  localStorage.removeItem('access_token');
  //刷新页面
  location.reload();
};

const toSetting = () => {
  router.push({ path: '/setting/basic' });
};

</script>

<style lang="scss" scoped>
.opDiv {
            position: absolute;
            background: #fff;
            display: none;
            z-index: 9999;
            padding: 8px;
            border-radius: 6px;
            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .08), 0 8px 24px 0 rgba(0, 0, 0, .04);
            bottom: 40px;
            left: 16px;
            font-size: 12px;
            width: 298px;

            div {
                padding: 5px 8px;
                border-radius: 6px;
            }

            span {
                margin-right: 8px;
            }

            img {
                margin-right: 5px;
            }
        }
.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;

  &:hover{
    .opDiv {
      display: block;
    }
  }
}

.avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.footer-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: space-between;
}

.footer-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;

  &:hover {
    background-color: #f5f5f5;
    color: #333;
  }
}

.login{
  border: 1px solid #666;
  background: unset;
  font-size: 14px;
  border-radius: 20px;
  height: 32px;
  cursor: pointer;
  min-width: 64px
}
</style>