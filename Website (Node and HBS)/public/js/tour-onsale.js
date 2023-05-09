$(document).ready(() => {
    $("#purchase").click(function() {
        $("#change-city-modal").show()
    })

    $("#change-city-modal").click(function() {
        $(this).hide()
    })

    $(".city-card").click(function () {
        window.location.href = `/events/purchase/tour/${$(this).attr("data-venue-id")}/queue?venue=${$(this).attr("data-venue-id")}`
    })
})