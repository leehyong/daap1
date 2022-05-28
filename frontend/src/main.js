import { createApp } from 'vue'
import App from './App.vue'
import store from "./store"
import { Button, message,
  Row, Col, Select,
  SelectOption, Table, InputNumber,
  Popconfirm, Modal, Tooltip
} from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css'; // or 'ant-design-vue/dist/antd.less'

const app = createApp(App)
app.use(Button);
app.use(Row);
app.use(Table);
app.use(Col);
app.use(Select);
app.use(Modal);
app.use(SelectOption);
app.use(InputNumber);
app.use(Popconfirm);
app.use(Tooltip);
app.use(store);
app.config.globalProperties.$message = message;
app.mount('#app')
