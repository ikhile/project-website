$(document).ready(async () => {
    // this will get the tour background key and use it to set background image
    // if no background key provided, 
    // was previously using tour ID as name of background images - this ensures image matches if ids change e.g. when running schema again
    let bgName = $('meta[name="bg-name"]').attr("content") ?? "default.jpg"
    let url = `${window.location.origin}/images/tour-backgrounds/${bgName}`

    $.get(url)
        .fail(() => bgName = "default.jpg")
        .always(() => {
            $("body").css(
                "background-image", 
                `url("${window.location.origin}/images/tour-backgrounds/${bgName}")`
            )
        })    
})