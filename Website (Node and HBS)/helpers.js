import * as datefns from 'date-fns'

export function formatDate(date, format) {
    const defaultFormat = "do LLL"    
    let args = Array.from(arguments); args.pop()

    return datefns.format(
        new Date(date), 
        args.length == 1 ? defaultFormat : format
    )
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