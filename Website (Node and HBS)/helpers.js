import * as datefns from 'date-fns'
import * as htmlparser from 'htmlparser2'

// 
export function section (name, options) {
    if(!this._sections) this._sections = {};
    this._sections[name] = options.fn(this);
    return null;
}

export function formatDate(date, format) {
    const defaultFormat = "do LLL"    
    let args = Array.from(arguments); args.pop()

    return datefns.format(
        new Date(date), 
        args.length == 1 ? defaultFormat : format
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

export function replaceSymbols(str) {
    let chars = [
        {
            key: "&#x3d;",
            char: "="
        }
    ]

    for (let char of chars) {
        str = str.replace(char.key, char.char)
    }

    return str
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

    // console.log(grouped)
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

// export function groupDates (dates)  {
//     return groupDates(dates)
// }

export function venueDatesToDatesArray (venueDates) {
    return venueDates.map(a => a.date)
}

export function addVenueIDToUrl(url, venue_id) {
    return url.replace('[VENUE_ID]', venue_id)
}

export function stringify(json) {
    return JSON.stringify(json, null, 2)
}

export function htmlify(string) {
    // https://stackoverflow.com/a/21870431
    // const parser = new DOMParser()
    // return parser.parseFromString(string, "text/html")

    // const parser = new htmlparser.Parser()
    // console.log(parser.write(string))
    // return parser.write(string)

    console.log(htmlparser.parseDocument(string))

    return htmlparser.parseDocument(string)
}

export function isAuth(req) {
    console.log("???", req.isAuthenticated())
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

