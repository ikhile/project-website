$(document).ready(() => {
    // $("#purchase").click(function() {
    //     // console.log({{isAuth req}})
    //     $("#change-city-modal").removeClass("d-none")
    //     $("#change-city-modal").addClass("d-flex")
    // })

    $("#change-city-modal").click(function() {
        $(this).addClass("d-none")
        $(this).removeClass("d-flex")
    })

    $(".city-card").click(function () {
        window.location.href = `/events/purchase/tour/${$(this).attr("data-tour-id")}/queue?venue=${$(this).attr("data-venue-id")}`
    })
})

function purchaseClick(isAuth, tour, venue = null) {
    if (isAuth) {
        $("#change-city-modal").removeClass("d-none")
        $("#change-city-modal").addClass("d-flex")

    } else {
        console.log(`/account/login?alert=to-purchase&redirect=/events/purchase/tour/${tour}/queue` + (!!venue ? `&venue=${venue}` : ""))
        window.location.href = `/account/login?alert=to-purchase&redirect=/events/purchase/tour/${tour}/queue` + (!!venue ? `?venue=${venue}` : "")
    }
}