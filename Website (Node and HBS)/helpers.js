import * as datefns from 'date-fns'
import * as htmlparser from 'htmlparser2'

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

export function isAuthenticated(req) {
    console.log("???", req.isAuthenticated())
    return req.isAuthenticated()
}

export function compareValues(val1, operator, val2) {
    let ret

    switch(operator) {
        case '<':
            ret = val1 < val2
            break
        case '<=':
            ret = val1 <= val2
            break
        case '>':
            ret = val1 > val2
            break
        case '>=':
            ret = val1 >= val2
            break
        case '==':
            ret = val1 == val2
            break
        case '!=':
            ret = val1 != val2
            break
    }

    console.log(ret)
    return ret
}

