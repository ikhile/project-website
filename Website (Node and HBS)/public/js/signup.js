$(document).ready(function() {
    showHideDateSelect()
})

$("input[name=venues]").on("input", () => {
    
    showHideDateSelect()
    

})

function showHideDateSelect() {
    $("input[name=venues]").each((i, input) => {
        const venueID = $(input).attr("data-venue-id")

        let elems = [ // could use to then add same css to both
            $(`label[data-venue-id=${venueID}]`),
            $(`select[data-venue-id=${venueID}]`).parent(".bootstrap-select")
        ]

        let show = $(input).is(":checked")
        let parentSelect = $(`select[data-venue-id=${venueID}]`).parent(".bootstrap-select")

        // elems.forEach((elem) => {

        //     $(elem).css({opacity: show ? 1 : 0})

        //     if (show) {
        //         $(elem).css({visibility: "visible"})

        //     } else {
        //         $(elem).one("transitionend", function() {
        //             $(elem).css({visibility: "hidden"})
        //             $(`select[data-venue-id=${venueID}]`).selectpicker("deselectAll")
        //         })


        //     }
        // })

        parentSelect.css("opacity", show ? 1 : 0)

        if (show) {
            parentSelect.css("visibility", "visible")
            $(`select[data-venue-id=${venueID}]`).attr("required", true)
            
        } else {
            $(`select[data-venue-id=${venueID}]`).removeAttr("required")

            // using on/one transitionend means element can fade out, and picker won't be seen to deselect while still visibile
            parentSelect.one("transitionend", function() {
                parentSelect.css("visibility", "hidden")
                $(`select[data-venue-id=${venueID}]`).selectpicker("deselectAll")
            })

        }

        console.log($(`select[data-venue-id=${venueID}]`).find("option").prop("selected"))
        // console.log($(`select[data-venue-id=${venueID}]`).attr)
        // let setVis = $(input).is(":checked") ? "visible" : "hidden"
        // let setOpac = $(input).is(":checked") ? 1 : 0

        // $(`label[data-venue-id=${venueID}]`).css({ visibility: setVis, opacity: setOpac })
        // $(`select[data-venue-id=${venueID}]`).parent(".bootstrap-select").css({ visibility: setVis, opacity: setOpac })
    })
}