import { createApp } from 'vue'
import App from './App.vue'

import { Button, message, Row, Col } from 'ant-design-vue';

const app = createApp(App)
app.use(Button);
app.use(Row);
app.use(Col);
app.config.globalProperties.$message = message;
app.mount('#app')
