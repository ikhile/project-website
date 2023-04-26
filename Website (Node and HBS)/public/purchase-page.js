$(document).ready(async function () {
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
        $("#date-filter button[type=submit]").attr("disabled", false)
    })

    $("#increase-tickets").click(function() {
        increaseQty()
    })

    $("#decrease-tickets").click(function() {
        decreaseQty()
    })

    $("#filters input").on("input", function() {
        $("#filters").submit()
    })

    $("#purchase").click(function(e) {
        // temp solution - later get use seat ids from database both here and in stripe...
        let allProductIDs = [
            "prod_Nmi1R3RRdP2r5l",
            "2",
            "3",
            "4",
        ]

        // use seat ids as selected
        let productIDs = allProductIDs.slice(0, parseInt($("input[name=qty]").val()))
        $("input[name='product-ids']").val(productIDs.join())
    })
})

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