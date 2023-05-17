const user_id = parseInt($('meta[name="user-id"]').attr("content"))

$(document).ready(function() {
    $(".signup-btn").click(function() { signUpClick(this) })
    $(".unsignup-btn").click(function() { unsignupClick(this) })

    let currentUrl = new URL(location)
    console.log(currentUrl)

    if (currentUrl.searchParams.has("alert")) {

        console.log(currentUrl.searchParams.getAll("alert"))

        // switch (currentUrl.searchParams.get("alert")){
        //     case "signed-up":
        //         $("#alert-success").removeClass("d-none")
        //         $("#signed-up").removeClass("d-none")
        //         break
                
        //     case "signup-removed":
        //         $("#alert-success").removeClass("d-none")
        //         $("#removed-signup").removeClass("d-none")
        //         break
        // }

        const alert = currentUrl.searchParams.get("alert")
        $("#alert-success").removeClass("d-none")
        $(`#${alert}`).removeClass("d-none")

        currentUrl.searchParams.delete("alert")
        console.log(currentUrl)
        window.history.pushState({}, "", currentUrl)
    }
})

// DRY the below two functions - can surely combine somehow

function signUpClick(elem) {
    const slot_id = parseInt($(elem).parent("div").attr("data-slot-id"))
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("alert", "signed-up")
    // newUrl.searchParams.set("slot-id", slot_id)
    $.post("/api/slot-signup", { user_id, slot_id })
        .done(window.location.replace(newUrl))
}

function unsignupClick(elem) {
    const slot_id = parseInt($(elem).parent("div").attr("data-slot-id"))
    console.log(slot_id)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("alert", "signup-removed")
    // newUrl.searchParams.set("slot-id", slot_id)
    $.post("/api/slot-signup/remove", { user_id, slot_id })
     .done(window.location.replace(newUrl))
}