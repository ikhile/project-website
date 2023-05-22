import { stringifyArray } from "./array-functions.mjs"
import { fetchData } from "./fetchData.js"

// import { fetchData } from "./fetchData"
let tourID = window.location.href.match(/tour\/(\d+)/)[1]
const venueRegex = /venue\/(\d+)/, venueID = venueRegex.test(window.location.href)  ? window.location.href.match(venueRegex)[1] : null
let selectedDateIDs = [], numDates = $("input[name=date]").length
let ticketQty, qtyInput = $('input[name="qty"]')
let ticketResponse, ticketResIndex
let availableSort = "DESC"
let maxTickets = parseInt($('meta[name="tour-id"]').attr("content"))


$(document).ready(async function () {
    $("body").css("margin-bottom", $("footer").outerHeight() + 10)

    maxTickets = parseInt($('meta[name="max-tickets"]').attr("content"))
    console.log(maxTickets)

    $("#change-city-btn").click(toggleCityPopup)
    $("#change-city-modal").click(toggleCityPopup)
    $(".city-card").click(function () {
        // if data-venue-id == current venue id then just close popup without going to a new page
        if ($(this).attr("data-venue-id") != venueID) {
            window.location.href = `/events/purchase/tour/${$(this).attr("data-tour-id")}/venue/${$(this).attr("data-venue-id")}`

        }
    })

    if (!!venueID) {
 
        const params = new URLSearchParams(window.location.search)
        const qryDates = params.getAll("date")

        if (qryDates.length > 0) {
            for (let dateID of qryDates) $(`input[name=date][value=${dateID}]`).prop("checked", true)

        } else {
            $("input[name=date]").prop("checked", true)
        }

        ticketQty = params.get("qty") ?? 2
        $("input[name=qty]").val(ticketQty)
        $("#qty-span").text(ticketQty)
        disableQtyBtns()

        // only allow date filter to be clicked when update needed
        $("input[name=date]").on("input", updateDates)
        $("#increase-tickets").click(increaseQty)
        $("#decrease-tickets").click(decreaseQty)

        updateDates()

        // if reached page from stripe cancel url, will alert user that their purchase has been cancelled and remove cancelled parameter from url so it does not stay on refresh
        if (params.has("cancelled")) {
            let url = new URL(window.location)
            url.searchParams.delete("cancelled")
            window.history.pushState({}, "", url)

            alert("You cancelled your previous purchase and have not been charged.")
        }

        if (params.has("error")) {
            let url = new URL(window.location)
            url.searchParams.delete("error")
            window.history.pushState({}, "", url)

            alert("There was an error while trying to process your purchase. Please try again.")
        }
    }
})

async function updateDates() {
    selectedDateIDs = []
    $("input[name=date]:checked").each((i, elem) => {
        selectedDateIDs.push($(elem).val())
    })

    $("input[name=dates]").val(stringifyArray(selectedDateIDs))
    // the below allows for refreshing the page to keep the same dates and qty selected (noticed because I constantly refresh this page, thought it'd be nice)
    // https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page
    // https://developer.mozilla.org/en-US/docs/Web/API/History/pushState#change_a_query_parameter

    const url = new URL(location)
    url.searchParams.delete("date")

    if (selectedDateIDs.length < numDates) {
        for (let dateID of selectedDateIDs) {
            url.searchParams.append("date", dateID)
        }
    }

    window.history.pushState({}, "", url)
    updateAvailableSeats()
}

async function updateAvailableSeats() {
    console.log($("#available-tickets"))
    $("#available-tickets").html("<p class='text-center h3 pt-5'>Loading...</p>") // this + timeout used as an indicator to the user that the information has updated

    ticketQty = $("input[name=qty]").val()
    let dateQry = stringifyArray(selectedDateIDs)

    let url = `/api/available-seats?tour=${tourID}&dates=${dateQry}&qty=${ticketQty}&orderby=${availableSort}`
    ticketResponse = await fetchData(url)

    setTimeout(() => { 

        if (ticketResponse.length > 0) {
            for (let t of ticketResponse) {
                t.price.formatted = {}
                for (let [key, value] of Object.entries(t.price)) {
                    if (typeof value == "number") {
                        t.price.formatted[key] = "£" + value.toFixed(2)
                    }
                }
            }

            let context = { availableTickets: ticketResponse }
        
            renderTemplate($("#available-tickets"), "/views/available-tickets.hbs", context)
            .then(() => {

                $(".available-ticket-card").click(function() {
                    ticketResIndex = $(this).attr("data-index")
                    const t = ticketResponse[ticketResIndex]
                    console.log(t)

                    let context =  {
                        block: t.block,
                        section: t.section,
                        row: t.row,
                        dates: t.dates,
                        ticketGroups: t.tickets,
                        singleTicket: ticketQty == 1,
                        tourID: tourID,
                        venueID: venueID,
                        currentURL: window.location.href,
                        price: t.price
                    }

                    renderTemplate($("#select-seats-modal"), "/views/select-seats.hbs", context)
                        .then(() => {
                            $("#select-seats-modal").css("display", "flex")
                            selectFilterSeats()

                            $("#select-seats-modal select[name=date]").on("input",function() {
                                selectFilterSeats()
                            })

                            $("#close-select-seats").click(function() {
                                $("#select-seats-modal").css("display", "none")
                            })
                        })
                })

                $(".sort-tix").click(function() {
                    availableSort = $(this).attr("data-sort-order")
                })

            })            
                    

        } else {
            let context = {
                tour_id: tourID,
                venue_id: venueID,
                date_value: dateQry
            }
            renderTemplate($("#available-tickets"), "/views/no-tickets.hbs", context)
            $("#waiting-list-dates").val(dateQry)
        }

    }, Math.random() * 500)

}

function selectFilterSeats() {
    const selectedDate = $("#select-seats-modal select[name=date] option:selected").val()

    $("#select-seats-modal select[name=seats] option:first-of-type").attr("selected", "true")
    $("#select-seats-modal select[name=seats] option:not(first-of-type)").each((i, elem) => {
        $(elem).attr("hidden", true)
        $(elem).removeAttr("selected")
        if ($(elem).attr("data-date-id") == selectedDate) {
            $(elem).removeAttr("hidden")
        } 

        
    })
}

async function renderTemplate(container, template, context) {
    // https://stackoverflow.com/a/28452343
    await $.get(template, (data) => {
        template = Handlebars.compile(data)
        container.html(template(context))
    }, 'html')
}

function toggleCityPopup() {
    
    let popup = $('#change-city-modal')

    if (popup.hasClass("d-none")) {
        popup.addClass("d-flex")
        popup.removeClass("d-none")
    } else if (!!venueID) {
        popup.addClass("d-none")
        popup.removeClass("d-flex")        
    }

    // switch(popup.hasClass('display')) {
    //     case "none":
    //         popup.css('display', 'flex')
    //         break
    //     default:
    //         popup.css('display', 'none')
    // }
}


// can store a max quantity in the database for each tour
// let maxTickets = 4 // fetchData(`/api/tours/${tourID}/max`) ?? 4
// then also want to check number purchased by user already for thcont
// let maxTickets = parseInt($('meta[name="tour-id"]').attr("content"))

function increaseQty() {
    const oldVal = qtyInput.val()
    let newVal = parseInt(qtyInput.val()) + 1
    if (newVal > maxTickets) newVal = maxTickets

    if (oldVal != newVal) {
        ticketQty = newVal
    }

    updateQtyVals()
}

function decreaseQty() {
    const oldVal = qtyInput.val()
    let newVal = parseInt(qtyInput.val()) - 1
    if (newVal < 1) newVal = 1

    if (oldVal != newVal) {
        // qtyInput.val(newVal)
        ticketQty = newVal
        // $("#filters").submit()
    }

    updateQtyVals()
}

function updateQtyVals() {
    qtyInput.val(ticketQty)
    $("#qty-span").text(ticketQty)
    disableQtyBtns()
    updateAvailableSeats()

    let url = new URL(location)
    url.searchParams.set("qty", ticketQty)
    window.history.pushState({}, "", url)
}

function disableQtyBtns() {
    $("#increase-tickets, #decrease-tickets").attr("disabled", false)

    if (qtyInput.val() <= 1) $("#decrease-tickets").attr("disabled", true)
    else if (qtyInput.val() >= maxTickets) $("#increase-tickets").attr("disabled", true)
}