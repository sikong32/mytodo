import Lunar from 'lunar-javascript'
const LunarDate = Lunar.Lunar

interface Holiday {
  title: string
  start: Date
  end?: Date
  color: string
  allDay: boolean
}

// 음력 날짜를 양력으로 변환하는 함수
function lunarToSolar(year: number, month: number, day: number): Date {
  const lunar = LunarDate.fromYmd(year, month, day)
  const solar = lunar.getSolar()
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay())
}

// 특정 월의 n번째 특정 요일을 찾는 함수
function getNthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const date = new Date(year, month, 1)
  let count = 0
  
  while (count < n) {
    if (date.getDay() === weekday) {
      count++
    }
    if (count < n) {
      date.setDate(date.getDate() + 1)
    }
  }
  return date
}

// 특정 월의 마지막 특정 요일을 찾는 함수
function getLastWeekday(year: number, month: number, weekday: number): Date {
  const date = new Date(year, month + 1, 0)
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() - 1)
  }
  return date
}

export function getHolidays(year: number, locale: string = 'ko'): Holiday[] {
  const holidays: Holiday[] = []

  switch (locale) {
    case 'ko':
      // 고정 공휴일
      holidays.push(
        { title: '신정', start: new Date(year, 0, 1), color: '#FF4B4B', allDay: true },
        { title: '삼일절', start: new Date(year, 2, 1), color: '#FF4B4B', allDay: true },
        { title: '어린이날', start: new Date(year, 4, 5), color: '#FF4B4B', allDay: true },
        { title: '현충일', start: new Date(year, 5, 6), color: '#FF4B4B', allDay: true },
        { title: '광복절', start: new Date(year, 7, 15), color: '#FF4B4B', allDay: true },
        { title: '개천절', start: new Date(year, 9, 3), color: '#FF4B4B', allDay: true },
        { title: '한글날', start: new Date(year, 9, 9), color: '#FF4B4B', allDay: true },
        { title: '크리스마스', start: new Date(year, 11, 25), color: '#FF4B4B', allDay: true }
      )

      // 음력 공휴일
      const seollal = lunarToSolar(year, 1, 1)
      const chuseok = lunarToSolar(year, 8, 15)
      const buddha = lunarToSolar(year, 4, 8)

      holidays.push(
        { 
          title: '설날', 
          start: new Date(seollal.setDate(seollal.getDate() - 1)),
          end: new Date(seollal.setDate(seollal.getDate() + 3)),
          color: '#FF4B4B',
          allDay: true 
        },
        { 
          title: '추석', 
          start: new Date(chuseok.setDate(chuseok.getDate() - 1)),
          end: new Date(chuseok.setDate(chuseok.getDate() + 3)),
          color: '#FF4B4B',
          allDay: true 
        },
        {
          title: '부처님오신날',
          start: buddha,
          color: '#FF4B4B',
          allDay: true
        }
      )
      break

    case 'en':
      // 미국 공휴일
      holidays.push(
        { title: "New Year's Day", start: new Date(year, 0, 1), color: '#FF4B4B', allDay: true },
        { title: "Martin Luther King Jr. Day", start: getNthWeekday(year, 0, 1, 3), color: '#FF4B4B', allDay: true },
        { title: "Presidents' Day", start: getNthWeekday(year, 1, 1, 3), color: '#FF4B4B', allDay: true },
        { title: "Memorial Day", start: getLastWeekday(year, 4, 1), color: '#FF4B4B', allDay: true },
        { title: "Independence Day", start: new Date(year, 6, 4), color: '#FF4B4B', allDay: true },
        { title: "Labor Day", start: getNthWeekday(year, 8, 1, 1), color: '#FF4B4B', allDay: true },
        { title: "Columbus Day", start: getNthWeekday(year, 9, 1, 2), color: '#FF4B4B', allDay: true },
        { title: "Veterans Day", start: new Date(year, 10, 11), color: '#FF4B4B', allDay: true },
        { title: "Thanksgiving Day", start: getNthWeekday(year, 10, 4, 4), color: '#FF4B4B', allDay: true },
        { title: "Christmas Day", start: new Date(year, 11, 25), color: '#FF4B4B', allDay: true }
      )
      break

    case 'ja':
      // 일본 공휴일
      const springEquinox = new Date(year, 2, 20) // 대략적인 춘분
      const autumnEquinox = new Date(year, 8, 22) // 대략적인 추분

      holidays.push(
        { title: "元日", start: new Date(year, 0, 1), color: '#FF4B4B', allDay: true },
        { title: "成人の日", start: getNthWeekday(year, 0, 1, 2), color: '#FF4B4B', allDay: true },
        { title: "建国記念の日", start: new Date(year, 1, 11), color: '#FF4B4B', allDay: true },
        { title: "天皇誕生日", start: new Date(year, 1, 23), color: '#FF4B4B', allDay: true },
        { title: "春分の日", start: springEquinox, color: '#FF4B4B', allDay: true },
        { title: "昭和の日", start: new Date(year, 3, 29), color: '#FF4B4B', allDay: true },
        { title: "憲法記念日", start: new Date(year, 4, 3), color: '#FF4B4B', allDay: true },
        { title: "みどりの日", start: new Date(year, 4, 4), color: '#FF4B4B', allDay: true },
        { title: "こどもの日", start: new Date(year, 4, 5), color: '#FF4B4B', allDay: true },
        { title: "海の日", start: getNthWeekday(year, 6, 1, 3), color: '#FF4B4B', allDay: true },
        { title: "敬老の日", start: getNthWeekday(year, 8, 1, 3), color: '#FF4B4B', allDay: true },
        { title: "秋分の日", start: autumnEquinox, color: '#FF4B4B', allDay: true },
        { title: "スポーツの日", start: getNthWeekday(year, 9, 1, 2), color: '#FF4B4B', allDay: true },
        { title: "文化の日", start: new Date(year, 10, 3), color: '#FF4B4B', allDay: true },
        { title: "勤労感謝の日", start: new Date(year, 10, 23), color: '#FF4B4B', allDay: true }
      )
      break

    case 'zh':
      // 중국 공휴일
      const chineseNewYear = lunarToSolar(year, 1, 1)
      const dragonBoat = lunarToSolar(year, 5, 5)
      const midAutumn = lunarToSolar(year, 8, 15)

      holidays.push(
        { title: "元旦", start: new Date(year, 0, 1), color: '#FF4B4B', allDay: true },
        { 
          title: "春节", 
          start: chineseNewYear,
          end: new Date(chineseNewYear.getTime() + 7 * 24 * 60 * 60 * 1000),
          color: '#FF4B4B',
          allDay: true 
        },
        { title: "清明节", start: new Date(year, 3, 4), color: '#FF4B4B', allDay: true },
        { 
          title: "劳动节", 
          start: new Date(year, 4, 1),
          end: new Date(year, 4, 3),
          color: '#FF4B4B',
          allDay: true 
        },
        { title: "端午节", start: dragonBoat, color: '#FF4B4B', allDay: true },
        { title: "中秋节", start: midAutumn, color: '#FF4B4B', allDay: true },
        { 
          title: "国庆节", 
          start: new Date(year, 9, 1),
          end: new Date(year, 9, 7),
          color: '#FF4B4B',
          allDay: true 
        }
      )
      break
  }

  return holidays
} 