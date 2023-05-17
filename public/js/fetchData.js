export async function fetchData(url) {
   return await fetch(url)
            .then(res => res.json())
            .then(data => data)
}