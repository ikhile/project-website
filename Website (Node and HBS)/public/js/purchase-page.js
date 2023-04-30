// import { fetchData } from "./fetchData"
const tourID = window.location.href.match(/tour\/(\d*)/)[1]
const venueID = window.location.href.match(/venue\/(\d*)/)[1]
let selectedDateIDs = []
let ticketQty
let qtyInput = $('input[name="qty"]')

$(document).ready(async function () {
    console.log(tourID, venueID)
    $("#change-city-btn").click(toggleCityPopup)
    $("#change-city-popup").click(toggleCityPopup)

    // getting from API/db
    const tours = await fetch('/api/tours')
    console.log(await tours.json())//.then((res) => res.data))
    console.log(await (await fetch('/api/tours')).json())//.then((res) => res.data))

    $(".city-card").click(function () {
        // if data-venue-id == current venue id then just close popup without going to a new page
        window.location.href = `/events/purchase/tour/${$(this).attr("data-tour-id")}/venue/${$(this).attr("data-venue-id")}`
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
    $("input[name=date]").on("input", function() {
        updateDates()

        $("#date-filter button[type=submit]").attr("disabled", false)
    })

    $("#increase-tickets").click(function() {
        increaseQty()
    })

    $("#decrease-tickets").click(function() {
        decreaseQty()
    })

    $("#filters input").on("input", function() {
        // $("#filters").submit()
    })

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
    $("input[name=date]:checked").each((i, elem) => {
        selectedDateIDs.push($(elem).val())
    })

    updateAvailableSeats()
}

async function updateAvailableSeats() {
    let dateQry = `[${selectedDateIDs.join(",")}]`

    ticketQty = $("input[name=qty]").val() // constrain again just to be sure

    let url = `/api/available-seats?tour=${tourID}&dates=${dateQry}&qty=${ticketQty}`

    let response = await fetchData(url)
    let context = {
        availableTickets: response
    }

    // https://stackoverflow.com/a/28452343
    $.get("/views/available-tickets.hbs", function (data) {
        console.log(data)
        var template = Handlebars.compile(data);
        $("#available-tickets").html(template(context));
    }, 'html')
    console.log(await response)
}

function toggleCityPopup() {
    let popup = $('#change-city-popup')

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
}

function disableQtyBtns() {
    $("#increase-tickets, #decrease-tickets").attr("disabled", false)

    if (qtyInput.val() <= 1) $("#decrease-tickets").attr("disabled", true)
    else if (qtyInput.val() >= maxTickets) $("#increase-tickets").attr("disabled", true)
}