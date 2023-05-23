const user_id = parseInt($('meta[name="user-id"]').attr("content"))

$(document).ready(function() {
    $(".signup-btn").click(function() { signUpClick(this) })
    $(".unsignup-btn").click(function() { unsignupClick(this) })

    let currentUrl = new URL(location)

    if (currentUrl.searchParams.has("alert")) {
        const alert = currentUrl.searchParams.get("alert")
        $("#alert-success").removeClass("d-none")
        $(`#${alert}`).removeClass("d-none")

        currentUrl.searchParams.delete("alert")
        window.history.pushState({}, "", currentUrl)
    }
})

function signUpClick(elem) {
    const slot_id = parseInt($(elem).parent("div").attr("data-slot-id"))
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("alert", "signed-up")
    $.post("/api/slot-signup", { user_id, slot_id })
        .done(window.location.replace(newUrl))
}

function unsignupClick(elem) {
    const slot_id = parseInt($(elem).parent("div").attr("data-slot-id"))
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("alert", "signup-removed")
    $.post("/api/slot-signup/remove", { user_id, slot_id })
     .done(window.location.replace(newUrl))
}