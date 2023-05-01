import * as datefns from '../date-fns' // doesn't work as I can't import date-fns here

Handlebars.registerHelper("formatDate", function(date, format) {
    const defaultFormat = "do LLL"    
    let args = Array.from(arguments); args.pop()

    return datefns.format(
        new Date(date), 
        args.length == 1 ? defaultFormat : format
    )
})