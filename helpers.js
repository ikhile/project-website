import * as datefns from 'date-fns'
import * as db from './database.js'

export function section (name, options) {
    if(!this._sections) this._sections = {}
    this._sections[name] = options.fn(this)
    return null
}

export function formatDate(date, format) {
    let args = Array.from(arguments); args.pop()
    if (args.length == 1) format = "do LLLL"

    if (/invalid date/i.test(new Date(date))) {
        console.error(`Invalid date '${date}'`)
        return
    }

    return datefns.format(
        new Date(date), 
        format
    )
}

export function isPast(date) {
    return datefns.isPast(new Date(date))
}

export function isFuture(date) {
    return datefns.isFuture(new Date(date))
}

export function isSameYear(date1, date2) {
    return datefns.isSameYear(new Date(date1), new Date(date2))
}

export function isSameDay(date1, date2) {
    return datefns.isSameDay(new Date(date1), new Date(date2))
}

export function isThisYear(date) {
    return datefns.isSameYear(new Date(date), new Date())
}

export function addPluralS(value) {
    return value == 1 ? "" : "s"
}

export function toLowerCase(str) {
    return str.toLowerCase()
}


// JS Bin figuring the below out: https://jsbin.com/zoquloleyu/1/edit?js,console

export function groupDates(dates) {
    let grouped = {}

    
    for (let date of dates) {

        let d = new Date(date.hasOwnProperty("date") ? date.date : date)
      
        let year = datefns.format(d, 'yyyy'), month = datefns.format(d, 'LLLL')
        
        if (!grouped.hasOwnProperty(year)) {
            grouped[year] = {}
        }
        
        if (!grouped[year].hasOwnProperty(month)) {
            grouped[year][month] = []
        }
        
        grouped[year][month].push(date)
        
    }        

    return groupedDatesToArray(grouped)
}

function groupedDatesToArray(groupedDates) {
    let arr = []
      for (let year of Object.keys(groupedDates)) {
        for (let month of Object.keys(groupedDates[year])) {
          arr.push(groupedDates[year][month])
        }
      }
    
    return arr
}

export function groupFormatDates(dates, groupFormat, dateFormat) {
    let args = Array.from(arguments); args.pop()
    groupFormat = args.length < 2 ? "startEnd" : groupFormat

    if (dates.length == 1) {
        return datefns.format(new Date(dates[0]), "do LLLL yyyy")
    }
    
    if (groupFormat == "commaSeparated") {
        let arr = []
        let groupedDates = groupDates(dates)

        for (let group of groupedDates) {
            arr.push(`${group.map(a => datefns.format(new Date(a), "do")).join(", ")} ${datefns.format(new Date(group[0]), "LLLL")}`)
        }

        return arr.join(", ")

    }

    dates = dates.sort((a, b) => new Date(a) - new Date(b))
    let start = new Date(dates[0]), end = new Date(dates[dates.length -1])

    if (start.getFullYear == end.getFullYear) {
        if (start.getMonth() == end.getMonth()) {
            return `${datefns.format(start, "do")} - ${datefns.format(end, "do LLLL yyyy")}`
        } else {
            return `${datefns.format(start, "do LLLL")} - ${datefns.format(end, "do LLLL yyyy")}`
        }
    }

    return `${datefns.format(start, "do LLLL yyyy")} - ${datefns.format(end, "do LLLL yyyy")}`
    
}

export function groupSeats(seats, mode = "range") {
    let args = Array.from(arguments); args.pop()
    if (args.length == 1) mode = "range"
    if (seats.length == 1) return seats[0].seat_number

    switch (mode) {
        case "range":
            seats = seats.sort((a, b) => a.seat_number - b.seat_number)
            return `${seats[0].seat_number} - ${seats[seats.length - 1].seat_number}`

        case "comma":
            return seats.map(a => a.seat_number).sort((a, b) => a - b).join(", ")
    }
}

export function formatPrice(float, forceDecimals = false) {
    try { return `£${float}` }
    catch (err) { console.error(err) }
    return float
    // return isNaN(float) ? ("£"+ float) : `£${float}`//.toFixed(float % 1 != 0 || forceDecimals ? 2 : 0)}`
}

export function venueDatesToDatesArray (venueDates) {
    return venueDates.map(a => a.date)
}

export function stringify(json) {
    return JSON.stringify(json, null, 2)
}

export function isAuth(req) {
    return req.isAuthenticated()
}

export function compareValues(val1, operator, val2) {
    switch(operator) {
        case '<':
            return val1 < val2
            
        case '<=':
            return val1 <= val2
            
        case '>':
            return val1 > val2
            
        case '>=':
            return val1 >= val2
            
        case '==':
            return val1 == val2
            
        case '!=':
            return val1 != val2  
    }
}

export function arrayIncludes(array, value) {
    return array.includes(value)
}

export function slotStatus(slot) {
    const start = new Date(slot.start)
    const end = new Date(slot.end)

    if (datefns.isFuture(start)) return "future"
    if (datefns.isPast(end)) return "past"
    /*if (datefns.isPast(start) && datefns.isFuture(end))*/ return ongoing
}

export function slotPast(slot) {
    if (datefns.isPast(new Date(slot.end))) return true
    return false
}

export function slotOngoing(slot) {
    if (datefns.isPast(new Date(slot.start)) && datefns.isFuture(new Date(slot.end))) return true
    return false
}

export function slotFuture(slot) {
    if (datefns.isFuture(new Date(slot.start))) return true
    return false
}

export function last(arr) {
    return arr[arr.length - 1]
}

export function lastSlotEnd(slotsArr) {
    return slotsArr.length ? slotsArr[slotsArr.length - 1].end : null
}

export function lastSlotEndIsThisYear(slotsArr) {
    return slotsArr.length ? isThisYear(lastSlotEnd(slotsArr)) : null
}


// can't use async in a helper .. gonna do in router
export async function eligibleForRefund(order) {
    const purchasedDate = new Date(order.purchased_at)
    const eventDate = new Date((await db.getDateFromID(order.date_id)).date)
    
    return Math.abs(datefns.differenceInDays(new Date(order.purchased_at), new Date())) < 14 && datefns.differenceInDays(eventDate, purchasedDate) < 7
}

export function formatDistance(date, baseDate) {
    let args = Array.from(arguments); args.pop()
    let invalidDates = false
    baseDate = args.length == 1 ? new Date() : baseDate

    if (/invalid date/i.test(new Date(date))) {
        console.error(`Invalid date '${date}'`)
        invalidDates = true
    }

    if (/invalid date/i.test(new Date(baseDate))) {
        console.error(`Invalid date '${baseDate}'`)
        invalidDates = true
    }

    if (invalidDates) return

    return datefns.formatDistance(new Date(date), new Date(baseDate))
}

export function lowercaseTour(text) {
    return text.replace(/tour/gi, "tour")
}

export function timeGreeting() {
    let hour = (new Date()).getHours()
    return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
}