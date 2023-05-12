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

function purchaseClick(isAuth, tour) {
    console.log(isAuth, tour)
    if (isAuth) {
        console.log("auth")
        $("#change-city-modal").removeClass("d-none")
        $("#change-city-modal").addClass("d-flex")
    } else {
        console.log("not auth")
        // window.location.href = `/events/purchase/tour`
        window.location.href = `/account/login?alert=to-purchase&redirect=/events/purchase/tour/${tour}&tour=${tour}`
    }
}