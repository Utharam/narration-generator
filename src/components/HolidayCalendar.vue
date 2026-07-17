<template>
  <div class="calendar">
    <div class="calendar-header">
      <button @click="prevMonth" class="nav-btn">&larr;</button>
      <span class="month-year">{{ monthName }} {{ currentYear }}</span>
      <button @click="nextMonth" class="nav-btn">&rarr;</button>
    </div>

    <div class="calendar-grid">
      <div class="day-header" v-for="day in dayNames" :key="day">{{ day }}</div>
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        class="day-cell"
        :class="{
          'empty': !day,
          'weekend': day && isWeekendCheck(day),
          'holiday': day && isHolidayCheck(day),
          'working': day && isWorkingDayCheck(day)
        }"
        @click="day && !isWeekendCheck(day) ? toggleHoliday(day) : null"
      >
        <span v-if="day">{{ day.getDate() }}</span>
      </div>
    </div>

    <div class="calendar-legend">
      <span class="legend-item"><span class="legend-box working"></span> Working Day</span>
      <span class="legend-item"><span class="legend-box weekend"></span> Weekend</span>
      <span class="legend-item"><span class="legend-box holiday"></span> Holiday (click to toggle)</span>
    </div>

    <p class="calendar-hint">
      Click on any working day to mark it as a banking holiday. Click again on a holiday to unmark it.
      Weekends are automatically excluded. Holidays are saved in your browser.
    </p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { isWeekend, formatDateISO } from '../utils/helpers.js'

const props = defineProps({
  holidays: { type: Array, default: () => [] }
})

const emit = defineEmits(['toggle-holiday'])

const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const monthName = computed(() => monthNames[currentMonth.value])
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Build the calendar grid for the current month
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []
  // Add empty cells for days before the 1st of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(null)
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i))
  }
  return days
})

function isWeekendCheck(date) {
  return isWeekend(date)
}

function isHolidayCheck(date) {
  return props.holidays.includes(formatDateISO(date))
}

function isWorkingDayCheck(date) {
  return !isWeekendCheck(date) && !isHolidayCheck(date)
}

function toggleHoliday(date) {
  emit('toggle-holiday', formatDateISO(date))
}

function prevMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}
</script>

<style scoped>
.calendar {
  max-width: 400px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.month-year {
  font-weight: 600;
  font-size: 1.1em;
}

.nav-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 1.1em;
}

.nav-btn:hover {
  background: #e0e0e0;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.day-header {
  text-align: center;
  font-size: 0.75em;
  font-weight: 600;
  color: #666;
  padding: 5px 0;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85em;
  transition: background 0.15s;
}

.day-cell.empty {
  cursor: default;
}

.day-cell.weekend {
  background: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

.day-cell.holiday {
  background: #ffe0e0;
  color: #c00;
}

.day-cell.holiday:hover {
  background: #ffd0d0;
}

.day-cell.working {
  background: #e8f5e9;
  color: #333;
}

.day-cell.working:hover {
  background: #c8e6c9;
}

.calendar-legend {
  display: flex;
  gap: 15px;
  margin-top: 12px;
  font-size: 0.75em;
  color: #666;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.legend-box.working { background: #e8f5e9; }
.legend-box.weekend { background: #f5f5f5; }
.legend-box.holiday { background: #ffe0e0; }

.calendar-hint {
  font-size: 0.75em;
  color: #999;
  margin-top: 10px;
  line-height: 1.4;
}
</style>