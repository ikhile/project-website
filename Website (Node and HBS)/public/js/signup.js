$(document).ready(function() {

    let params = new URLSearchParams(window.location.search)
    let paramVenues = params.getAll('venue')

    for (let venue of paramVenues) {
        if (!!venue) $(`input[name=venues][value=${venue}]`).prop("checked", true)
    }

    showHideDateSelect(false)
})

$("input[name=venues]").on("input", showHideDateSelect)

function showHideDateSelect(transition = true) {
    $("input[name=venues]").each((i, input) => {
        const venueID = $(input).attr("data-venue-id")

        // don't need - was using when I had a visible dates label for the selectpicker
        // let elems = [ // could use to then add same css to both
        //     $(`label[data-venue-id=${venueID}]`),
        //     $(`select[data-venue-id=${venueID}]`).parent(".bootstrap-select")
        // ]

        let show = $(input).is(":checked")
        let parentSelect = $(`select[data-venue-id=${venueID}]`).parent(".bootstrap-select")
        let picker = $(`select[data-venue-id=${venueID}]`)

        parentSelect.css("opacity", show ? 1 : 0)

        if (show) {
            parentSelect.css("visibility", "visible")
            picker.attr("required", true)
            
        } else {
            picker.removeAttr("required")

            const hideAndDeselect = () => {
                parentSelect.css("visibility", "hidden")
                picker.selectpicker("deselectAll")
            }

            // using on/one transitionend means element can fade out, and picker won't be seen to deselect while still visibile
            // having a transition parameter means they don't fade out on page load, they just aren't visible
            if (transition) parentSelect.one("transitionend", hideAndDeselect)
            else hideAndDeselect()

            // could jsut have them hidden in .hbs... but then they'll fade in anyway
        }
    })
}