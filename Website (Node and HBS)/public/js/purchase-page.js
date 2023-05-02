// import { fetchData } from "./fetchData"
const tourID = window.location.href.match(/tour\/(\d*)/)[1]
const venueID = window.location.href.match(/venue\/(\d*)/)[1]
let selectedDateIDs = [], numDates = $("input[name=date]").length
let ticketQty, qtyInput = $('input[name="qty"]')
let ticketResponse, ticketResIndex

$(document).ready(async function () {
    console.log("PAGE RELOADED")

    $("#change-city-btn").click(toggleCityPopup)
    $("#change-city-modal").click(toggleCityPopup)

    // getting from API/db
    // const tours = await fetch('/api/tours')
    // console.log(await tours.json())//.then((res) => res.data))
    // console.log(await (await fetch('/api/tours')).json())//.then((res) => res.data))

    $(".city-card").click(function () {
        // if data-venue-id == current venue id then just close popup without going to a new page
        if ($(this).attr("data-venue-id") != venueID) {
            window.location.href = `/events/purchase/tour/${$(this).attr("data-tour-id")}/venue/${$(this).attr("data-venue-id")}`
        }
    })

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


    $("#purchase").click(function(e) {
        // temp solution - later get use seat ids from database both here and in stripe...
        let allProductIDs = [
            "prod_Nmi1R3RRdP2r5l",
            "prod_Nmi1R3RRdP2r5l",
            "prod_Nmi1R3RRdP2r5l",
            "prod_Nmi1R3RRdP2r5l",
        ]

        // use seat ids as selected
        let productIDs = allProductIDs.slice(0, parseInt($("input[name=qty]").val()))
        $("input[name='product-ids']").val(productIDs.join())
    })

    updateDates()
})

async function fetchData(url) {
    return await fetch(url)
                .then(res => res.json())
                .then(data => data)
}

async function updateDates() {
    selectedDateIDs = []
    $("input[name=date]:checked").each((i, elem) => {
        selectedDateIDs.push($(elem).val())
    })

    // the below allows for refreshing the page to keep the same dates and qty selected (noticed because I constantly refresh this page, thought it'd be nice)
    // https://stackoverflow.com/questions/824349/how-do-i-modify-the-url-without-reloading-the-page
    // https://developer.mozilla.org/en-US/docs/Web/API/History/pushState#change_a_query_parameter
    let url = new URL(location)
    // if (url.searchParams.has("qty")) url.searchParams.set("qty", url.searchParams.get("qty"))
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
    let dateQry = `[${selectedDateIDs.join(",")}]`

    ticketQty = $("input[name=qty]").val() // TODO constrain again just to be sure

    let url = `/api/available-seats?tour=${tourID}&dates=${dateQry}&qty=${ticketQty}`

    ticketResponse = await fetchData(url)
    $("#available-tickets").html("<p class='text-center h3 pt-5'>Loading...</p>")

    setTimeout(() => {

        if (ticketResponse.length > 0) {
            let context = {
                availableTickets: ticketResponse
            }
        
            renderTemplate($("#available-tickets"), "/views/available-tickets.hbs", context)
            .then(() => {

                $(".available-ticket-card").click(function() {
                    ticketResIndex = $(this).attr("data-index")
                    let context =  {
                        block: ticketResponse[ticketResIndex].block,
                        section: ticketResponse[ticketResIndex].section,
                        row: ticketResponse[ticketResIndex].row,
                        dates: ticketResponse[ticketResIndex].dates,
                        ticketGroups: ticketResponse[ticketResIndex].tickets,
                        singleTicket: ticketQty == 1,
                        tourID: tourID,
                        venueID: venueID
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

            })            
                    

        } else {
            let context = {}
            renderTemplate($("#available-tickets"), "/views/no-tickets.hbs", context)
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
            console.log("yep")
            $(elem).removeAttr("hidden")
        } 

        
    })

    console.log($("#select-seats-modal select[name=seats]").val())
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

    switch(popup.css('display')) {
        case "none":
            popup.css('display', 'flex')
            break;
        default:
            popup.css('display', 'none')
    }
}


// can store a max quantity in the database for each tour
let maxTickets = 4

function increaseQty() {
    const oldVal = qtyInput.val()
    let newVal = parseInt(qtyInput.val()) + 1
    if (newVal > maxTickets) newVal = maxTickets

    if (oldVal != newVal) {
        ticketQty = newVal
        // $("#filters").submit()
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