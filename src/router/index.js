import { createRouter, createWebHashHistory } from 'vue-router'
import Welcome from '../components/Welcome.vue'
import DailyRollover from '../components/DailyRollover.vue'
import PrepaidExpenses from '../components/PrepaidExpenses.vue'
import NumberToText from '../components/NumberToText.vue'
import CustomRuleBuilder from '../components/CustomRuleBuilder.vue'
import Contact from '../components/Contact.vue'

const routes = [
  { path: '/', component: Welcome },
  { path: '/rollover', component: DailyRollover },
  { path: '/prepaid', component: PrepaidExpenses },
  { path: '/number-to-text', component: NumberToText },
  { path: '/custom-rule', component: CustomRuleBuilder },
  { path: '/contact', component: Contact }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router