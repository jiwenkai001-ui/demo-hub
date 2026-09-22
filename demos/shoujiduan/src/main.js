import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Vant 组件按需引入
import {
  Button, Cell, CellGroup, Field, Form, Picker, Popup, Tag, Tab, Tabs,
  Tabbar, TabbarItem, Search, Stepper, Dialog, Toast, Checkbox,
  CheckboxGroup, Radio, RadioGroup, ActionSheet, PullRefresh, List,
  Empty, Badge, Switch, DatePicker, TimePicker, Uploader, Steps, Step,
  DropdownMenu, DropdownItem, Collapse, CollapseItem, NoticeBar,
  SwipeCell, Grid, GridItem, Divider, Skeleton, Progress, Circle,
  NumberKeyboard, ContactCard, Area, Loading, Card, Image as VanImage,
  NavBar, Icon, Sticky, Swipe, SwipeItem, Popover, CountDown,
  Space, FloatingBubble, BackTop, ConfigProvider
} from 'vant'
import 'vant/lib/index.css'

const app = createApp(App)

const vantComponents = [
  Button, Cell, CellGroup, Field, Form, Picker, Popup, Tag, Tab, Tabs,
  Tabbar, TabbarItem, Search, Stepper, Dialog, Toast, Checkbox,
  CheckboxGroup, Radio, RadioGroup, ActionSheet, PullRefresh, List,
  Empty, Badge, Switch, DatePicker, TimePicker, Uploader, Steps, Step,
  DropdownMenu, DropdownItem, Collapse, CollapseItem, NoticeBar,
  SwipeCell, Grid, GridItem, Divider, Skeleton, Progress, Circle,
  NumberKeyboard, ContactCard, Area, Loading, Card, VanImage,
  NavBar, Icon, Sticky, Swipe, SwipeItem, Popover, CountDown,
  Space, FloatingBubble, BackTop, ConfigProvider
]

vantComponents.forEach(c => app.use(c))

// Vant 4 没有全局 DatetimePicker，提供兼容别名
app.component('VanDatetimePicker', DatePicker)

app.use(createPinia())
app.use(router)
app.mount('#app')
