$("document").ready(function() {
    $(".refund-btn").click(function() {
        const modalId = $(`#refund-modal-order-${$(this).attr("data-order-id")}`)

        $(modalId).removeClass("d-none")
        const order = JSON.parse($(this).attr("data-order"))
        console.log(order)
        $("input[name=order-id]").val($(this).attr("data-order-id"))

        const keepH4 = $("#refund-order-details h4")
        const orderDetails = $("#refund-order-details")
        const pClasses = "my-1 me-2 fw-300"
        orderDetails.empty()
        orderDetails.append(
            keepH4,
            `<p${pClasses}>${order.artist_name} ${order.tour_name}</p>`,
            `<p${pClasses}>${order.date}</p>`,
            `<p${pClasses}>Seat(s) ${order.seats.map(seat => seat.seat_number).join(", ")}</p>`,
            // `<p${pClasses}>${order.artist_name} ${order.tour_name}</p>`,

        )

        $("#order-details-event span:nth-of-type(2)").text(`${order.artist_name} ${order.tour_name}`)
    })

    $(".close-refund").click(function() {
        $(".refund-modal").addClass("d-none")
    })
})