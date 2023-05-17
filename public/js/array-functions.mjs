export function stringifyArray(array, brackets = true) {
    let str = array.join(",")
    return brackets ? `[${str}]` : str
}

export function parseArray(str, intArray = true) {
    console.log("pa", str)
    if (!str || !str.length) return []
    let arr = str.replace(/\[|\]/g, "").split(",")
    return arr.map(a => isNaN(a) ? a : parseInt(a))
}