import { fetchData } from './fetchData.js'

$(document).ready(async function() {

    $("body").css("background", "black") // easiest place to set a background - want to change to 

    let params = new URLSearchParams(window.location.search)
    let paramVenues = params.getAll('venue')

    for (let alert of params.getAll("alert")) {
        switch (alert) {
            case "success":
                $("p#info").addClass("d-none")
                $("p#alert-success").removeClass("d-none")
                break
            case "error":
                $("p#alert-error").removeClass("d-none")
                break
            case "email-error":
                $("p#alert-email-error").removeClass("d-none")
        }
    }

    // check any pre-selected venues from query string
    for (let venue of paramVenues) {
        if (!!venue) {
            $(`input[name=venues][value=${venue}]`).prop("checked", true)
        }

    }

    showHideDateSelect(null, false, false)

    // check any pre-selected dates from query string
    let paramDates = params.get("dates")?.replace(/\[|\]/g, "").split(",")
    $(".selectpicker").selectpicker("val", paramDates)

    $("input[name=venues]").on("input", function(e) {
        showHideDateSelect(e.target)
        $("#venue-error").addClass("d-none")
    })

    if (params.has("qty")) {
        $("#ticket-qty").val(params.get("qty"))
        limitQtyInput()
    }

    const tourID = window.location.pathname.match(/tour\/(\d)/)[1]
    const { max_tickets } = await fetchData(`/api/tours/${tourID}/max`)

    $("#ticket-qty").attr("max", max_tickets)
    $("#ticket-qty").on("focusout", limitQtyInput)
    $("#waiting-list-form").on("submit", (e) => formSubmit(e))
})

function limitQtyInput() {
    if (parseInt($("#ticket-qty").val()) > parseInt($("#ticket-qty").attr("max"))) {
        $("#ticket-qty").val($("#ticket-qty").attr("max"))
    }

    if (parseInt($("#ticket-qty").val()) < 1) {
        $("#ticket-qty").val(1)
    }
}

function formSubmit(e) {
    limitQtyInput()
    if ($("input[name=venues]:checked").length < 1) {
        $("#venue-error").removeClass("d-none")
        e.preventDefault()
    }
}

function showHideDateSelect(eventTarget, transition = true, openDates = true) {


    $("input[name=venues]").each((i, input) => {
        const venueID = $(input).attr("data-venue-id")

        let show = $(input).is(":checked")

        let picker = $(`select[data-venue-id=${venueID}]`)
        let parentSelect = $(`select[data-venue-id=${venueID}]`).parent(".bootstrap-select")

        parentSelect.css("opacity", show ? 1 : 0)

        if (show) {
            picker.attr("required", true)
            parentSelect.css("visibility", "visible")
            // picker.removeAttr("disabled")

            if (eventTarget != null && openDates && $(input).is($(eventTarget))) picker.selectpicker("toggle")
            
        } else {
            picker.removeAttr("required")
            // picker.attr("disabled", true)

            function hideAndDeselect() {
                parentSelect.css("visibility", "hidden")
                picker.selectpicker("deselectAll")
            }

            hideAndDeselect()
        }
    })
}