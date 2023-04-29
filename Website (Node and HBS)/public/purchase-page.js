const tourID = window.location.href.match(/tour\/(\d*)/)[1]
const venueID = window.location.href.match(/venue\/(\d*)/)[1]

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

    const qty = params.get("qty")
    $("input[name=qty]").val(!!qty ? qty : 2)
    $("#qty-span").text(!!qty ? qty : 2)
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
})

let selectedDateIDs = []

async function updateDates() {
    selectedDateIDs = []

    $("input[name=date]:checked").each((i, elem) => {
        selectedDateIDs.push($(elem).val())
    })

    // console.log(selectedDates)

    // let dates = await fetch(`/api/tours/${tourID}/venues/`)//${venueID}`)
    // dates = await dates.json()
    // console.log(dates)

    let dates = []

    // if (selectedDateIDs)

    for (let dateID of selectedDateIDs) {
        let date = await fetch(`/api/tours/${tourID}/dates/${dateID}`)
        date = await date.json()
        dates.push(...date)
    }

    console.log(dates)
    console.log("Selected dates: " + dates.map((date) => date.date))

    // now I think about it I don't need to do any of that
    // what I need to do is use selectedDatesIDs to get all available seats for this tour and this date that are available

    // something like /api/tours/tourID/dates/[dateIDs]/available
    // wondering if I should use query strings?
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
let qtyInput = $('input[name="qty"]')

function increaseQty() {
    const oldVal = qtyInput.val()
    let newVal = parseInt(qtyInput.val()) + 1
    if (newVal > maxTickets) newVal = maxTickets

    if (oldVal != newVal) {
        qtyInput.val(newVal)
        $("#filters").submit()
    }
}

function decreaseQty() {
    const oldVal = qtyInput.val()
    let newVal = parseInt(qtyInput.val()) - 1
    if (newVal < 1) newVal = 1

    if (oldVal != newVal) {
        qtyInput.val(newVal)
        $("#filters").submit()
    }
}

function disableQtyBtns() {
    $("#increase-tickets, #decrease-tickets").attr("disabled", false)

    if (qtyInput.val() <= 1) $("#decrease-tickets").attr("disabled", true)
    else if (qtyInput.val() >= maxTickets) $("#increase-tickets").attr("disabled", true)
}