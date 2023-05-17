import * as datefns from 'date-fns'

export function section (name, options) {
    if(!this._sections) this._sections = {}
    this._sections[name] = options.fn(this)
    return null
}

export function formatDate(date, format) {
    let args = Array.from(arguments); args.pop()
    if (args.length == 1) format = "do LLL"

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
    // dateFormat = args.length < 3 ? "do LLL"  : dateFormat

    if (dates.length == 1) {
        return datefns.format(new Date(dates[0]), "do LLL yyyy")
    }
    
    if (groupFormat == "commaSeparated") {
        let arr = []
        let groupedDates = groupDates(dates)

        // need to add an and in
        for (let group of groupedDates) {
            arr.push(`${group.map(a => datefns.format(new Date(a), "do")).join(", ")} ${datefns.format(new Date(group[0]), "LLL")}`)
        }

        return arr.join(", ")

    }

    dates = dates.sort((a, b) => new Date(a) - new Date(b))
    let start = new Date(dates[0]), end = new Date(dates[dates.length -1])

    if (start.getFullYear == end.getFullYear) {
        if (start.getMonth() == end.getMonth()) {
            return `${datefns.format(start, "do")} - ${datefns.format(end, "do LLL yyyy")}`
        } else {
            return `${datefns.format(start, "do LLL")} - ${datefns.format(end, "do LLL yyyy")}`
        }
    }

    return `${datefns.format(start, "do LLL yyyy")} - ${datefns.format(end, "do LLL yyyy")}`
    
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

